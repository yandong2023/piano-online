import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const base = process.env.PIANO_TEST_URL || 'http://127.0.0.1:4173';
const report = JSON.parse(await fs.readFile('ui-artifacts/report.json','utf8'));
try {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  const page=await context.newPage();
  for(const path of ['/songs/happy-birthday/','/en/songs/happy-birthday/','/zh-hant/songs/happy-birthday/']) {
    await page.goto(base+path,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>!!window.pianoStudio);
    await page.locator('[data-view-keys]').tap();
    await page.locator('#keyboard-notes').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>location.hash),'#keyboard-notes');
    assert.equal(await page.evaluate(()=>location.pathname),path);
    await page.locator('[data-start-song]').tap();
    assert.equal(await page.evaluate(()=>window.pianoStudio.practice.isPlaying),true);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'practice-start');
    report.checks.push({name:`mobile song preview and immediate start: ${path}`,pass:true});
  }
  const cdp=await context.newCDPSession(page);
  await page.locator('[data-play-mode="free"]').tap();
  await page.locator('#practice-start').scrollIntoViewIfNeeded();
  const points=await page.evaluate(()=>{
    const frame=document.getElementById('keyboard-viewport').getBoundingClientRect();
    return [...document.querySelectorAll('.key.white')].map(el=>el.getBoundingClientRect()).filter(r=>r.left>=frame.left&&r.right<=frame.right).slice(0,2).map((r,i)=>({id:i+1,x:r.x+r.width/2,y:r.bottom-20}));
  });
  assert.equal(points.length,2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  await page.waitForFunction(()=>document.querySelectorAll('.key.active').length===2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>document.querySelectorAll('.key.active').length===0);
  report.checks.push({name:'two simultaneous touch contacts release without stuck notes',pass:true});
  await context.close();
} catch(error) {
  report.checks.push({name:'mobile song-link and multi-touch regressions',pass:false,error:error.stack});
} finally {
  await browser.close();
  report.passed=report.checks.filter(c=>c.pass).length;
  report.failed=report.checks.filter(c=>!c.pass).length;
  await fs.writeFile('ui-artifacts/report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.checks.slice(-4),null,2));
}
if(report.failed||report.errors.length)process.exitCode=1;
