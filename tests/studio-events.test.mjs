import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import PianoAudio from '../js/piano-audio.js';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const analytics = read('js/analytics.js');
const sources = Object.fromEntries(['studio', 'piano', 'piano-audio'].map(name => [name, read(`js/${name}.js`)]));
const contracts = {
  audio_first_attack: ['piano-audio', 'input_to_start_ms', 'latency_bucket', 'note', 'hit', 'cold_start', 'play_mode'],
  note_play: ['studio', 'source', 'range', 'octaves', 'play_mode'],
  octave_shift: ['piano', 'direction', 'from_range', 'to_range', 'octaves'],
  free_play_entry: ['studio', 'keys_visible', 'range', 'octaves', 'play_mode'],
};

test('live Studio modules send every event through the shared channel with required parameters', () => {
  assert.match(read('index.html'), /type="module" src="\/js\/studio\.js\?v=/);
  assert.match(sources.studio, /import \{ Piano \} from '\.\/piano\.js'/);
  assert.match(sources.piano, /import PianoAudio from '\.\/piano-audio\.js'/);
  for (const [name, [module, ...params]] of Object.entries(contracts)) {
    const source = sources[module];
    const call = source.match(new RegExp(`track\\('${name}', \\{([\\s\\S]*?)\\}\\)`));
    assert.ok(call, `${name}: shared track call`);
    for (const param of params) assert.match(call[1], new RegExp(`\\b${param}\\b`), `${name}: ${param}`);
    assert.match(source, /import \{ track \} from '\.\/analytics\.js'/);
    assert.ok(name.length <= 40 && /^[a-z][a-z0-9_]*$/.test(name));
  }
  assert.match(analytics, /export function track/);
  assert.match(analytics, /typeof window\.gtag !== 'function'/);
  assert.match(analytics, /try[\s\S]*catch/);
  assert.match(analytics, /event_version: 1/);
  const existingSenders = new Set(['analytics.js', 'practice-mode.js', 'guided-entry-bindings.js', 'guided-homepage.js', 'song-page.js']);
  for (const file of readdirSync(new URL('../js', import.meta.url))) {
    if (!file.endsWith('.js') || existingSenders.has(file)) continue;
    assert.doesNotMatch(read(`js/${file}`), /window\.gtag\s*\(/, `${file}: new direct gtag sender`);
  }
  assert.match(sources['piano-audio'], /console\.info\('\[piano:first-attack\]'/);
});

test('channel reads versions per event, overrides spoofed common fields and isolates failures', () => {
  let script = { src: 'https://local/js/studio.js?v=20261001.1' };
  const calls = [];
  const context = vm.createContext({
    URL, window: { gtag: (...args) => calls.push(args) },
    document: { baseURI: 'https://local/', querySelector: () => script },
  });
  vm.runInContext(analytics.replace('export function', 'function'), context);
  context.track('note_play', { event_version: 9, asset_version: 'spoof' });
  assert.equal(calls[0][2].event_version, 1);
  assert.equal(calls[0][2].asset_version, '20261001.1');
  script.src = 'https://local/js/studio.js?v=next';
  context.track('note_play');
  assert.equal(calls.at(-1)[2].asset_version, 'next');
  for (const value of ['', '?v=', '?other=1']) {
    script.src = `https://local/js/studio.js${value}`;
    context.track('note_play');
    assert.equal(calls.at(-1)[2].asset_version, 'unknown');
  }
  script = null;
  context.track('note_play');
  assert.equal(calls.at(-1)[2].asset_version, 'unknown');
  context.document.querySelector = () => { throw Error('DOM unavailable'); };
  context.track('note_play');
  assert.equal(calls.at(-1)[2].asset_version, 'unknown');
  context.window.gtag = undefined;
  assert.doesNotThrow(() => context.track('note_play'));
  context.window.gtag = () => { throw Error('blocked'); };
  assert.doesNotThrow(() => context.track('note_play'));
});

async function withAudio(run) {
  const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  const param = () => ({ value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  const calls = [], starts = [];
  const context = {
    state: 'running', currentTime: 1, destination: {},
    createGain: () => ({ gain: param(), connect() {}, disconnect() {} }),
    createOscillator: () => ({ frequency: param(), connect() {}, disconnect() {}, start() { starts.push('fallback'); }, stop() {} }),
    createBufferSource: () => ({ playbackRate: param(), connect() {}, disconnect() {}, start() { starts.push('sample'); }, stop() {} }),
    resume() { this.state = 'running'; return Promise.resolve(); }, close() { return Promise.resolve(); },
  };
  globalThis.window = { AudioContext: function () { return context; }, gtag: (...args) => calls.push(args) };
  globalThis.document = { baseURI: 'https://local/', querySelector: () => ({ src: 'https://local/js/studio.js?v=test' }) };
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  const audio = new PianoAudio();
  try { await audio.init(); await run({ audio, context, calls, starts }); }
  finally { audio.dispose(); Object.assign(globalThis, originals); }
}

test('successful starts alone produce callbacks; duplicate and pending cancellation stay silent', async () => {
  await withAudio(async ({ audio, context, calls, starts }) => {
    const notifications = [];
    audio.onNoteStarted = value => notifications.push(value);
    audio.getPlaybackContext = () => ({ play_mode: 'guided', range: 'C3–C5', octaves: 2 });
    await audio.playNote('C4', .9, performance.now(), { source: 'keyboard' });
    assert.equal(await audio.playNote('C4'), false);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].source, 'keyboard');
    assert.equal(notifications[0].play_mode, 'guided');
    audio.stopNote('C4');
    await audio.playNote('C4');
    assert.equal(notifications.length, 2);
    assert.equal(notifications[1].source, 'program');
    assert.equal(calls.filter(c => c[1] === 'audio_first_attack').length, 1);
    const first = calls[0][2];
    assert.equal(first.note, 'C4'); assert.equal(first.hit, 'fallback');
    assert.equal(first.cold_start, 'no'); assert.equal(first.play_mode, 'guided');
    assert.ok(first.input_to_start_ms >= 0 && first.input_to_start_ms <= 10000);
    assert.equal(first.latency_bucket, '<50');
    context.state = 'suspended';
    let resume;
    context.resume = () => new Promise(resolve => { resume = () => { context.state = 'running'; resolve(); }; });
    const pending = audio.playNote('D4');
    audio.stopAll(); resume();
    assert.equal(await pending, false);
    assert.equal(starts.length, 2); assert.equal(notifications.length, 2);
  });
});

test('concurrent resume keeps the input snapshot and sends first attack once with cold/sample state', async () => {
  await withAudio(async ({ audio, context, calls }) => {
    context.state = 'suspended';
    audio.buffers.set('C4', {});
    let mode = 'free';
    audio.getPlaybackContext = () => ({ play_mode: mode });
    let resume;
    const wait = new Promise(resolve => { resume = resolve; });
    context.resume = () => wait.then(() => { context.state = 'running'; });
    const played = [];
    audio.onNoteStarted = value => played.push(value);
    const a = audio.playNote('C4'), b = audio.playNote('D4');
    mode = 'guided'; resume();
    assert.deepEqual(await Promise.all([a, b]), [true, true]);
    assert.ok(played.every(value => value.play_mode === 'free'));
    assert.equal(calls.length, 1);
    assert.equal(calls[0][2].cold_start, 'yes'); assert.equal(calls[0][2].hit, 'sample');
  });
});

test('throwing telemetry and missing gtag cannot fail playback; failed resume has no success events', async () => {
  await withAudio(async ({ audio, context, starts, calls }) => {
    audio.getPlaybackContext = () => { throw Error('context'); };
    audio.onNoteStarted = () => { throw Error('telemetry'); };
    window.gtag = () => { throw Error('gtag'); };
    assert.equal(await audio.playNote('C4'), true);
    window.gtag = undefined;
    assert.equal(await audio.playNote('D4'), true);
    assert.equal(starts.length, 2);
    context.state = 'suspended';
    context.resume = async () => { throw Error('denied'); };
    await assert.rejects(audio.playNote('E4'), /denied/);
    assert.equal(audio.pressedNotes.has('E4'), false);
    assert.equal(starts.length, 2); assert.equal(calls.length, 0);
    await assert.rejects(audio.playNote('invalid'));
  });
});

test('very long or future input timestamps stay inside the event latency contract', async () => {
  for (const [offset, expected, bucket] of [[-20000, 9999.99, '>=500'], [20000, 0, '<50']]) {
    await withAudio(async ({ audio, calls }) => {
      await audio.playNote('C4', .9, performance.now() + offset);
      assert.equal(calls[0][2].input_to_start_ms, expected);
      assert.equal(calls[0][2].latency_bucket, bucket);
    });
  }
});
