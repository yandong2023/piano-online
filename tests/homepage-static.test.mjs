import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderStudioPage, studioInstrument } from '../scripts/studio-pages.mjs';

for (const locale of ['zh','en']) for (const home of [true,false]) {
  test(`${locale} ${home ? 'home' : 'piano'} has a playable first paint and accurate content`, () => {
    const html=renderStudioPage(locale,home);
    assert.match(html, /class="studio-page"/);
    assert.match(html, /\/css\/studio\.css/);
    assert.match(html, /\/js\/studio\.js/);
    for (const id of ['song-select','sustain-toggle','labels-toggle','start-practice','stop-practice','start-rhythm-game','toggle-fullscreen','studio-volume','keyboard-viewport']) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.indexOf('data-studio') < html.indexOf('class="studio-discover"'));
    assert.doesNotMatch(html, /tutorial-overlay|88键|88 keys|src="piano\.js"/);
    assert.match(html, /37/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="zh-CN"/);
    assert.equal(html.includes('adsbygoogle.js'), home);
    assert.equal((html.match(/<h1>/g)||[]).length,1);
  });
}
test('instrument controls use labels, button types and live status',()=>{
  const html=studioInstrument('zh');
  assert.match(html,/for="song-select"/); assert.match(html,/for="studio-volume"/);
  assert.match(html,/aria-pressed="true"/); assert.match(html,/role="status"/);
  assert.match(html,/data-play-mode="guided"/); assert.match(html,/id="studio-song-bar" hidden/);
});
test('input and focus safety are implemented without replacing the audio engine',async()=>{
  const source=await readFile('js/studio.js','utf8');
  for(const term of ['pointercancel','lostpointercapture','visibilitychange','isFormControl','noteHolders','studio-focus-fallback','aria-pressed','releaseAll']) assert.ok(source.includes(term));
  assert.match(source,/extends Piano/);
});
test('legacy homepage modules remain inert compatibility shims',async()=>{
  for(const file of ['js/home-premium-style.js','js/en-home-style.js'])assert.doesNotMatch(await readFile(file,'utf8'),/textContent|classList\.add|createElement\(['"]link/);
});
