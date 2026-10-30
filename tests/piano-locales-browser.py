"""Six-language piano acceptance against the built site, with real audio files.

Serve dist at :8768. Set PIANO_TEST_URL to test an alternate deployment.
"""
import json
import os
import wave
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('PIANO_TEST_URL', 'http://127.0.0.1:8768').rstrip('/')
LAYOUT_ONLY = os.environ.get('PIANO_LAYOUT_ONLY') == '1'
OUT = Path('ui-artifacts/six-language-piano-20261029').resolve()
OUT.mkdir(parents=True, exist_ok=True)
COPY = {
    'ru': ['Записать', 'Остановить запись', 'Сыграть ещё раз', 'Верно', 'Мелодия сыграна!'],
    'fr': ['Enregistrer', 'Arrêter l’enregistrement', 'Recommencer', 'Correctes', 'Morceau terminé !'],
    'es': ['Grabar', 'Detener grabación', 'Practicar de nuevo', 'Correctas', '¡Canción completada!'],
    'ja': ['録音する', '録音を止める', 'もう一度練習', '正解', '最後まで弾けました！'],
    'it': ['Registra', 'Ferma registrazione', 'Esercitati ancora', 'Corrette', 'Brano completato!'],
    'ko': ['녹음 시작', '녹음 중지', '다시 연습', '정답', '곡 완주!'],
}
report = {'layouts': [], 'flows': {}, 'errors': []}

def ready(page, route):
    response = page.goto(BASE + route, wait_until='networkidle')
    assert response.status == 200, route
    page.wait_for_function('window.pianoStudio?.recorder && document.querySelectorAll(".key").length > 0')

def layout(page, locale, width):
    bounds = page.evaluate('''() => ({
      width:innerWidth,scroll:document.documentElement.scrollWidth,
      keys:document.querySelectorAll('.key').length,
      h1:document.querySelectorAll('h1').length,
      recorderOverflow:document.querySelector('.studio-recorder').scrollWidth > document.querySelector('.studio-recorder').clientWidth,
      toolbarOverflow:document.querySelector('.studio-toolbar').scrollWidth > document.querySelector('.studio-toolbar').clientWidth,
      menuEntries:document.querySelectorAll('.studio-lang-option').length,
    })''')
    assert bounds['h1'] == 1 and bounds['menuEntries'] == 9, bounds
    assert bounds['keys'] == (25 if width <= 640 else 37), bounds
    assert bounds['scroll'] <= width + 1 and not bounds['recorderOverflow'] and not bounds['toolbarOverflow'], (locale, bounds)
    report['layouts'].append({'locale': locale, **bounds})

