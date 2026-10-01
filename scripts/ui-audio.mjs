// Actual Web Audio signal tests: never infer audibility from a highlighted key.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PIANO_TEST_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const report = { checkedOrigin: base, checks: [], errors: [] };
const notes = Array.from({length:37},(_,i)=>['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][i%12]+(3+Math.floor(i/12)));
async function check(name, action) {
 try { const result=await action(); report.checks.push({name,pass:true,...result}); }
 catch(error) { report.checks.push({name,pass:false,error:error.message}); }
}
async function pageFor(path, mode='warm', mobile=false) {
 const context=await browser.newContext({viewport:{width:mobile?390:1440,height:1000},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 if(mode==='blocked') await context.route('**/samples/*.mp3',()=>{});
 if(mode==='404') await context.route('**/samples/*.mp3',route=>route.fulfill({status:404,body:'Missing'}));
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+path,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.pianoStudio);
 await page.evaluate(async warm=>{
  const audio=window.pianoStudio.piano.audio;
  if(warm) {
   const {SAMPLE_NOTES}=await import('/js/audio-note-utils.mjs');
   await Promise.all(SAMPLE_NOTES.map(note=>audio.loadBuffer(note)));
  }
  window.__starts=[];window.__peak=0;
  const analyser=audio.context.createAnalyser();analyser.fftSize=512;
  audio.gainNode.connect(analyser);
  const data=new Float32Array(analyser.fftSize);
  setInterval(()=>{analyser.getFloatTimeDomainData(data);for(const sample of data)window.__peak=Math.max(window.__peak,Math.abs(sample));},4);
  for(const name of ['createBufferSource','createOscillator']) {
   const original=audio.context[name].bind(audio.context);
   audio.context[name]=()=>{const source=original(),start=source.start.bind(source);source.start=(...args)=>{window.__starts.push({type:name,at:performance.now()});return start(...args);};return source;};
  }
 },mode==='warm');
 return {context,page};
}
async function strike(page,note,method) {
 await page.waitForFunction(()=>window.pianoStudio.piano.audio.activeVoices.size===0);
 await page.waitForTimeout(20);
 await page.evaluate(()=>{window.__peak=0;window.__starts=[];});
 if(method==='keyboard') {
  const key=await page.evaluate(note=>Object.entries(window.pianoStudio.piano.keyMap).find(([,n])=>n===note)[0],note);
  await page.locator('[data-studio]').focus();await page.keyboard.press(key,{delay:10});
 } else {
  await page.evaluate(note=>{const view=document.getElementById('keyboard-viewport'),key=window.pianoStudio.piano.keys[note];view.scrollLeft=key.offsetLeft-view.clientWidth/2;},note);
  const key=page.locator(`.keys .key[data-note="${note}"]`),bounds=await key.boundingBox();
  await key[method]({position:{x:bounds.width/2,y:bounds.height-15}});
 }
 await page.waitForTimeout(65);
 const result=await page.evaluate(()=>({peak:window.__peak,starts:window.__starts,note:document.getElementById('studio-note').textContent,held:window.pianoStudio.piano.audio.pressedNotes.size}));
 assert.equal(result.note,note,'wrong note mapped');
 assert.equal(result.starts.length,1,'one and only one attack per input');
 assert.ok(result.peak>0.0001,`no output signal (${result.peak})`);
 assert.ok(result.peak<0.1,`unexpected single-note volume spike (${result.peak})`);
 assert.equal(result.held,0,'released input stuck held');
 return {peak:result.peak,source:result.starts[0].type};
}
try {
 for(const [mode,method,path,mobile] of [
  ['blocked','keyboard','/piano.html',false],
  ['warm','click','/en/songs/happy-birthday/',false],
  ['warm','tap','/piano.html',true],
 ]) {
  const {context,page}=await pageFor(path,mode,mobile);
  for(const note of notes) await check(`${mode} ${method} ${note} produces audio`,()=>strike(page,note,method));
  await context.close();
 }
 const {context,page}=await pageFor('/piano.html','404');
 for(const note of ['C3','D#4','C6']) await check(`404 samples ${note} still sounds`,()=>strike(page,note,'keyboard'));
 await check('select focus returns to instrument on a piano click',async()=>{
  await page.locator('[data-play-mode="guided"]').click();
  await page.locator('#song-select').focus();
  await page.locator('.key[data-note="C4"]').click({position:{x:10,y:185}});
  assert.equal(await page.evaluate(()=>document.activeElement.id),'practice-start');
  await page.keyboard.press('s',{delay:30});
  assert.equal(await page.locator('#studio-note').innerText(),'D3');
 });
 for(const [key,note] of [['Shift+Semicolon','E4'],['Shift+Comma','C6'],['Shift+Digit1','C#3']]) {
  await check(`${key} plays and releases ${note}`,async()=>{
   await page.locator('[data-studio]').focus();await page.keyboard.press(key,{delay:30});
   assert.equal(await page.locator('#studio-note').innerText(),note);
   assert.equal(await page.locator('.key.active').count(),0);
  });
 }
 await check('full-width punctuation and IME physical keys work outside form fields',async()=>{
  for(const [key,code,note] of [['；','Semicolon','E4'],['，','Comma','C6'],['Process','KeyA','C3']]) {
   await page.evaluate(({key,code})=>{
    document.dispatchEvent(new KeyboardEvent('keydown',{key,code,bubbles:true}));
    document.dispatchEvent(new KeyboardEvent('keyup',{key,code,bubbles:true}));
   },{key,code});
   assert.equal(await page.locator('#studio-note').innerText(),note);
  }
 });
 await check('audio recovers after suspend and a new key press',async()=>{
  await page.waitForFunction(()=>window.pianoStudio.piano.audio.activeVoices.size===0);
  await page.evaluate(()=>window.pianoStudio.piano.audio.context.suspend());
  await strike(page,'C4','keyboard');
  assert.equal(await page.evaluate(()=>window.pianoStudio.piano.audio.context.state),'running');
 });
 await context.close();
} catch(error) { report.errors.push(error.stack); }
finally {
 await browser.close();report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.checks.filter(c=>!c.pass).length;
 await fs.mkdir('ui-artifacts',{recursive:true});
 await fs.writeFile('ui-artifacts/audio-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
if(report.failed||report.errors.length)process.exitCode=1;
