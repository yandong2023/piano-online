"""Run against npm run build output, served on :8763; requires Python Playwright.

PIANO_EVIDENCE=/path/out python tests/mobile-piano-browser.py
Uses real Web Audio, cold contexts, CDP cache disabling and native pointer input.
"""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(os.environ.get('PIANO_EVIDENCE', '../evidence')).resolve()
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:8763'
report = {}

def run_analytics():
    """STAF-69: deterministic event assertions with real Web Audio and native input.

    Serve candidate dist on :8763, origin/main (9bcdcab) dist on :8764.
    Run this file with --analytics; PIANO_EVIDENCE selects the JSON output folder.
    """
    from collections import Counter
    from urllib.parse import urlsplit

    results = {}
    contexts = []
    hooks = '''
      for (const event of ['pointerdown','keydown']) document.addEventListener(event,e=>{
        if(event==='keydown'||e.target.closest?.('.key')) window.inputStartedAt=performance.now();
      },true);
      for(const type of [AudioBufferSourceNode,OscillatorNode]){
        const original=type.prototype.start;
        type.prototype.start=function(...args){
          window.startCount=(window.startCount||0)+1;
          if(window.inputStartedAt&&!window.firstStart) window.firstStart={inputToStartMs:performance.now()-window.inputStartedAt};
          return original.apply(this,args);
        };
      }
    '''

    def events(page):
        return page.evaluate("(window.dataLayer||[]).filter(c=>c[0]==='event').map(c=>({name:c[1],params:{...c[2]}}))")

    def named(page, name):
        return [e['params'] for e in events(page) if e['name'] == name]

    def latency_bucket(value):
        return '<50' if value < 50 else '50-100' if value < 100 else '100-200' if value < 200 else '200-500' if value < 500 else '>=500'

    def classify_console_errors(diagnostics):
        allowed = {'googletagmanager.com', 'google-analytics.com', 'googlesyndication.com', 'doubleclick.net'}
        application, excluded = [], []
        for error in diagnostics['console_errors']:
            url = error['location'].get('url', '')
            host = urlsplit(url).hostname or ''
            matches = [r for r in diagnostics['request_failed'] if r['url'] == url and r['aborted_by_test'] and r['failure'] == 'net::ERR_FAILED']
            if ('net::ERR_FAILED' in error['text'] and matches
                    and any(host == domain or host.endswith('.' + domain) for domain in allowed)):
                excluded.append({**error, 'url': url, 'matching_failed_requests': matches})
            else:
                application.append(error)
        return application, excluded

    def same_metrics(a, b):
        if a.keys() != b.keys() or len(a['whites']) != len(b['whites']) or len(a['buttons']) != len(b['buttons']):
            return False
        if any(abs(x-y) > 1 for x,y in zip(a['whites'], b['whites'])):
            return False
        if any(abs(x[k]-y[k]) > 1 for x,y in zip(a['buttons'], b['buttons']) for k in ['width','height']):
            return False
        return all(a[key] == b[key] for key in a if key not in ['whites','buttons'])

    def tap(page, note):
        page.locator(f'.key[data-note="{note}"]').tap(position={'x': 20, 'y': 170})
        page.wait_for_function('window.pianoStudio.piano.audio.pendingNotes.size===0')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=os.environ.get('PIANO_CHROMIUM'),
                                   args=['--autoplay-policy=document-user-activation-required'])
        def new_page(width=390, path='/', origin=URL):
            ctx = browser.new_context(viewport={'width': width, 'height': 844}, has_touch=True)
            contexts.append(ctx)
            page = ctx.new_page()
            page.set_default_timeout(5000)
            errors = []
            diagnostics = {'console_errors': [], 'request_failed': [], 'aborted_urls': []}
            def route_request(route):
                if route.request.url.startswith(origin + '/'):
                    route.continue_()
                else:
                    diagnostics['aborted_urls'].append(route.request.url)
                    route.abort()
            page.route('**/*', route_request)
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('console', lambda msg: diagnostics['console_errors'].append({'text': msg.text, 'location': msg.location}) if msg.type == 'error' else None)
            page.on('requestfailed', lambda request: diagnostics['request_failed'].append({
                'url': request.url, 'failure': request.failure,
                'aborted_by_test': request.url in diagnostics['aborted_urls'],
            }))
            page.add_init_script(hooks)
            cdp = ctx.new_cdp_session(page)
            cdp.send('Network.enable')
            cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
            page.goto(origin + path, wait_until='networkidle')
            page.wait_for_function('window.pianoStudio?.piano.audio.buffers.size===19')
            page.bring_to_front()
            page.evaluate('''() => {
              const audio=window.pianoStudio.piano.audio, play=audio.playNote.bind(audio);
              window.playAttempts=[];
              audio.playNote=async(...args)=>{
                const at=performance.now(), state=audio.context.state;
                const played=await play(...args);
                window.playAttempts.push({note:args[0],state,played,elapsed:performance.now()-at});
                return played;
              };
            }''')
            return page, cdp, errors, diagnostics

        mobile, _, _, _ = new_page()
        assert not events(mobile)
        tap(mobile, 'C4')
        assert len(named(mobile,'audio_first_attack')) == 1, mobile.evaluate('({attempts:window.playAttempts,firstStart:window.firstStart})')
        mobile.keyboard.press('a')
        mobile.wait_for_function('window.pianoStudio.piano.audio.pendingNotes.size===0')
        mobile.locator('[data-octave="1"]').click()
        tap(mobile, 'D4')
        assert Counter(e['name'] for e in events(mobile)) == {'audio_first_attack': 1, 'free_play_entry': 1, 'note_play': 3, 'octave_shift': 1}, events(mobile)
        results['AC1_mobile'] = events(mobile)
        desktop, _, _, _ = new_page(1280)
        desktop.locator('[data-studio]').focus()
        desktop.keyboard.press('a')
        desktop.wait_for_function('window.firstStart')
        assert Counter(e['name'] for e in events(desktop)) == {'audio_first_attack': 1, 'free_play_entry': 1, 'note_play': 1}
        results['AC1_desktop'] = events(desktop)

        for note in ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5']:
            tap(mobile, note)
        assert len(named(mobile, 'audio_first_attack')) == 1
        first = named(mobile, 'audio_first_attack')[0]
        latency = first['input_to_start_ms']
        assert isinstance(latency, (int,float)) and 0 <= latency < 10000 and round(latency,2) == latency
        bucket = '<50' if latency < 50 else '50-100' if latency < 100 else '100-200' if latency < 200 else '200-500' if latency < 500 else '>=500'
        assert first['latency_bucket'] == bucket and first['note'] == 'C4'
        assert first['hit'] in ['sample','fallback'] and first['cold_start'] in ['yes','no'] and first['play_mode'] == 'free'
        results['AC2'] = {'event': first, 'independent_start_hook': mobile.evaluate('window.firstStart')}

        inputs, cdp, _, _ = new_page()
        tap(inputs,'C4')
        inputs.keyboard.press('s')
        inputs.wait_for_function('window.pianoStudio.piano.audio.pendingNotes.size===0')
        # Scroll both keys before measuring: revealing D4 can move C4's box.
        inputs.locator('.key[data-note="D4"]').scroll_into_view_if_needed()
        points = []
        for note in ['C4','D4']:
            box = inputs.locator(f'.key[data-note="{note}"]').bounding_box()
            points.append({'x': box['x']+20,'y':box['y']+170,'id':1})
        cdp.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[points[0]]})
        inputs.wait_for_function('window.pianoStudio.piano.audio.pressedNotes.has("C4")',timeout=2000)
        cdp.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[points[1]]})
        inputs.wait_for_function('window.pianoStudio.piano.audio.pressedNotes.has("D4")',timeout=2000)
        cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
        notes = named(inputs,'note_play')
        assert [e['source'] for e in notes] == ['touch','keyboard','touch','touch'], notes
        aria = inputs.locator('.keys').get_attribute('aria-label')
        assert all(e['range'] == aria and e['octaves'] == 2 for e in notes)
        results['AC3'] = {'events':notes,'aria_label':aria}
        inputs.evaluate('''async()=>{
          const p=window.pianoStudio.piano;
          p.handleMIDIMessage({data:[0x90,64,100]});p.handleMIDIMessage({data:[0x80,64,0]});
          await p.audio.playNote('F4');p.audio.stopNote('F4');
        }''')
        assert [e['source'] for e in named(inputs,'note_play')][-2:] == ['midi','program']
        results['additional_midi_program'] = named(inputs,'note_play')[-2:]

        shifts, _, _, _ = new_page()
        shifts.locator('[data-octave="1"]').click()
        shifts.locator('[data-octave="1"]').click()
        assert shifts.locator('[data-octave="1"]').is_disabled()
        shifts.evaluate('document.querySelector(\'[data-octave="1"]\').click();window.pianoStudio.piano.setRange(9)')
        assert shifts.locator('.keys').get_attribute('aria-label') == 'C5–C7'
        shifts.set_viewport_size({'width':1280,'height':800})
        shifts.wait_for_function('window.pianoStudio.piano.octaves===3')
        desktop_arrows_visible = shifts.locator('[data-octave="-1"]').is_visible()
        # Existing CSS hides desktop arrows. Native DOM click exercises the
        # existing scrollBy branch without changing that product behavior.
        shifts.evaluate('for(let i=0;i<2;i++)document.querySelector(\'[data-octave="-1"]\').click()')
        shift_events = named(shifts,'octave_shift')
        assert [(e['from_range'],e['to_range'],e['direction'],e['octaves']) for e in shift_events] == [('C3–C5','C4–C6','up',2),('C4–C6','C5–C7','up',2)]
        results['AC4'] = {'events':shift_events,'mobile_max_disabled':True,'desktop_arrows_visible':desktop_arrows_visible,'desktop_click_method':'HTMLElement.click','desktop_range':shifts.locator('.keys').get_attribute('aria-label')}
        shifts.set_viewport_size({'width':390,'height':844})
        shifts.wait_for_function('window.pianoStudio.piano.octaves===2')
        shifts.evaluate('window.pianoStudio.piano.ensureNoteVisible("C7")')
        assert len(named(shifts,'octave_shift')) == 2
        results['additional_automatic_range'] = shifts.locator('.keys').get_attribute('aria-label')

        free, _, _, _ = new_page()
        free.wait_for_timeout(2000)
        assert not named(free,'free_play_entry')
        # Mobile CSS hides this existing setting; set its state explicitly.
        free.evaluate('const labels=document.getElementById("labels-toggle");labels.checked=false;labels.dispatchEvent(new Event("change",{bubbles:true}))')
        tap(free,'C4')
        entry = named(free,'free_play_entry')[0]
        assert entry['keys_visible'] == 'false' and entry['range'] == 'C3–C5' and entry['play_mode'] == 'free'
        free.locator('[data-play-mode="guided"]').click()
        free.locator('[data-play-mode="free"]').click()
        tap(free,'E4')
        assert len(named(free,'free_play_entry')) == 1
        guided, _, _, _ = new_page(path='/songs/twinkle-twinkle-little-star/')
        tap(guided,'C4')
        assert not named(guided,'free_play_entry')
        assert named(guided,'audio_first_attack')[0]['play_mode'] == 'guided'
        results['AC5'] = {'before_keys':[],'free_after_reentry':events(free),'song_guided':events(guided)}
        guided.locator('[data-play-mode="free"]').click()
        tap(guided,'D4')
        assert len(named(guided,'free_play_entry')) == 1

        version = mobile.evaluate('new URL(document.querySelector(\'script[src*="/js/studio.js"]\').src).searchParams.get("v")')
        assert all(e['params']['event_version'] == 1 and e['params']['asset_version'] == version for e in results['AC1_mobile']+results['AC1_desktop'])
        mobile.evaluate('document.querySelector(\'script[src*="/js/studio.js"]\').src="/js/studio.js"')
        tap(mobile,'F5')
        assert named(mobile,'note_play')[-1]['asset_version'] == 'unknown'
        mobile.evaluate('document.querySelector(\'script[src*="/js/studio.js"]\').src="/js/studio.js?v=changed"')
        tap(mobile,'G5')
        assert named(mobile,'note_play')[-1]['asset_version'] == 'changed'
        results['AC6'] = {'script_version':version,'unknown_event':named(mobile,'note_play')[-2],'updated_event':named(mobile,'note_play')[-1]}

        comparisons = {}
        for failure in ['missing','throw']:
            samples = {}
            for label, origin in [('baseline','http://127.0.0.1:8764'),('candidate',URL)]:
                page, _, errors, diagnostics = new_page(origin=origin)
                page.evaluate('() => { window.gtag=undefined; }' if failure=='missing' else '() => { window.gtag=()=>{throw Error("boom")}; }')
                before = metrics(page)
                page.locator('.key[data-note="C4"]').scroll_into_view_if_needed()
                box = page.locator('.key[data-note="C4"]').bounding_box()
                page.mouse.move(box['x']+20,box['y']+170)
                page.mouse.down()
                page.wait_for_function('window.firstStart')
                held = page.evaluate('''()=>({notes:[...window.pianoStudio.piano.audio.pressedNotes],active:document.querySelector('.key[data-note="C4"]').classList.contains('active'),state:window.pianoStudio.piano.audio.context.state})''')
                assert held == {'notes':['C4'],'active':True,'state':'running'}, held
                page.mouse.up()
                released = page.evaluate('''()=>({notes:[...window.pianoStudio.piano.audio.pressedNotes],active:document.querySelector('.key[data-note="C4"]').classList.contains('active'),state:window.pianoStudio.piano.audio.context.state})''')
                assert released == {'notes':[],'active':False,'state':'running'}, released
                page.locator('[data-octave="1"]').click()
                assert page.locator('.keys').get_attribute('aria-label') == 'C4–C6'
                app_errors, excluded = classify_console_errors(diagnostics)
                first_start = page.evaluate('window.firstStart')
                samples[label] = {
                    'before':before, 'after':metrics(page), 'first_start':first_start,
                    'latency_bucket':latency_bucket(first_start['inputToStartMs']),
                    'held':held, 'released':released, 'page_errors':errors,
                    **diagnostics, 'application_console_errors':app_errors,
                    'excluded_console_errors':excluded, 'events':events(page),
                }
            a,b = samples['baseline'],samples['candidate']
            behavior = same_metrics(a['before'],b['before']) and same_metrics(a['after'],b['after']) and a['held']==b['held'] and a['released']==b['released']
            latency_delta = abs(a['first_start']['inputToStartMs']-b['first_start']['inputToStartMs'])
            gates = {
                'behavior_equal_1px':behavior,
                'zero_page_errors':not a['page_errors'] and not b['page_errors'],
                'zero_application_console_errors':not a['application_console_errors'] and not b['application_console_errors'],
                'same_latency_bucket':a['latency_bucket']==b['latency_bucket'],
            }
            comparisons[failure] = {**samples, 'latency_delta_ms':latency_delta, 'gates':gates, 'pass':all(gates.values())}
        results['AC7'] = comparisons
        results['prd_version'] = 2
        results['baseline_commit'] = '9bcdcab'
        results['AC7_pass'] = all(c['pass'] for c in comparisons.values())
        for ctx in contexts:
            ctx.close()
        browser.close()
    (OUT/'analytics-browser.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'AC1_to_AC6':'PASS','AC7_v2':results['AC7_pass'],'evidence':str(OUT/'analytics-browser.json')},ensure_ascii=False))
    if not results['AC7_pass']:
        raise AssertionError('AC-7 v2 acceptance failed; see analytics-browser.json for baseline/candidate evidence')

def metrics(page):
    return page.evaluate('''() => ({
      range: document.querySelector('.keys').getAttribute('aria-label'),
      rangeHint: document.querySelector('.studio-range > span').textContent,
      keys: document.querySelectorAll('.keys .key').length,
      whites: [...document.querySelectorAll('.key.white')].map(k=>k.getBoundingClientRect().width),
      buttons: [...document.querySelectorAll('[data-octave]')].map(k=>({width:k.getBoundingClientRect().width,height:k.getBoundingClientRect().height})),
      labelsHidden: [...document.querySelectorAll('.key-label')].every(k=>getComputedStyle(k).display==='none'),
      state: window.pianoStudio.piano.audio.context?.state,
      buffers: window.pianoStudio.piano.audio.buffers.size
    })''')

if '--analytics' in sys.argv:
    run_analytics()
    sys.exit(0)

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
        result = page.evaluate('''async () => {
          const {piano,practice}=window.pianoStudio; let count=0,high=0;
          const total=practice.currentSong.notes.length;
          while(practice.isPlaying && count <= total){
            await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            await new Promise(r=>setTimeout(r,300));
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
    report['shared_highlight'] = page.evaluate('''async () => {
      const {piano,practice}=window.pianoStudio;
      for(const note of ['C1','C#1','G5','C7','C3']) {
        practice.highlightKey(note);
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        await new Promise(r=>setTimeout(r,300));
        const key=document.querySelector('.key.current'),b=key?.getBoundingClientRect(),v=piano.keyboardViewport.getBoundingClientRect();
        if(key?.dataset.note!==note || b.left<v.left-.5 || b.right>v.right+.5) throw Error(`Shared highlight ${note}`);
      }
      practice.clearKeyHighlight();return 'C1/C#1/G5/C7/C3 all rendered and visible';
    }''')
    report['pending_tap_range_change'] = page.evaluate('''async () => {
      const {piano,practice}=window.pianoStudio,a=piano.audio;
      piano.setRange(3);await a.context.suspend();
      const tap=a.playNote('C5');practice.highlightKey('D5');const played=await tap;
      if(!played || !a.activeVoices.has('C5') || !piano.keys.D5.classList.contains('current')) throw Error('First tap lost on teaching range change');
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
    report['page_entries'] = {}
    for route in ['/en/', '/zh-hant/', '/songs/fur-elise/']:
        entry = ctx.new_page()
        entry.route('https://**', lambda route: route.abort())
        entry.goto(URL+route, wait_until='networkidle')
        entry.wait_for_function('Boolean(window.pianoStudio)')
        assert entry.locator('.keys .key').count() == 25
        entry.evaluate('window.pianoStudio.practice.highlightKey("G5")')
        assert entry.locator('.key.current').get_attribute('data-note') == 'G5'
        report['page_entries'][route] = '25 mobile keys; G5 teaching highlight present'
        entry.close()
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

    # Base Piano must rebind regenerated keys on the legacy keyboard layout.
    legacy_ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    legacy = legacy_ctx.new_page()
    legacy.route('**/legacy-fixture', lambda route: route.fulfill(content_type='text/html', body='''
      <html lang="en"><head><link rel="stylesheet" href="/css/piano.css"></head><body>
      <div class="piano-container"><div class="keys"></div></div>
      <script type="module">
        import {Piano} from '/js/piano.js';
        import {PracticeMode} from '/js/practice-mode.js';
        window.legacyPiano=new Piano();
        window.highlightLegacy=note=>PracticeMode.prototype.highlightKey.call({piano:legacyPiano,clearKeyHighlight:PracticeMode.prototype.clearKeyHighlight},note);
      </script></body></html>'''))
    legacy.add_init_script('delete window.requestIdleCallback; delete window.cancelIdleCallback;')
    legacy.goto(URL+'/legacy-fixture', wait_until='networkidle')
    legacy.wait_for_function('Boolean(window.legacyPiano)')
    assert legacy.locator('.key').count() == 25
    legacy.evaluate('window.highlightLegacy("G5")')
    assert legacy.locator('.key.current').get_attribute('data-note') == 'G5'
    legacy.locator('.key.current').click(position={'x': 20, 'y': 120})
    legacy.wait_for_function('window.legacyPiano.audio.context?.state === "running"')
    report['legacy_base'] = '25 keys, G5 range-follow and regenerated pointer bindings passed'
    legacy_ctx.close()
    browser.close()

(OUT / 'browser-results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False))
print(json.dumps(report, indent=2, ensure_ascii=False))
assert report['AC1_under_100ms'], 'Cold pointerdown-to-source.start exceeded 100ms; see browser-results.json'
