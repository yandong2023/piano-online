"""Run against npm run build output, served on :8763; requires Python Playwright.

PIANO_EVIDENCE=/path/out python tests/mobile-piano-browser.py
Uses real Web Audio, cold contexts, CDP cache disabling and native pointer input.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(os.environ.get('PIANO_EVIDENCE', '../evidence')).resolve()
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:8763'
report = {}

def metrics(page):
    return page.evaluate('''() => ({
      range: document.querySelector('.studio-range > span').textContent,
      keys: document.querySelectorAll('.keys .key').length,
      whites: [...document.querySelectorAll('.key.white')].map(k=>k.getBoundingClientRect().width),
      buttons: [...document.querySelectorAll('[data-octave]')].map(k=>({width:k.getBoundingClientRect().width,height:k.getBoundingClientRect().height})),
      labelsHidden: [...document.querySelectorAll('.key-label')].every(k=>getComputedStyle(k).display==='none'),
      state: window.pianoStudio.piano.audio.context?.state,
      buffers: window.pianoStudio.piano.audio.buffers.size
    })''')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=os.environ.get('PIANO_CHROMIUM'),
                                args=['--autoplay-policy=document-user-activation-required'])
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True,
                              record_har_path=str(OUT / 'cold-network.har'))
    page = ctx.new_page()
    # Keep analytics/ads out of this local functional run.
    page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(URL) else route.abort())
    errors, console = [], []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.on('console', lambda msg: console.append(msg.text))
    cdp = ctx.new_cdp_session(page)
    cdp.send('Network.enable')
    cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    page.add_init_script('''
      document.addEventListener('pointerdown', e => {
        if(e.target.closest?.('.key')) window.inputStartedAt = performance.now();
      }, true);
      for(const type of [AudioBufferSourceNode, OscillatorNode]) {
        const original=type.prototype.start;
        type.prototype.start=function(...args){
          if(window.inputStartedAt && !window.firstStart)
            window.firstStart={inputToStartMs:performance.now()-window.inputStartedAt, audioTime:this.context.currentTime};
          return original.apply(this,args);
        };
      }
    ''')
    page.goto(URL, wait_until='networkidle')
    page.wait_for_function('window.pianoStudio?.piano.audio.buffers.size === 19')
    before = metrics(page)
    assert before['range'] == 'C3–C5' and before['keys'] == 25, before
    assert min(before['whites']) >= 40, before
    assert before['labelsHidden'] and all(b['width'] >= 44 and b['height'] >= 44 for b in before['buttons'])
    assert before['state'] in ['suspended', 'running'], before
    resources = page.evaluate("performance.getEntriesByType('resource').filter(r=>r.name.includes('/samples/piano-')).map(r=>({name:r.name.split('/').pop(),start:r.startTime,end:r.responseEnd,bytes:r.transferSize}))")
    assert len(resources) == 19 and all(r['end'] > 0 for r in resources)
    assert not page.evaluate('Boolean(window.firstStart)')
    report['AC1_before_input'] = {'metrics': before, 'network': resources}
    page.screenshot(path=str(OUT / 'mobile-390.png'), full_page=True)
    network = ctx.new_page()
    rows = ''.join(f"<tr><td>{r['name']}</td><td>{r['start']:.1f}</td><td>{r['end']:.1f}</td><td>{r['bytes']}</td></tr>" for r in resources)
    network.set_viewport_size({'width': 900, 'height': 900})
    network.set_content('<style>body{font:16px monospace;padding:24px}td,th{padding:5px 16px;text-align:left}h1{font-size:22px}</style><h1>STAF-63 cold network: BEFORE first input</h1><p>CDP cacheDisabled=true; AudioContext '+before['state']+'; 19 decoded samples.</p><table><tr><th>Real resource timing</th><th>start ms</th><th>end ms</th><th>bytes</th></tr>'+rows+'</table>')
    network.screenshot(path=str(OUT / 'network-before-input.png'))
    network.close()
    # Native touch triggers the actual pointerdown listener, including audio resume.
    page.locator('.key[data-note="C4"]').tap(position={'x': 20, 'y': 170})
    page.wait_for_function('window.firstStart && window.pianoStudio.piano.audio.context.state === "running"')
    report['AC1_first_attack'] = page.evaluate('window.firstStart')
    # Record the threshold independently, then exercise the remaining ACs even
    # if the host audio device makes resume slower than the target.
    report['AC1_under_100ms'] = report['AC1_first_attack']['inputToStartMs'] < 100
    report['console_first_attack'] = [s for s in console if '[piano:first-attack]' in s]

    for direction, expected in [('1','C4–C6'),('1','C5–C7'),('-1','C4–C6'),('-1','C3–C5'),('-1','C2–C4'),('-1','C1–C3')]:
        page.locator(f'[data-octave="{direction}"]').click()
        assert metrics(page)['range'] == expected
    assert page.locator('[data-octave="-1"]').is_disabled()
    page.locator('[data-octave="1"]').click()
    page.locator('[data-octave="1"]').click()
    report['octave_bounds'] = 'C1–C3 through C5–C7, button state and text synchronized'
    # Re-render while a real pointer is held must not strand an audio note.
    page.locator('.key[data-note="C3"]').scroll_into_view_if_needed()
    box = page.locator('.key[data-note="C3"]').bounding_box()
    page.mouse.move(box['x']+20, box['y']+170)
    page.mouse.down()
    page.evaluate('window.pianoStudio.piano.setRange(4)')
    page.mouse.up()
    assert page.evaluate('window.pianoStudio.piano.audio.pressedNotes.size') == 0
    page.evaluate('window.pianoStudio.piano.setRange(3); window.pianoStudio.piano.ensureNoteVisible("C3")')
    # Actual two-finger chord on independently sized white keys.
    points = []
    for idx, note in enumerate(['C3', 'E3']):
        box = page.locator(f'.key[data-note="{note}"]').bounding_box()
        points.append({'x': box['x']+20, 'y': box['y']+170, 'id': idx+1})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': points})
    assert set(page.evaluate('[...window.pianoStudio.piano.audio.pressedNotes]')) == {'C3', 'E3'}
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    assert page.evaluate('window.pianoStudio.piano.audio.pressedNotes.size') == 0
    report['multitouch_and_release'] = 'C3/E3 native two-finger chord and range-change release passed'

    page.locator('[data-play-mode="guided"]').click()
    report['songs'] = {}
    for song in ['fur-elise', 'canon']:
        page.locator('#song-select').select_option(song)
        page.locator('#start-practice').click()
        page.screenshot(path=str(OUT / f'guided-{song}-390.png'), full_page=True)
        result = page.evaluate('''() => {
          const {piano,practice}=window.pianoStudio; let count=0,high=0;
          const total=practice.currentSong.notes.length;
          while(practice.isPlaying && count <= total){
            const note=practice.currentSong.notes[practice.currentNoteIndex];
            const key=document.querySelector('.key.current');
            if(!key || key.dataset.note!==note) throw Error(`Lost highlight: ${note}`);
            const b=key.getBoundingClientRect(), v=piano.keyboardViewport.getBoundingClientRect();
            if(b.left<v.left-.5 || b.right>v.right+.5) throw Error(`Offscreen highlight: ${note} ${b.left} ${b.right}`);
            if(Number(note.at(-1))>=5) high++;
            piano.pressKey(note);piano.releaseKey(note);count++;
          }
          if(count!==total || practice.correctNotes!==total) throw Error('Song incomplete');
          practice.closeResultModal();return {total,count,high,wrong:practice.wrongNotes};
        }''')
        report['songs'][song] = result

    # The shared highlight method itself, without Studio's practice-event listener.
    report['shared_highlight'] = page.evaluate('''() => {
      const {piano,practice}=window.pianoStudio;
      for(const note of ['C1','C#1','G5','C7','C3']) {
        practice.highlightKey(note);
        const key=document.querySelector('.key.current'),b=key?.getBoundingClientRect(),v=piano.keyboardViewport.getBoundingClientRect();
        if(key?.dataset.note!==note || b.left<v.left-.5 || b.right>v.right+.5) throw Error(`Shared highlight ${note}`);
      }
      practice.clearKeyHighlight();return 'C1/C#1/G5/C7/C3 all rendered and visible';
    }''')
    report['pending_tap_range_change'] = page.evaluate('''async () => {
      const {piano,practice}=window.pianoStudio,a=piano.audio;
      piano.setRange(3);await a.context.suspend();
      const tap=a.playNote('C5');practice.highlightKey('D5');await tap;
      if(!a.activeVoices.has('C5') || !piano.keys.D5.classList.contains('current')) throw Error('First tap lost on teaching range change');
      practice.clearKeyHighlight();return 'Pending first resume retains the C5 attack while teaching shifts to D5';
    }''')
    page.set_viewport_size({'width': 1280, 'height': 900})
    page.wait_for_function('Object.keys(window.pianoStudio.piano.keys).length===37')
    page.locator('#practice-start').focus()
    for key, note in [('a','C3'),('s','D3'),('d','E3')]:
        page.keyboard.down(key)
        assert page.evaluate('(note)=>window.pianoStudio.piano.audio.pressedNotes.has(note)', note)
        page.keyboard.up(key)
    page.keyboard.down('Space')
    page.keyboard.press('a')
    assert page.evaluate('window.pianoStudio.piano.audio.sustainedNotes.has("C3")')
    page.keyboard.up('Space')
    assert page.evaluate('window.pianoStudio.piano.audio.sustainedNotes.size') == 0
    page.locator('#sustain-toggle').check()
    assert page.evaluate('window.pianoStudio.piano.audio.sustainEnabled')
    page.locator('#sustain-toggle').uncheck()
    report['midi'] = page.evaluate('''() => {
      const {piano}=window.pianoStudio;
      piano.handleMIDIMessage({data:[0x90,60,100]});
      if(!piano.audio.pressedNotes.has('C4')) throw Error('MIDI note-on');
      piano.handleMIDIMessage({data:[0xB0,64,127]});
      piano.handleMIDIMessage({data:[0x80,60,0]});
      if(!piano.audio.sustainedNotes.has('C4')) throw Error('MIDI sustain');
      piano.handleMIDIMessage({data:[0xB0,64,0]});
      if(piano.audio.sustainedNotes.size) throw Error('MIDI release');
      return 'note-on/off and CC64 passed (synthetic messages, no physical device)';
    }''')
    # Record actual piano output on the existing gain node; recorder UI is absent
    # from Studio in the base revision, so do not claim its end-to-end UI passed.
    report['recording_output'] = page.evaluate('''async () => {
      const {piano}=window.pianoStudio,a=piano.audio;
      const dest=a.context.createMediaStreamDestination();a.gainNode.connect(dest);
      const recorder=new MediaRecorder(dest.stream),chunks=[];
      recorder.ondataavailable=e=>chunks.push(e.data);
      const done=new Promise(resolve=>recorder.onstop=resolve);
      recorder.start();piano.pressKey('C4');await new Promise(r=>setTimeout(r,160));
      piano.releaseKey('C4');recorder.stop();await done;a.gainNode.disconnect(dest);
      const bytes=chunks.reduce((n,c)=>n+c.size,0);if(!bytes)throw Error('Empty recording');
      return {bytes,mime:recorder.mimeType,scope:'gain output capture; legacy recorder UI absent on Studio'};
    }''')
    report['desktop'] = metrics(page)
    assert report['desktop']['keys'] == 37 and report['desktop']['range'] == 'C3–C6'
    page.screenshot(path=str(OUT / 'desktop-1280.png'), full_page=True)
    report['page_errors'] = errors
    assert errors == [], errors
    ctx.close()

    # Independent early-input/no-network run, including idle timer fallback.
    slow = browser.new_context(viewport={'width': 390, 'height': 844})
    early = slow.new_page()
    early.add_init_script('delete window.requestIdleCallback; delete window.cancelIdleCallback;')
    early.route('**/samples/**', lambda route: route.abort())
    early.route('https://**', lambda route: route.abort())
    early.goto(URL, wait_until='domcontentloaded')
    early.wait_for_function('Boolean(window.pianoStudio)')
    early.locator('.key[data-note="C4"]').click(position={'x': 20, 'y': 170})
    early.wait_for_function('window.pianoStudio.piano.audio.activeVoices.size > 0')
    assert early.evaluate('window.pianoStudio.piano.audio.context.state') == 'running'
    report['early_input_failed_network'] = 'running context and immediate fallback with requestIdleCallback unavailable'
    slow.close()
    browser.close()

(OUT / 'browser-results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False))
print(json.dumps(report, indent=2, ensure_ascii=False))