def flow(page, locale, width):
    labels = COPY[locale]
    assert page.locator('[data-record-toggle]').inner_text() == labels[0]
    page.locator('[data-quick-song="twinkle"]').click()
    page.wait_for_function('window.pianoStudio.practice.isPlaying')
    page.evaluate('''() => {
      const {piano,practice}=window.pianoStudio;
      piano.pressKey(practice.currentSong.notes[0]);
      piano.releaseKey(practice.currentSong.notes[0]);
    }''')
    assert labels[3] in page.locator('#correct-notes').inner_text()
    page.evaluate('''() => {
      const {piano,practice}=window.pianoStudio;
      for (const note of practice.currentSong.notes.slice(practice.currentNoteIndex)) {
        piano.pressKey(note);piano.releaseKey(note);
      }
    }''')
    page.wait_for_selector('.practice-result-modal')
    assert labels[4] in page.locator('#practice-result-title').inner_text()
    assert page.locator('[data-action="retry"]').inner_text() == labels[2]
    page.locator('[data-action="close"]').click()
    page.locator('[data-play-mode="free"]').click()
    page.locator('[data-record-toggle]').click()
    page.wait_for_function('window.pianoStudio.recorder.state === "recording"')
    assert page.locator('[data-record-toggle]').inner_text() == labels[1]
    for key in ['a', 's', 'd']:
        page.keyboard.down(key)
        page.wait_for_timeout(170)
        page.keyboard.up(key)
        page.wait_for_timeout(80)
    page.locator('[data-record-toggle]').click()
    page.wait_for_function('window.pianoStudio.recorder.state === "ready"')
    audio = page.evaluate('''async () => {
      const {piano,recorder}=window.pianoStudio;
      const decoded=await piano.audio.context.decodeAudioData(await recorder.result.blob.arrayBuffer());
      let peak=0;for(const value of decoded.getChannelData(0))peak=Math.max(peak,Math.abs(value));
      return {mime:recorder.result.blob.type,bytes:recorder.result.blob.size,peak,seconds:decoded.duration};
    }''')
    assert audio['peak'] > 0.001 and audio['bytes'] > 1000, audio
    page.locator('.studio-recorder audio').evaluate('(audio)=>audio.play()')
    page.wait_for_function('document.querySelector(".studio-recorder audio").currentTime > 0.1')
    page.locator('.studio-recorder audio').evaluate('(audio)=>audio.pause()')
    with page.expect_download() as download:
        page.locator('[data-record-download]').click()
    source_path = OUT / f'{locale}-{width}.webm'
    download.value.save_as(str(source_path))
    assert source_path.stat().st_size == audio['bytes']
    with page.expect_download() as download:
        page.locator('[data-record-wav]').click()
    wav_path = OUT / f'{locale}-{width}.wav'
    download.value.save_as(str(wav_path))
    with wave.open(str(wav_path), 'rb') as wav:
        assert wav.getsampwidth() == 2 and wav.getnframes() > 0
    layout(page, locale, width)
    page.locator('[data-studio]').screenshot(path=str(OUT / f'{locale}-{width}-piano.png'))
    report['flows'][f'{locale}-{width}'] = audio
    print(f'PASS {locale} {width}: practice result, real recording, replay, original and WAV downloads', flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=os.environ.get('PIANO_CHROMIUM'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, accept_downloads=True)
    context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
    page = context.new_page()
    page.on('pageerror', lambda error: report['errors'].append(str(error)))
    for locale in COPY:
        ready(page, f'/{locale}/')
        layout(page, locale, 1280)
        if not LAYOUT_ONLY:
            flow(page, locale, 1280)
        if locale == 'ru' and not LAYOUT_ONLY:
            # Check the physical-key fallback while the OS key is Cyrillic.
            page.evaluate('''() => document.dispatchEvent(new KeyboardEvent('keydown',{key:'ф',code:'KeyA',bubbles:true}))''')
            assert page.locator('.key.active').count() == 1
            page.evaluate('''() => document.dispatchEvent(new KeyboardEvent('keyup',{key:'ф',code:'KeyA',bubbles:true}))''')
    for width in [320, 390]:
        page.set_viewport_size({'width': width, 'height': 844})
        for locale in COPY:
            ready(page, f'/{locale}/')
            layout(page, locale, width)
            page.locator('.studio-lang summary').click()
            last_language = page.locator('.studio-lang-option[href]').last
            last_language.scroll_into_view_if_needed()
            assert last_language.is_visible()
            page.keyboard.press('Escape')
            if not LAYOUT_ONLY and width == 390 and locale in ['ru', 'ja']:
                flow(page, locale, width)
            else:
                page.locator('[data-studio]').screenshot(path=str(OUT / f'{locale}-{width}-piano.png'))
    for route in ['/', '/en/', '/zh-hant/']:
        ready(page, route)
        assert page.locator('.studio-lang-option').count() == 9
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    assert not report['errors'], report['errors']
    (OUT / ('layout-report.json' if LAYOUT_ONLY else 'report.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({'flows':len(report['flows']),'layouts':len(report['layouts']),'errors':report['errors']}), flush=True)
    browser.close()
