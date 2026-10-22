"""Run against a built dist server. Requires Python playwright + Chromium.

PIANO_TEST_URL=http://127.0.0.1:4173 python scripts/ui-article-cta.py
Artifacts default to ui-artifacts/article-cta; override ARTICLE_CTA_ARTIFACTS.
Google's real gtag script runs, but collect requests are captured and fulfilled
locally so verification does not send test analytics to the production property.
"""
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ.get('PIANO_TEST_URL', 'http://127.0.0.1:4173')
OUT = Path(os.environ.get('ARTICLE_CTA_ARTIFACTS', 'ui-artifacts/article-cta'))
OUT.mkdir(parents=True, exist_ok=True)
report = {'layouts': [], 'events': [], 'fallbacks': [], 'errors': [], 'dom': {}}


def inspect(page):
    return page.locator('.article-header .article-cta-primary').evaluate('''el => {
      const r = el.getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,
        viewport:innerHeight, scrollWidth:document.documentElement.scrollWidth,
        innerWidth, text:el.textContent, href:el.getAttribute('href'),
        unobscured:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),
        whiteSpace:getComputedStyle(el).whiteSpace,
        solid:getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'};
    }''')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=os.environ.get('BROWSER_EXECUTABLE'))
    try:
        context = browser.new_context()
        # Block remote requests for layout/fallback tests; analytics gets its
        # own context below that loads only Google's gtag library.
        context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
        page = context.new_page()
        page.on('pageerror', lambda error: report['errors'].append(str(error)))
        for width, height in [(390, 844), (1280, 800)]:
            page.set_viewport_size({'width': width, 'height': height})
            for prefix, locale in [('', 'zh-CN'), ('en/', 'en')]:
                for file in sorted(Path('dist', prefix, 'articles/tutorials').glob('*.html')):
                    route = '/' + str(file.relative_to('dist'))
                    page.goto(BASE + route, wait_until='networkidle')
                    info = inspect(page)
                    info.update({'route': route, 'viewportWidth': width})
                    report['layouts'].append(info)
                    assert info['height'] >= 44 and info['solid'], info
                    assert info['y'] >= 0 and info['bottom'] <= height and info['unobscured'], info
                    assert info['scrollWidth'] <= width, info
                    assert info['whiteSpace'] == 'nowrap', info
                    if file.stem == 'piano-basics':
                        page.screenshot(path=str(OUT / f'{locale}-{width}.png'))
                        report['dom'][locale] = page.locator('.article-header').inner_html()
            # Check no-gtag fallback for both locales after visual inspection.
        for prefix, locale in [('', 'zh-CN'), ('en/', 'en')]:
            route = f'/{prefix}articles/tutorials/piano-basics.html'
            target = f'/{prefix}#practice-start'
            page.goto(BASE + route, wait_until='networkidle')
            page.evaluate('window.gtag = undefined')
            page.locator('[data-article-cta-link]').click()
            page.wait_for_url(BASE + target)
            report['fallbacks'].append({'locale': locale, 'mode': 'gtag undefined', 'url': page.url})
        context.close()

        context = browser.new_context(java_script_enabled=False)
        context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
        page = context.new_page()
        for prefix, locale in [('', 'zh-CN'), ('en/', 'en')]:
            page.goto(BASE + f'/{prefix}articles/tutorials/piano-basics.html')
            page.locator('[data-article-cta-link]').click()
            page.wait_for_url(BASE + f'/{prefix}#practice-start')
            report['fallbacks'].append({'locale': locale, 'mode': 'JavaScript disabled', 'url': page.url})
        context.close()

        for prefix, locale in [('', 'zh-CN'), ('en/', 'en')]:
            context = browser.new_context()
            events = []

            def handle(route):
                request = route.request
                url = urlparse(request.url)
                if url.path.endswith('/collect'):
                    combined = url.query + '&' + (request.post_data or '')
                    # GA may batch events, with per-event params on new lines.
                    common = parse_qs(url.query)
                    for line in combined.splitlines():
                        params = {**common, **parse_qs(line)}
                        if params.get('en') == ['article_cta_click']:
                            events.append(params)
                    route.fulfill(status=204, body='')
                elif request.url.startswith(BASE) or url.hostname == 'www.googletagmanager.com':
                    route.continue_()
                else:
                    route.abort()

            context.route('**/*', handle)
            page = context.new_page()
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            page.goto(BASE + f'/{prefix}articles/tutorials/piano-basics.html', wait_until='networkidle')
            # The GA library installs google_tag_manager once downloaded.
            page.wait_for_function("window.google_tag_manager && window.google_tag_manager['G-EYGD99YB4Y']", timeout=30000)
            # Keep the document open only for request inspection: GA4 batches
            # events and browser routing can drop beacons during document teardown.
            # Native navigation is tested independently above without this hook.
            page.locator('[data-article-cta-link]').evaluate("el => el.addEventListener('click', e => e.preventDefault())")
            with page.expect_response(lambda res: '/collect' in res.url and 'article_cta_click' in (res.url + (res.request.post_data or '')), timeout=20000):
                page.locator('[data-article-cta-link]').click()
            assert len(events) == 1, events
            event = events[0]
            assert event['ep.article_slug'] == ['piano-basics'], event
            assert event['ep.locale'] == [locale], event
            assert event['ep.position'] == ['hero'], event
            page.goto(BASE + f'/{prefix}#practice-start', wait_until='domcontentloaded')
            # Keep only event parameters; omit GA client identifiers.
            result = {k: event[k][0] for k in ['en', 'ep.article_slug', 'ep.locale', 'ep.position']}
            report['events'].append(result)
            page.goto(BASE + f'/{prefix}articles/tutorials/piano-basics.html', wait_until='networkidle')
            page.evaluate('''event => {
              const output = document.createElement('pre');
              output.textContent = 'Captured GA4 collect request (fulfilled locally):\\n' + JSON.stringify(event,null,2);
              output.style.cssText = 'background:white;border:2px solid #1a73e8;padding:16px;white-space:pre-wrap';
              document.querySelector('.article-header').append(output);
            }''', result)
            page.screenshot(path=str(OUT / f'{locale}-collect.png'))
            context.close()
        assert not report['errors'], report['errors']
        print(f"PASS: {len(report['layouts'])} layouts, {len(report['events'])} real gtag collect events, {len(report['fallbacks'])} fallback navigations; no page errors")
    finally:
        browser.close()
        (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
