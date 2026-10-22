import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import PianoAudio from '../js/piano-audio.js';

class Param {
  value=1;
  setValueAtTime(value){this.value=value;}
  exponentialRampToValueAtTime(value){this.value=value;}
  setTargetAtTime(value){this.value=value;}
  cancelScheduledValues(){}
}
class FakeContext {
  state='running'; currentTime=1; destination={}; starts=[]; resumes=0;
  createGain(){return {gain:new Param(),connect(){},disconnect(){}};}
  createBufferSource(){return this.source('sample');}
  createOscillator(){return this.source('fallback');}
  source(kind){const self=this;return {frequency:new Param(),playbackRate:new Param(),connect(){},disconnect(){},start(){self.starts.push({kind,source:this});},stop(){}};}
  decodeAudioData(){return Promise.resolve({duration:3});}
  resume(){this.resumes++;this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
}
const audios=[];
const originalFetch=globalThis.fetch, originalWindow=globalThis.window;
function audio(){
  globalThis.window={AudioContext:FakeContext};
  globalThis.fetch=(_url,{signal}={})=>new Promise((_resolve,reject)=>signal?.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
  const instance=new PianoAudio();audios.push(instance);return instance;
}
afterEach(()=>{for(const a of audios.splice(0))a.dispose();globalThis.fetch=originalFetch;globalThis.window=originalWindow;});
async function settlesWithoutNetwork(promise){return Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve('blocked-on-network'),30))]);}

test('cold quick tap starts sound without awaiting an mp3 request',async()=>{
 const a=audio();await a.init();const play=a.playNote('D3');a.stopNote('D3');
 assert.notEqual(await settlesWithoutNetwork(play),'blocked-on-network');
 assert.equal(a.context.starts.length,1);
 assert.equal(a.pressedNotes.size,0);
});
test('all 37 pitches have immediate fallback on a cold or unavailable network',async()=>{
 const a=audio();await a.init();
 const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
 for(let midi=48;midi<=84;midi++){
  const note=names[midi%12]+(Math.floor(midi/12)-1);
  assert.notEqual(await settlesWithoutNetwork(a.playNote(note)),'blocked-on-network',note);
  assert.equal(a.context.starts.at(-1).source.frequency.value,440*2**((midi-69)/12));
  a.stopNote(note);
 }
 assert.equal(a.context.starts.length,37);
});
test('cached nearby sample uses the right pitch without awaiting the exact sample',async()=>{
 const a=audio();await a.init();a.buffers.set('C4',{duration:3});
 assert.notEqual(await settlesWithoutNetwork(a.playNote('C#4')),'blocked-on-network');
 const start=a.context.starts.at(-1);assert.equal(start.kind,'sample');
 assert.equal(start.source.playbackRate.value,2**(1/12));
});
test('a released key can be retriggered inside the former duplicate window',async()=>{
 const a=audio();await a.init();a.buffers.set('C4',{duration:3});
 await a.playNote('C4');a.stopNote('C4');await a.playNote('C4');
 assert.equal(a.context.starts.length,2);
});
test('short first tap still gets an attack when audio resume completes',async()=>{
 const a=audio();await a.init();a.context.state='suspended';let resume;
 a.context.resume=()=>new Promise(resolve=>{resume=()=>{a.context.state='running';resolve();};});
 const play=a.playNote('C4');a.stopNote('C4');resume();
 assert.notEqual(await settlesWithoutNetwork(play),'blocked-on-network');
 assert.equal(a.context.starts.length,1);assert.equal(a.pressedNotes.size,0);
});
test('interrupted audio context is resumed before playing',async()=>{
 const a=audio();await a.init();a.context.state='interrupted';
 await settlesWithoutNetwork(a.playNote('C3'));
 assert.equal(a.context.resumes,1);assert.equal(a.context.state,'running');
});
test('stopAll cancels pending audio unlock so old notes cannot play later',async()=>{
 const a=audio();await a.init();a.context.state='suspended';let resume;
 a.context.resume=()=>new Promise(resolve=>{resume=()=>{a.context.state='running';resolve();};});
 const play=a.playNote('C4');a.stopAll();resume();await play;
 assert.equal(a.context.starts.length,0);assert.equal(a.pressedNotes.size,0);
});
test('sustain keeps released notes until the pedal is released',async()=>{
 const a=audio();await a.init();a.setSustain(true);await a.playNote('C4');a.stopNote('C4');
 assert.ok(a.sustainedNotes.has('C4'));assert.equal([...a.activeVoices.get('C4')][0].released,false);
 a.setSustain(false);assert.equal(a.sustainedNotes.size,0);assert.equal([...a.activeVoices.get('C4')][0].released,true);
});
test('failed sample requests are backoff limited without disabling playback',async()=>{
 const a=audio();let requests=0;globalThis.fetch=async()=>{requests++;return {ok:false,status:404};};
 await a.init();await new Promise(r=>setTimeout(r,0));
 await a.playNote('D3');a.stopNote('D3');await new Promise(r=>setTimeout(r,0));const first=requests;
 await a.playNote('D3');a.stopNote('D3');await new Promise(r=>setTimeout(r,0));
 assert.equal(requests,first);assert.equal(a.context.starts.length,2);
});

test('idle warmup preloads 19 natural samples before input and deduplicates init/play',async()=>{
 const a=audio();let idle,requests=[];
 window.requestIdleCallback=callback=>{idle=callback;return 7;};window.cancelIdleCallback=()=>{};
 globalThis.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 a.scheduleWarmup();a.scheduleWarmup();assert.equal(a.context,null);assert.equal(requests.length,0);
 idle();await a.init();await a.playNote('C3');await Promise.all(a.loadingBuffers.values());
 assert.equal(requests.length,19);assert.equal(a.buffers.size,19);
 assert.ok(a.buffers.has('C3')&&a.buffers.has('G5'));
 assert.ok(requests.every(r=>r.options.cache==='force-cache'));
 assert.equal(new Set(requests.map(r=>r.url)).size,19);
});

test('input before idle cancels scheduled work and concurrent loads share one fetch',async()=>{
 const a=audio();let idle,cancelled=0,requests=0;
 window.requestIdleCallback=callback=>{idle=callback;return 7;};window.cancelIdleCallback=id=>{assert.equal(id,7);cancelled++;};
 globalThis.fetch=(_url,{signal})=>{requests++;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))));};
 a.scheduleWarmup();await a.playNote('C4');
 a.loadBuffer('C4').catch(()=>{});a.loadBuffer('C4').catch(()=>{});idle();
 assert.equal(cancelled,1);assert.equal(requests,19);assert.equal(a.context.starts.length,1);
});

test('dispose cancels idle and aborts in-flight sample warmup',async()=>{
 const a=audio();let idle,cancelled=0;
 window.requestIdleCallback=callback=>{idle=callback;return 7;};window.cancelIdleCallback=()=>cancelled++;
 a.scheduleWarmup();a.dispose();idle();assert.equal(cancelled,1);assert.equal(a.context,null);
 const b=audio();await b.init();const signals=[...b.loadControllers.values()].map(c=>c.signal);
 b.dispose();assert.equal(signals.length,19);assert.ok(signals.every(s=>s.aborted));
});

test('without requestIdleCallback warmup waits 1200ms and can be cancelled',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const a=audio();a.scheduleWarmup();t.mock.timers.tick(1199);assert.equal(a.context,null);
 t.mock.timers.tick(1);assert.ok(a.context);a.dispose();
 const b=audio();b.scheduleWarmup();b.dispose();t.mock.timers.tick(1200);assert.equal(b.context,null);
});
