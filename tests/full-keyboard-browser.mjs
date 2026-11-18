// Runs inside the existing audio-regression Playwright browser and build server.
// MIDI is tested with protocol messages, not an attached physical instrument.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

export async function verifyFullKeyboard(browser, baseUrl) {
  const report = { checks: [], errors: [] };
  await fs.mkdir('ui-artifacts', { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }, hasTouch: true, reducedMotion: 'reduce',
  });
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(baseUrl).origin
    ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push(error.message));
  async function check(name, action) {
    try {
      const detail = await action();
      report.checks.push({ name: `88-key: ${name}`, pass: true, detail });
    } catch (error) {
      report.checks.push({ name: `88-key: ${name}`, pass: false, error: error.message });
      throw error;
    }
  }
  const nextFrame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metrics = () => page.evaluate(() => {
    const keys = [...document.querySelectorAll('.keys .key')];
    const whites = keys.filter(key => key.classList.contains('white'));
    const blacks = keys.filter(key => key.classList.contains('black'));
    const viewport = document.getElementById('keyboard-viewport');
    return {
      count: keys.length, white: whites.length, black: blacks.length,
      first: keys[0].dataset.note, last: keys.at(-1).dataset.note,
      unique: new Set(keys.map(key => key.dataset.note)).size,
      minWhite: Math.min(...whites.map(key => key.getBoundingClientRect().width)),
      blackRatio: blacks[0].getBoundingClientRect().width / whites[0].getBoundingClientRect().width,
      scroll: viewport.scrollLeft, max: viewport.scrollWidth - viewport.clientWidth,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  async function fullGeometry() {
    const measured = await metrics();
    assert.deepEqual([measured.count, measured.white, measured.black, measured.unique], [88, 52, 36, 88]);
    assert.deepEqual([measured.first, measured.last], ['A0', 'C8']);
    assert.ok(measured.minWhite >= 39.9, `White key width: ${measured.minWhite}`);
    assert.ok(measured.blackRatio >= .5 && measured.blackRatio <= .7, `Black key ratio: ${measured.blackRatio}`);
    assert.ok(!measured.overflow, 'Instrument causes page-wide horizontal overflow');
    assert.equal(await page.locator('[data-keyboard-mode="full"]').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.locator('#keyboard-position').isVisible());
    assert.ok(await page.locator('#keyboard-octave').isVisible());
    assert.match(await page.locator('.keys').getAttribute('aria-label'), /A0.*C8/);
    return measured;
  }
  async function pan(edge) {
    await page.locator('#keyboard-position').focus();
    await page.keyboard.press(edge === 'low' ? 'Home' : 'End');
    await page.waitForFunction(edge => {
      const v = document.getElementById('keyboard-viewport');
      return edge === 'low' ? v.scrollLeft < 1 : Math.abs(v.scrollLeft - v.scrollWidth + v.clientWidth) < 1;
    }, edge);
  }
  async function endpoints(method) {
    for (const [edge, note] of [['low', 'A0'], ['high', 'C8']]) {
      await pan(edge);
      assert.ok(await page.evaluate(note => {
        const k = document.querySelector(`.key[data-note="${note}"]`).getBoundingClientRect();
        const v = document.getElementById('keyboard-viewport').getBoundingClientRect();
        return k.left >= v.left - .75 && k.right <= v.right + .75 && k.width > 0;
      }, note), `${note} is clipped after navigation`);
      const key = page.locator(`.key[data-note="${note}"]`), box = await key.boundingBox();
      await key[method]({ position: { x: box.width / 2, y: box.height * .8 } });
      assert.equal(await page.locator('#studio-note').innerText(), note);
      assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
    }
  }
  try {
    await page.goto(`${baseUrl}/en/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.pianoStudio);
    await check('compact defaults and only central samples warm up', async () => {
      await page.waitForFunction(() => window.pianoStudio.piano.audio.buffers.size === 19);
      assert.equal((await metrics()).count, 37);
      assert.equal(await page.locator('[data-keyboard-mode="compact"]').getAttribute('aria-pressed'), 'true');
      assert.ok(!await page.locator('#keyboard-position').isVisible());
      await page.locator('[data-keyboard-mode="full"]').click();
      assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.buffers.size), 19,
        'Changing size eagerly downloads outer samples');
    });
    await check('desktop geometry, partial lowest octave and mouse endpoints', async () => {
      const measured = await fullGeometry();
      await page.locator('[data-studio]').screenshot({ path: 'ui-artifacts/full-keyboard-desktop.png' });
      assert.ok(await page.evaluate(() => {
        const a = document.querySelector('[data-note="A0"]').getBoundingClientRect();
        const sharp = document.querySelector('[data-note="A#0"]').getBoundingClientRect();
        const b = document.querySelector('[data-note="B0"]').getBoundingClientRect();
        return Math.abs((sharp.left + sharp.right) / 2 - (a.right + b.left) / 2) < 1;
      }), 'A#0 does not straddle the first two white keys');
      await endpoints('click');
      return measured;
    });
    await check('computer banks reach both ends and held keyup preserves the original pitch', async () => {
      for (const [bank, key, note] of [['0', 'h', 'A0'], ['5', ',', 'C8'], ['3', 'a', 'C3']]) {
        await page.locator('#keyboard-octave').focus();
        await page.locator('#keyboard-octave').selectOption(bank);
        await page.keyboard.down(key);
        assert.ok(await page.evaluate(note => window.pianoStudio.piano.audio.pressedNotes.has(note), note));
        assert.equal(await page.locator(`.key[data-note="${note}"]`).getAttribute('aria-pressed'), 'true');
        await page.keyboard.up(key);
        assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
      }
      await page.keyboard.down('a');
      await page.locator('#keyboard-octave').selectOption('4');
      assert.deepEqual(await page.evaluate(() => [...window.pianoStudio.piano.audio.pressedNotes]), ['C3']);
      await page.keyboard.up('a');
      assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
      await page.locator('[data-studio]').focus();
      await page.keyboard.down('a');
      assert.ok(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.has('C4')));
      await page.locator('[data-keyboard-mode="compact"]').click();
      assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
      await page.keyboard.up('a');
      await page.locator('[data-keyboard-mode="full"]').click();
    });
    await check('MIDI velocity and cross-range hardware/file chords', () => page.evaluate(() => {
      const piano = window.pianoStudio.piano, audio = piano.audio;
      const play = audio.playNote.bind(audio), calls = [];
      audio.playNote = (...args) => { calls.push({ note: args[0], velocity: args[1] }); return play(...args); };
      const original = piano.keys.A0, bank = piano.startOctave;
      try {
        piano.handleMIDIMessage({ data: [0x90, 21, 31] });
        piano.handleMIDIMessage({ data: [0x90, 108, 112] });
        if (!audio.pressedNotes.has('A0') || !audio.pressedNotes.has('C8')) throw Error('Cross-range MIDI chord lost a voice');
        if (piano.keys.A0 !== original || piano.startOctave !== bank) throw Error('MIDI rewrote the keyboard bank');
        piano.handleMIDIMessage({ data: [0x90, 108, 0] });
        piano.handleMIDIMessage({ data: [0x80, 21, 0] });
        if (audio.pressedNotes.size) throw Error('MIDI note-off did not release');
        if (Math.abs(calls[0].velocity - 31 / 127) > 1e-10 || Math.abs(calls[1].velocity - 112 / 127) > 1e-10) throw Error('MIDI velocity discarded');
      } finally { audio.playNote = play; }
      for (const note of ['A0', 'C8']) document.dispatchEvent(new CustomEvent('studio:note-on', { detail: { note } }));
      if (!audio.pressedNotes.has('A0') || !audio.pressedNotes.has('C8') || piano.keys.A0 !== original) throw Error('MIDI-file cross-range chord lost a voice');
      for (const note of ['A0', 'C8']) document.dispatchEvent(new CustomEvent('studio:note-off', { detail: { note } }));
      return { calls, scope: 'synthetic MIDI messages and file playback events' };
    }));
    await check('all 88 warm pitches produce real Web Audio signal with no fallback', async () => {
      return page.evaluate(async () => {
        const { piano } = window.pianoStudio, audio = piano.audio;
        const { SAMPLE_NOTES } = await import('/js/audio-note-utils.mjs');
        await Promise.all(SAMPLE_NOTES.map(note => audio.loadBuffer(note)));
        await audio.ensureRunning();
        audio.stopAll();
        while (audio.activeVoices.size) await new Promise(resolve => setTimeout(resolve, 20));
        const analyser = audio.context.createAnalyser(); analyser.fftSize = 2048;
        audio.gainNode.connect(analyser);
        const data = new Float32Array(analyser.fftSize), checked = [];
        let oscillators = 0;
        const oscillator = audio.context.createOscillator.bind(audio.context);
        audio.context.createOscillator = (...args) => { oscillators++; return oscillator(...args); };
        try {
          for (const note of Object.keys(piano.keys)) {
            await audio.playNote(note);
            let peak = 0;
            for (let i = 0; i < 5; i++) {
              await new Promise(resolve => setTimeout(resolve, 15));
              analyser.getFloatTimeDomainData(data);
              for (const sample of data) peak = Math.max(peak, Math.abs(sample));
            }
            audio.stopNote(note);
            if (peak <= .0001) throw Error(`${note} produced no output (${peak})`);
            checked.push({ note, peak });
            while (audio.activeVoices.size) await new Promise(resolve => setTimeout(resolve, 20));
          }
          if (oscillators) throw Error(`${oscillators} pitches fell back despite loaded samples`);
          return { count: checked.length, samples: audio.buffers.size,
            minPeak: Math.min(...checked.map(c => c.peak)), maxPeak: Math.max(...checked.map(c => c.peak)) };
        } finally { audio.context.createOscillator = oscillator; audio.gainNode.disconnect(analyser); }
      });
    });
    await check('recorder UI captures full-range output and exports a WAV', async () => {
      await page.locator('[data-record-toggle]').click();
      await page.waitForFunction(() => window.pianoStudio.recorder.state === 'recording');
      await page.evaluate(() => {
        for (const midi of [21, 108]) window.pianoStudio.piano.handleMIDIMessage({ data: [0x90, midi, 100] });
      });
      await page.waitForTimeout(350);
      await page.evaluate(() => {
        for (const midi of [21, 108]) window.pianoStudio.piano.handleMIDIMessage({ data: [0x80, midi, 0] });
      });
      await page.locator('[data-record-toggle]').click();
      await page.waitForFunction(() => window.pianoStudio.recorder.state === 'ready');
      assert.ok(await page.locator('[data-record-playback]').isVisible());
      const recording = await page.evaluate(async () => {
        const { piano, recorder } = window.pianoStudio;
        const buffer = await piano.audio.context.decodeAudioData(await recorder.result.blob.arrayBuffer());
        let peak = 0; for (const sample of buffer.getChannelData(0)) peak = Math.max(peak, Math.abs(sample));
        if (peak < .0001) throw Error('Recorder captured silence');
        return { bytes: recorder.result.blob.size, duration: buffer.duration, peak };
      });
      const download = page.waitForEvent('download');
      await page.locator('[data-record-wav]').click();
      assert.match((await download).suggestedFilename(), /\.wav$/);
      assert.ok(await page.evaluate(() => window.pianoStudio.recorder.result.wav.blob.size > 44));
      return recording;
    });
    await check('existing guided song finishes with current mapped hints', async () => {
      await page.locator('[data-play-mode="guided"]').click();
      await page.locator('#song-select').selectOption('fur-elise');
      await page.locator('#keyboard-octave').selectOption('0');
      await page.locator('#start-practice').click();
      const result = await page.evaluate(async () => {
        const { piano, practice } = window.pianoStudio; let count = 0;
        const total = practice.currentSong.notes.length;
        while (practice.isPlaying && count <= total) {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const note = practice.currentSong.notes[practice.currentNoteIndex];
          const key = document.querySelector('.key.current');
          if (key?.dataset.note !== note) throw Error(`Missing highlight ${note}`);
          const k = key.getBoundingClientRect(), v = piano.keyboardViewport.getBoundingClientRect();
          if (k.left < v.left - 1 || k.right > v.right + 1) throw Error(`Clipped highlight ${note}`);
          const hint = practice.keyHintKey.textContent;
          if (!hint || hint !== practice.getKeyboardKeyForNote(note)) throw Error(`Stale computer-key hint ${note}: ${hint}`);
          piano.pressKey(note); piano.releaseKey(note); count++;
        }
        if (count !== total || practice.correctNotes !== total || practice.wrongNotes) throw Error('Guided song did not complete');
        practice.closeResultModal(); return { song: 'fur-elise', total, correct: practice.correctNotes };
      });
      await page.locator('[data-play-mode="free"]').click();
      return result;
    });
    await check('rhythm mode restores its playable octave and stops when size changes', async () => {
      await page.locator('#keyboard-octave').selectOption('5');
      await page.locator('[data-play-mode="guided"]').click();
      await page.locator('#song-select').selectOption('twinkle');
      if (!await page.locator('#start-rhythm-game').isVisible()) await page.locator('.studio-more > summary').click();
      await page.locator('#start-rhythm-game').click();
      await page.waitForFunction(() => window.pianoStudio.rhythm.fallingNotes.length > 0);
      const result = await page.evaluate(() => {
        const { piano, rhythm } = window.pianoStudio;
        const first = document.querySelector('.falling-note');
        return { playing: rhythm.isPlaying, mode: piano.keyboardMode, octave: piano.startOctave,
          note: first.dataset.fullNote, key: first.dataset.key, mapped: piano.keyMap[first.dataset.key] };
      });
      assert.deepEqual(result, { playing: true, mode: 'compact', octave: 3, note: 'C3', key: 'a', mapped: 'C3' });
      await page.locator('[data-keyboard-mode="full"]').click();
      assert.equal(await page.evaluate(() => window.pianoStudio.rhythm.isPlaying), false);
      assert.equal(await page.locator('.falling-note').count(), 0);
      return result;
    });
    await check('full-mode preference survives reload', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.pianoStudio);
      return fullGeometry();
    });
    await check('mobile breakpoint preserves held voices and usable key widths', async () => {
      // Unlock this reloaded page with a native gesture before MIDI messages.
      await page.locator('.key[data-note="C4"]').click({ position: { x: 20, y: 150 } });
      await page.evaluate(() => {
        for (const midi of [21, 108]) window.pianoStudio.piano.handleMIDIMessage({ data: [0x90, midi, 90] });
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await nextFrame();
      assert.deepEqual(new Set(await page.evaluate(() => [...window.pianoStudio.piano.audio.pressedNotes])), new Set(['A0', 'C8']));
      await page.evaluate(() => window.pianoStudio.piano.releaseAll());
      const measured = await fullGeometry();
      await page.evaluate(() => window.pianoStudio.piano.ensureNoteVisible('D4'));
      await page.locator('[data-studio]').screenshot({ path: 'ui-artifacts/full-keyboard-mobile.png' });
      return measured;
    });
    await check('mobile endpoint touch, arrows and native two-finger chord', async () => {
      await endpoints('tap');
      await pan('low');
      await page.locator('[data-octave="1"]').click();
      await page.waitForFunction(() => document.getElementById('keyboard-viewport').scrollLeft > 1);
      await page.locator('[data-octave="-1"]').click();
      await page.waitForFunction(() => document.getElementById('keyboard-viewport').scrollLeft < 1);
      await page.locator('#keyboard-octave').selectOption('3');
      await page.evaluate(() => window.pianoStudio.piano.ensureNoteVisible('D4'));
      await page.locator('.key[data-note="D4"]').scrollIntoViewIfNeeded();
      await nextFrame();
      const points = [];
      for (const [index, note] of ['C4', 'E4'].entries()) {
        const box = await page.locator(`.key[data-note="${note}"]`).boundingBox();
        points.push({ x: box.x + box.width / 2, y: box.y + box.height * .8, id: index + 1 });
      }
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
      assert.deepEqual(new Set(await page.evaluate(() => [...window.pianoStudio.piano.audio.pressedNotes])), new Set(['C4', 'E4']));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
      await cdp.detach();
    });
    await check('landscape and fullscreen retain all 88 keys', async () => {
      await page.setViewportSize({ width: 844, height: 390 });
      await nextFrame();
      await fullGeometry();
      await page.locator('#toggle-fullscreen').click();
      await page.waitForFunction(() => document.getElementById('toggle-fullscreen').getAttribute('aria-pressed') === 'true');
      const measured = await fullGeometry();
      await page.locator('#toggle-fullscreen').click();
      await page.waitForFunction(() => document.getElementById('toggle-fullscreen').getAttribute('aria-pressed') === 'false');
      return measured;
    });
    await check('compact mobile octave controls and desktop K=C4 remain intact', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-keyboard-mode="compact"]').click();
      assert.equal((await metrics()).count, 25);
      assert.equal(await page.locator('.keys').getAttribute('aria-label'), 'C3–C5');
      await page.locator('[data-octave="1"]').click();
      assert.equal(await page.locator('.keys').getAttribute('aria-label'), 'C4–C6');
      await page.locator('[data-octave="-1"]').click();
      assert.equal(await page.locator('.keys').getAttribute('aria-label'), 'C3–C5');
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForFunction(() => document.querySelectorAll('.keys .key').length === 37);
      await page.locator('[data-studio]').focus();
      await page.keyboard.down('k');
      assert.ok(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.has('C4')));
      await page.keyboard.up('k');
    });
  } catch (error) {
    if (!report.checks.some(check => !check.pass)) report.errors.push(error.stack);
  } finally { await context.close(); }
  return report;
}
