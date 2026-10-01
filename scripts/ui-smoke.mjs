// Run against npm run build output. CI installs Playwright outside production dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PIANO_TEST_URL || 'http://127.0.0.1:4173';
const output = 'ui-artifacts';
await fs.mkdir(output, { recursive: true });
const report = { layouts: [], checks: [], errors: [] };
const browser = await chromium.launch();
async function check(name, action) {
  try { await action(); report.checks.push({ name, pass: true }); }
  catch (error) { report.checks.push({ name, pass: false, error: error.message }); }
}
async function context(options = {}) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
  // Exercise the existing oscillator fallback when third-party samples cannot load.
  await ctx.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  ctx.on('page', page => page.on('pageerror', error => report.errors.push({ url: page.url(), message: error.message })));
  return ctx;
}
async function ready(page, path) {
  const response = await page.goto(base + path, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, path);
  if (await page.locator('[data-studio]').count()) await page.waitForFunction(() => Boolean(window.pianoStudio));
}
try {
  const paths = [['home','/'],['piano','/piano.html'],['en-home','/en/'],['en-piano','/en/piano.html'],['songs','/songs/'],['song','/songs/happy-birthday/'],['en-song','/en/songs/happy-birthday/'],['hant-songs','/zh-hant/songs/'],['hant-song','/zh-hant/songs/happy-birthday/'],['learn','/tutorials.html'],['en-learn','/en/tutorials.html']];
  for (const width of [320, 390, 768, 1440]) {
    const ctx = await context({ viewport: { width, height: width < 600 ? 844 : 1000 }, hasTouch: width < 600 });
    for (const [name, path] of paths) {
      await check(`layout ${name} at ${width}px`, async () => {
        const page = await ctx.newPage();
        await ready(page, path);
        const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1: document.querySelectorAll('h1').length, keys: document.querySelectorAll('.keys .key').length }));
        report.layouts.push({ name, width, ...metrics });
        if ([390,1440].includes(width)) await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
        assert.equal(metrics.h1, 1);
        assert.ok(metrics.scrollWidth <= width + 1, `page overflow: ${metrics.scrollWidth} > ${width}`);
        if (await page.locator('[data-studio]').count()) assert.equal(metrics.keys, 37);
        await page.close();
      });
    }
    await ctx.close();
  }
  const ctx = await context({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await ready(page, '/piano.html');
  await check('keyboard chords, oscillator fallback and key release', async () => {
    await page.locator('[data-studio]').focus();
    await page.keyboard.down('a'); await page.keyboard.down('s');
    assert.equal(await page.locator('.key.active').count(), 2);
    await page.waitForFunction(() => window.pianoStudio.piano.audio.activeVoices.size >= 2);
    await page.keyboard.up('a'); await page.keyboard.up('s');
    assert.equal(await page.locator('.key.active').count(), 0);
    assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
  });
  await check('sustain releases held voices when switched off', async () => {
    await page.locator('#sustain-toggle').check(); await page.locator('[data-studio]').focus();
    await page.keyboard.press('k', { delay: 50 });
    assert.ok(await page.evaluate(() => window.pianoStudio.piano.audio.sustainedNotes.has('C4')));
    await page.locator('#sustain-toggle').uncheck();
    assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.sustainedNotes.size), 0);
  });
  await check('volume and label preferences persist after reload', async () => {
    await page.locator('#labels-toggle').uncheck();
    await page.locator('#studio-volume').evaluate(el => { el.value = '35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await ready(page, '/piano.html');
    assert.equal(await page.locator('#labels-toggle').isChecked(), false);
    assert.equal(await page.locator('#studio-volume').inputValue(), '35');
    assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.volume), .35);
    await page.locator('#labels-toggle').check();
  });
  await check('form controls do not play notes', async () => {
    await page.locator('[data-play-mode="guided"]').click();
    await page.locator('#song-select').focus(); await page.keyboard.press('w');
    assert.equal(await page.locator('.key.active').count(), 0);
    assert.equal(await page.evaluate(() => window.pianoStudio.piano.audio.pressedNotes.size), 0);
  });
  await check('guided mode works after clicking Start and advances only on correct notes', async () => {
    await page.locator('#song-select').selectOption('happy-birthday');
    await page.locator('#start-practice').click();
    const key = await page.evaluate(() => window.pianoStudio.practice.getKeyboardKeyForNote(window.pianoStudio.practice.currentSong.notes[0]));
    await page.keyboard.press(key.toLowerCase(), { delay: 40 });
    assert.equal(await page.evaluate(() => window.pianoStudio.practice.currentNoteIndex), 1);
    const wrong = await page.evaluate(() => { const p=window.pianoStudio.practice; return Object.entries(p.piano.keyMap).find(([,n])=>n!==p.currentSong.notes[p.currentNoteIndex])[0]; });
    await page.keyboard.press(wrong, { delay: 40 });
    assert.equal(await page.evaluate(() => window.pianoStudio.practice.currentNoteIndex), 1);
    assert.equal(await page.evaluate(() => window.pianoStudio.practice.wrongNotes), 1);
    await page.screenshot({ path: `${output}/guided-1440.png`, fullPage: true });
  });
  await check('fullscreen keeps guidance, hides ads and shows completion inside the instrument', async () => {
    await page.evaluate(() => { const ad=document.createElement('ins'); ad.className='adsbygoogle'; ad.id='test-ad'; ad.style.display='block'; document.body.append(ad); });
    await page.locator('#toggle-fullscreen').click();
    await page.waitForFunction(() => document.body.classList.contains('studio-focus'));
    assert.equal(await page.locator('#test-ad').evaluate(el=>getComputedStyle(el).display), 'none');
    assert.ok(await page.locator('#key-hint').isVisible());
    await page.screenshot({ path: `${output}/fullscreen-1440.png` });
    const keys=await page.evaluate(()=>{const p=window.pianoStudio.practice;return p.currentSong.notes.slice(p.currentNoteIndex).map(n=>p.getKeyboardKeyForNote(n).toLowerCase());});
    for(const key of keys) await page.keyboard.press(key,{delay:35});
    await page.locator('[data-studio] .practice-result-modal').waitFor();
    assert.equal(await page.evaluate(()=>window.pianoStudio.practice.isPlaying),false);
    await page.locator('[data-action="close"]').click();
    await page.locator('#toggle-fullscreen').click();
    await page.waitForFunction(()=>!document.body.classList.contains('studio-focus'));
    assert.equal(await page.locator('#test-ad').evaluate(el=>getComputedStyle(el).display),'block');
  });
  await check('fullscreen-denied fallback exits with Escape and restores focus', async () => {
    await page.evaluate(()=>{document.querySelector('[data-studio]').requestFullscreen=()=>Promise.reject(new DOMException('Test denied','NotAllowedError'));});
    await page.locator('#toggle-fullscreen').click();
    await page.waitForFunction(()=>document.querySelector('[data-studio]').classList.contains('studio-focus-fallback'));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.body.classList.contains('studio-focus')),false);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'toggle-fullscreen');
  });
  await check('loss of window focus releases pressed notes', async () => {
    await page.locator('[data-play-mode="free"]').click(); await page.keyboard.down('k');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur'))); await page.keyboard.up('k');
    assert.equal(await page.locator('.key.active').count(),0);
    assert.equal(await page.evaluate(()=>window.pianoStudio.piano.audio.pressedNotes.size),0);
  });
  await check('library search, category filters and empty state reset', async () => {
    await ready(page,'/songs/');
    assert.equal(await page.locator('.song-category-section .song-card').count(),100);
    await page.locator('#library-search').fill('Beethoven');
    assert.ok(await page.locator('.song-category-section .song-card:visible').count()>0);
    await page.locator('#library-search').fill('no-song-xyzxyz');
    assert.ok(await page.locator('#library-empty').isVisible());
    await page.locator('#library-reset').click();
    assert.equal(await page.locator('.song-category-section .song-card:visible').count(),100);
    await page.locator('[data-library-filter="classical"]').click();
    assert.equal(await page.locator('.song-category-section .song-card:visible:not([data-category="classical"])').count(),0);
  });
  await check('song details select the right song and render an interactive score', async () => {
    await ready(page,'/en/songs/happy-birthday/');
    assert.equal(await page.locator('#song-select').inputValue(),'happy-birthday');
    assert.ok(await page.locator('[data-score-canvas] svg').count()>0);
    await page.locator('[data-start-song]').click();
    await page.waitForFunction(()=>window.pianoStudio.practice.isPlaying);
    assert.equal(await page.evaluate(()=>window.pianoStudio.practice.currentSong.id),'happy-birthday');
  });
  await ctx.close();
  const mobile=await context({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const touchPage=await mobile.newPage();
  await ready(touchPage,'/piano.html');
  await check('mobile touch, octave navigation and visible guided target', async () => {
    const initial=await touchPage.locator('#keyboard-viewport').evaluate(el=>el.scrollLeft);
    await touchPage.locator('[data-octave="1"]').tap();
    await touchPage.waitForFunction(x=>document.getElementById('keyboard-viewport').scrollLeft>x,initial);
    await touchPage.locator('[data-play-mode="guided"]').tap();
    await touchPage.locator('#start-practice').tap();
    const key=touchPage.locator('.key.current');
    const [bounds,frame]=await Promise.all([key.boundingBox(),touchPage.locator('#keyboard-viewport').boundingBox()]);
    assert.ok(bounds.x>=frame.x-1 && bounds.x+bounds.width<=frame.x+frame.width+1);
    await key.tap({position:{x:bounds.width/2,y:bounds.height-12}});
    assert.equal(await touchPage.evaluate(()=>window.pianoStudio.practice.currentNoteIndex),1);
    assert.equal(await touchPage.locator('.key.active').count(),0);
    await touchPage.screenshot({path:`${output}/guided-390.png`,fullPage:true});
  });
  await mobile.close();
} catch(error) {
  report.errors.push({message:error.stack});
} finally {
  await browser.close();
  report.passed=report.checks.filter(c=>c.pass).length;
  report.failed=report.checks.filter(c=>!c.pass).length;
  await fs.writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
if(report.failed || report.errors.length)process.exitCode=1;
