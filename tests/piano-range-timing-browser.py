"""Focused STAF-63 P2-1/P2-2/P3 checks against build output on localhost:8763.

Run with webapp-testing/scripts/with_server.py; P2_PHASE=before|after labels evidence.
PIANO_CHROMIUM optionally selects an installed Chromium executable.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(os.environ.get('PIANO_EVIDENCE', '../p2-evidence')).resolve()
out.mkdir(parents=True, exist_ok=True)
phase = os.environ.get('P2_PHASE', 'after')
result = {'phase': phase, 'failures': [], 'highlights': []}
url = 'http://127.0.0.1:8763'

def check(condition, message):
    if not condition:
        result['failures'].append(message)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=os.environ.get('PIANO_CHROMIUM'))
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://**', lambda route: route.abort())
    page.goto(url+'/songs/fur-elise/', wait_until='networkidle')
    page.wait_for_function('Boolean(window.pianoStudio)')
    page.evaluate('window.pianoStudio.piano.setRange(3,true)')
    for note in ['C6', 'C7', 'C6', 'B5', 'A5', 'G5']:
        page.evaluate('(note)=>window.pianoStudio.practice.highlightKey(note)', note)
        # Separate frames and wall-clock time expose a smooth scroll that
        # overwrites the synchronous highlight position after evaluate returns.
        page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
        page.wait_for_timeout(300)
        measured = page.evaluate('''() => {
          const piano=window.pianoStudio.piano,key=document.querySelector('.key.current');
          const k=key.getBoundingClientRect(),v=piano.keyboardViewport.getBoundingClientRect();
          return {note:key.dataset.note,width:k.width,visible:Math.max(0,Math.min(k.right,v.right)-Math.max(k.left,v.left)),scrollLeft:piano.keyboardViewport.scrollLeft};
        }''')
        result['highlights'].append(measured)
        check(measured['note']==note and abs(measured['visible']-measured['width'])<.1,
              f"P2-1 {note}: visible={measured['visible']}/{measured['width']} after 300ms")
        if note == 'C6':
            page.locator('[data-studio]').screenshot(path=str(out/f'{phase}-C6.png'))
    page.evaluate('window.pianoStudio.practice.clearKeyHighlight();window.pianoStudio.piano.setRange(3)')
    page.locator('[data-octave="1"]').click()
    check(page.evaluate('window.pianoStudio.piano.startOctave')==4, 'Mobile octave increment regressed')
    page.locator('[data-octave="-1"]').click()
    check(page.evaluate('window.pianoStudio.piano.startOctave')==3, 'Mobile octave decrement regressed')
    result['mobile'] = page.evaluate('''() => ({keys:document.querySelectorAll('.keys .key').length,width:document.querySelector('.key.white').getBoundingClientRect().width,label:document.querySelector('.studio-range > span').textContent})''')
    check(result['mobile']['keys']==25 and result['mobile']['width']==40, 'Mobile 25 keys / 40px changed')
    check('用两侧箭头切换音区' in result['mobile']['label'], 'P3 mobile range hint missing')
    page.set_viewport_size({'width': 768, 'height': 1024})
    page.wait_for_function('Object.keys(window.pianoStudio.piano.keys).length===37')
    page.wait_for_timeout(300)
    result['tablet'] = page.evaluate('''() => {
      const v=document.getElementById('keyboard-viewport');
      return {keys:document.querySelectorAll('.keys .key').length,client:v.clientWidth,content:v.scrollWidth,start:v.scrollLeft,
        buttons:[...document.querySelectorAll('[data-octave]')].map(b=>({visible:getComputedStyle(b).visibility==='visible',enabled:!b.disabled}))};
    }''')
    usable = all(b['visible'] and b['enabled'] for b in result['tablet']['buttons'])
    check(usable, 'P2-2 tablet arrows hidden or disabled')
    if usable:
        for _ in range(3):
            page.locator('[data-octave="1"]').click()
            page.wait_for_timeout(400)
        result['tablet']['right'] = page.evaluate('''() => {
          const v=document.getElementById('keyboard-viewport'),k=document.querySelector('.keys .key:last-child').getBoundingClientRect(),r=v.getBoundingClientRect();
          return {scrollLeft:v.scrollLeft,max:v.scrollWidth-v.clientWidth,visible:Math.max(0,Math.min(k.right,r.right)-Math.max(k.left,r.left)),width:k.width};
        }''')
        right = result['tablet']['right']
        check(right['scrollLeft']>result['tablet']['start'] and abs(right['scrollLeft']-right['max'])<1
              and abs(right['visible']-right['width'])<.1, 'P2-2 tablet arrow cannot reach full C6')
        page.locator('[data-studio]').screenshot(path=str(out/f'{phase}-tablet-right.png'))
        page.locator('[data-octave="-1"]').click()
        page.wait_for_timeout(400)
        check(page.evaluate('document.getElementById("keyboard-viewport").scrollLeft') < right['scrollLeft'], 'Tablet left arrow cannot scroll back')
    page.set_viewport_size({'width': 1280, 'height': 800})
    page.wait_for_timeout(300)
    result['desktop'] = page.evaluate('''() => {
      const v=document.getElementById('keyboard-viewport');return {keys:document.querySelectorAll('.keys .key').length,client:v.clientWidth,content:v.scrollWidth,label:document.querySelector('.studio-range > span').textContent,arrowsHidden:[...document.querySelectorAll('[data-octave]')].every(b=>getComputedStyle(b).visibility==='hidden')};
    }''')
    desktop = result['desktop']
    check(desktop['keys']==37 and desktop['content']<=desktop['client'] and desktop['arrowsHidden'], 'Desktop 37 keys / no overflow / hidden arrows regressed')
    check('37' in desktop['label'], 'P3 desktop key count missing')
    result['page_errors'] = errors
    check(not errors, f'Page errors: {errors}')
    browser.close()

(out/f'{phase}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False, indent=2))
assert not result['failures'], '\n'.join(result['failures'])
