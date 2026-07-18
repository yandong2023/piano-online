import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('homepage promotes a guided first song instead of only free play', async () => {
  const source = await readFile('js/guided-homepage.js', 'utf8');

  assert.match(source, /DEFAULT_GUIDED_SONG = 'happy-birthday'/);
  assert.match(source, /跟着《生日快乐》弹/);
  assert.match(source, /弹完你的.*第一首歌/);
  assert.match(source, /data-guided-song/);
  assert.match(source, /guided-start-steps/);
  assert.match(source, /自由弹奏与更多玩法/);
});

test('guided entry selects the song, enters focus mode and starts practice', async () => {
  const source = await readFile('js/guided-entry-bindings.js', 'utf8');

  assert.match(source, /select\.dispatchEvent\(new Event\('change'/);
  assert.match(source, /requestFullscreen/);
  assert.match(source, /guided-focus-fallback/);
  assert.match(source, /startButton\.click\(\)/);
  assert.match(source, /guided_song_entry/);
  assert.match(source, /guided_fullscreen_result/);
  assert.match(source, /Step 2: Start guided practice/);
});

test('focused practice keeps the prompt and keyboard in one viewport', async () => {
  const css = await readFile('css/guided-practice-fullscreen.css', 'utf8');

  assert.match(css, /practice-section\.guided-focus-active/);
  assert.match(css, /grid-template-rows:/);
  assert.match(css, /\.practice-status-panel/);
  assert.match(css, /\.piano-container/);
  assert.match(css, /\.hint-key/);
  assert.match(css, /guided-focus-toolbar/);
  assert.match(css, /guided-visible-fullscreen/);
});

test('main initializes guided UX before the user starts playing', async () => {
  const source = await readFile('js/main.js', 'utf8');

  assert.match(source, /initializeGuidedHomepage\(\)/);
  assert.match(source, /initializeGuidedEntryBindings\(\)/);
});

test('first-visit tutorial no longer teaches only a single A key press', async () => {
  const source = await readFile('js/tutorial.js', 'utf8');

  assert.doesNotMatch(source, /handleKeyPress|tutorial-key-demo|Press A|按下 A/);
  assert.match(source, /tutorial-start/);
  assert.match(source, /tutorial-skip/);
});
