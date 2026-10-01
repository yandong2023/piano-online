import { Piano } from './piano.js';
import { PracticeMode } from './practice-mode.js';
import { RhythmGame } from './rhythm-game.js';

const english = document.documentElement.lang.toLowerCase().startsWith('en');
const text = (zh, en) => english ? en : zh;
const $ = (id) => document.getElementById(id);
const root = document.querySelector('[data-studio]');
const isFormControl = (target) => target instanceof Element && Boolean(target.closest('input,select,textarea,[contenteditable="true"]'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reuse the existing audio and song engines. Input is scoped and multi-pointer safe.
class StudioPiano extends Piano {
  generateKeyboard() {
    const keys = document.querySelector('.keys');
    keys.replaceChildren();
    super.generateKeyboard();
    let whites = 0;
    keys.querySelectorAll('.key').forEach((key) => {
      if (key.classList.contains('white')) whites += 1;
      else key.style.setProperty('--key-left', `${whites / 22 * 100}%`);
      key.setAttribute('role', 'button');
      key.tabIndex = 0;
      key.setAttribute('aria-pressed', 'false');
      key.setAttribute('aria-label', `${key.dataset.note}${key.textContent ? ` · ${key.textContent}` : ''}`);
      const label = document.createElement('span');
      label.className = 'key-note';
      label.textContent = key.dataset.note;
      key.append(label);
    });
    keys.classList.add('show-labels');
  }

  setupEventListeners() {
    this.pointers = new Map();
    this.keyboardHeld = new Map();
    this.noteHolders = new Map();
    this.manualSustain = false;
    this.spaceSustain = false;
    this.midiSustain = false;
    const hold = (note) => {
      const count = this.noteHolders.get(note) || 0;
      this.noteHolders.set(note, count + 1);
      if (!count) this.pressKey(note);
    };
    const release = (note) => {
      const count = this.noteHolders.get(note) || 0;
      if (count <= 1) { this.noteHolders.delete(note); this.releaseKey(note); }
      else this.noteHolders.set(note, count - 1);
    };
    root.querySelector('.keys').addEventListener('pointerdown', (event) => {
      const key = event.target.closest('.key');
      if (!key || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      key.setPointerCapture?.(event.pointerId);
      this.pointers.set(event.pointerId, key.dataset.note);
      hold(key.dataset.note);
    });
    root.addEventListener('pointermove', (event) => {
      const previous = this.pointers.get(event.pointerId);
      if (!previous) return;
      const key = document.elementFromPoint(event.clientX, event.clientY)?.closest('.key');
      if (key && root.contains(key) && key.dataset.note !== previous) {
        release(previous); hold(key.dataset.note); this.pointers.set(event.pointerId, key.dataset.note);
      }
    });
    const releasePointer = (event) => {
      const note = this.pointers.get(event.pointerId);
      if (note) release(note);
      this.pointers.delete(event.pointerId);
    };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    root.addEventListener('lostpointercapture', releasePointer);
    document.addEventListener('keydown', (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const pianoKey = event.target instanceof Element && event.target.closest('.key');
      const note = pianoKey && ['Enter', 'Space'].includes(event.code)
        ? pianoKey.dataset.note : (!isFormControl(event.target) || pianoKey) && this.keyMap[event.key.toLowerCase()];
      if (note) { event.preventDefault(); this.keyboardHeld.set(event.code, note); hold(note); }
      else if (event.code === 'Space' && !isFormControl(event.target) && !event.target.closest?.('button,a,summary')) {
        event.preventDefault(); this.spaceSustain = true; this.applySustain();
      }
    });
    document.addEventListener('keyup', (event) => {
      const note = this.keyboardHeld.get(event.code);
      if (note) { release(note); this.keyboardHeld.delete(event.code); }
      if (event.code === 'Space' && this.spaceSustain) { this.spaceSustain = false; this.applySustain(); }
    });
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
  }

  pressKey(note) {
    this.keys[note]?.classList.add('active');
    this.keys[note]?.setAttribute('aria-pressed', 'true');
    this.audio.playNote(note).catch(showError);
    this.onNotePlay?.(note);
  }
  releaseKey(note) {
    this.keys[note]?.classList.remove('active');
    this.keys[note]?.setAttribute('aria-pressed', 'false');
    this.audio.stopNote(note);
  }
  handleMIDIMessage(message) {
    const command = message.data[0] >> 4;
    if (command === 11 && message.data[1] === 64) {
      this.midiSustain = message.data[2] >= 64;
      this.applySustain();
    } else { super.handleMIDIMessage(message); }
  }
  applySustain() {
    this.sustainPedal = this.manualSustain || this.spaceSustain || this.midiSustain;
    this.audio.setSustain(this.sustainPedal);
    $('sustain-toggle').checked = this.sustainPedal;
  }
  releaseAll() {
    this.spaceSustain = false;
    this.midiSustain = false;
    this.audio.setSustain(false);
    [...this.audio.pressedNotes].forEach((note) => this.releaseKey(note));
    this.pointers.clear(); this.keyboardHeld.clear(); this.noteHolders.clear();
    this.applySustain();
  }
}

function showError(error) {
  console.error('Piano studio:', error);
  $('studio-error').hidden = false;
  $('studio-error').textContent = text('声音暂时无法开启。请检查浏览器权限，或刷新页面重试。', 'Audio could not start. Check browser permissions or reload to try again.');
}
function saveSettings(value) { try { localStorage.setItem('piano-studio-settings', JSON.stringify(value)); } catch {} }
function readSettings() { try { return JSON.parse(localStorage.getItem('piano-studio-settings') || '{}') || {}; } catch { return {}; } }

async function initialize() {
  if (!root) return;
  const piano = new StudioPiano();
  const ready = await piano.audio.init();
  if (!ready) { showError(new Error('Web Audio unavailable')); return; }
  const practice = new PracticeMode(piano);
  const showResult = practice.showResultModal.bind(practice);
  practice.showResultModal = (options) => {
    showResult(options);
    if (document.fullscreenElement === root || root.classList.contains('studio-focus-fallback')) root.append(practice.resultModal);
    practice.resultModal?.querySelector('button')?.focus();
  };
  practice.getSongName = () => $('song-select').selectedOptions[0]?.textContent || '';
  const saveProgress = practice.saveProgress.bind(practice);
  practice.saveProgress = (...args) => {
    try { return saveProgress(...args); }
    catch { return {bestScore:args[0],isNewBest:false}; }
  };
  const rhythm = new RhythmGame(piano);
  window.pianoPracticeMode = practice;
  window.pianoStudio = { piano, practice, rhythm };
  let mode = 'free';
  const viewport = $('keyboard-viewport');
  const songSelect = $('song-select');
  const settings = readSettings();
  const volume = Number(settings.volume);
  if (Number.isFinite(volume) && volume >= 0 && volume <= 100) $('studio-volume').value = volume;
  if (typeof settings.labels === 'boolean') $('labels-toggle').checked = settings.labels;
  const applySettings = () => {
    piano.audio.setVolume(Number($('studio-volume').value) / 100);
    $('studio-volume-value').textContent = `${$('studio-volume').value}%`;
    root.querySelector('.keys').classList.toggle('show-labels', $('labels-toggle').checked);
    saveSettings({ volume: Number($('studio-volume').value), labels: $('labels-toggle').checked });
  };
  applySettings();
  $('studio-volume').addEventListener('input', applySettings);
  $('labels-toggle').addEventListener('change', applySettings);
  $('sustain-toggle').addEventListener('change', (event) => { piano.manualSustain = event.target.checked; piano.applySustain(); });
  piano.audio.context.onstatechange = () => {
    $('studio-audio-status').textContent = piano.audio.context.state === 'running'
      ? text('声音已开启', 'Sound enabled') : text('按下琴键开启声音', 'Press a key to enable sound');
  };
  const updateIdle = () => {
    $('start-practice').textContent = text('开始跟弹', 'Start learning');
    $('stop-practice').textContent = text('停止练习', 'Stop practice');
    if (practice.isPlaying) return;
    $('studio-message').textContent = mode === 'guided' ? songSelect.selectedOptions[0]?.textContent : text('随手按下一个音符。', 'Make yourself a little music.');
    $('studio-submessage').textContent = mode === 'guided'
      ? text('准备好后点击「开始跟弹」，不用赶节拍。', 'Press Start learning when ready. Take it at your own pace.')
      : text('点击琴键，或按电脑键盘上的 A、S、D。', 'Click a key, or press A, S, D on your keyboard.');
    $('studio-upcoming').hidden = true;
  };
  function setMode(next) {
    mode = next;
    if (next === 'free') { practice.stopPractice(); if (rhythm.isPlaying) rhythm.stopGame(); }
    root.querySelectorAll('[data-play-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.playMode === next)));
    $('studio-song-bar').hidden = next === 'free';
    updateIdle();
  }
  root.querySelectorAll('[data-play-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.playMode)));
  root.querySelectorAll('[data-octave]').forEach(button => button.addEventListener('click', () => {
    viewport.scrollBy({left:Number(button.dataset.octave) * Math.min(viewport.clientWidth * .85, 322),behavior:reducedMotion ? 'instant' : 'smooth'});
  }));
  function keepNoteVisible(note) {
    const key = piano.keys[note]; if (!key) return;
    const bounds=key.getBoundingClientRect(), frame=viewport.getBoundingClientRect();
    if (bounds.left < frame.left + 5 || bounds.right > frame.right - 5) {
      viewport.scrollTo({left:key.offsetLeft - viewport.clientWidth / 2 + key.offsetWidth / 2,behavior:'instant'});
    }
  }
  function refreshPractice() {
    if (!practice.isPlaying) { updateIdle(); return; }
    setMode('guided');
    $('studio-message').textContent = songSelect.selectedOptions[0]?.textContent;
    $('studio-submessage').textContent = text('跟着金色琴键弹，按对再继续。', 'Play the gold key. The song waits for you.');
    $('studio-upcoming').hidden = false;
    $('studio-upcoming').replaceChildren(...practice.currentSong.notes.slice(practice.currentNoteIndex, practice.currentNoteIndex + 9).map(note => {
      const el=document.createElement('span'); el.textContent=practice.getKeyboardKeyForNote(note) || note; el.title=note; return el;
    }));
    $('studio-progressbar').value = practice.currentNoteIndex / practice.currentSong.notes.length * 100;
    keepNoteVisible(practice.currentSong.notes[practice.currentNoteIndex]);
  }
  document.addEventListener('piano:practice-start', () => { if (rhythm.isPlaying) rhythm.stopGame(); refreshPractice(); });
  document.addEventListener('piano:practice-progress', refreshPractice);
  document.addEventListener('piano:practice-stop', updateIdle);
  const handlePracticeNote = piano.onNotePlay;
  piano.onNotePlay = (note) => { $('studio-note').textContent=note; handlePracticeNote?.(note); };
  songSelect.addEventListener('change', () => {
    if (practice.isPlaying) practice.stopPractice();
    if (rhythm.isPlaying) rhythm.stopGame();
    $('start-rhythm-game').disabled = !rhythm.songData[songSelect.value];
    updateIdle();
  });
  $('start-rhythm-game').addEventListener('click', () => { practice.stopPractice(); setMode('guided'); },{capture:true});
  const requested = new URLSearchParams(location.search).get('song');
  if (requested && [...songSelect.options].some(o=>o.value===requested)) { songSelect.value=requested; mode='guided'; }
  if (document.body.dataset.songId) { songSelect.value=document.body.dataset.songId; mode='guided'; }
  songSelect.dispatchEvent(new Event('change',{bubbles:true}));
  setMode(mode);
  keepNoteVisible('C4');

  // Never ask for MIDI permission on page load.
  $('studio-midi').addEventListener('click',async()=>{
    const status=$('studio-midi-status');
    if (!navigator.requestMIDIAccess) { status.textContent=text('当前浏览器不支持 MIDI。', 'MIDI is not supported in this browser.'); return; }
    try {
      const access=await navigator.requestMIDIAccess({sysex:false});
      const sync=()=>{
        let count=0; for(const input of access.inputs.values()) if(input.state==='connected'){ count++; input.onmidimessage=e=>piano.handleMIDIMessage(e); }
        status.textContent=count ? text('MIDI 已连接','MIDI connected') : text('请连接 MIDI 键盘。','Connect a MIDI keyboard.');
      }; access.onstatechange=sync; sync();
    } catch { status.textContent=text('未获得 MIDI 权限，仍可用鼠标或电脑键盘弹奏。','MIDI permission was not granted. Mouse and computer keyboard still work.'); }
  });

  let focusReturn = null;
  const fullButton=$('toggle-fullscreen');
  const focused=()=>document.fullscreenElement===root || root.classList.contains('studio-focus-fallback');
  const updateFocus=()=>{
    const active=focused();
    document.body.classList.toggle('studio-focus',active);
    fullButton.setAttribute('aria-pressed',String(active));
    root.querySelector('[data-fullscreen-label]').textContent=active?text('退出全屏','Exit full screen'):text('专注全屏','Full screen');
    if(!active)focusReturn?.focus({preventScroll:true});
  };
  async function exitFocus(){
    root.classList.remove('studio-focus-fallback');
    if(document.fullscreenElement===root)try{await document.exitFullscreen();}catch{}
    updateFocus();
  }
  fullButton.addEventListener('click',async()=>{
    if(focused()){await exitFocus();return;}
    focusReturn=document.activeElement;
    try{if(!root.requestFullscreen)throw new Error('No native fullscreen');await root.requestFullscreen();}
    catch{root.classList.add('studio-focus-fallback');}
    updateFocus(); root.focus({preventScroll:true});
  });
  document.addEventListener('fullscreenchange',updateFocus);
  document.addEventListener('keydown',event=>{
    if(!focused())return;
    if(event.key==='Escape'){event.preventDefault();exitFocus();}
    if(event.key==='Tab' && root.classList.contains('studio-focus-fallback')){
      const elements=[...root.querySelectorAll('button,input,select,a,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(event.shiftKey && (document.activeElement===first||document.activeElement===root)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && (document.activeElement===last||document.activeElement===root)){event.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('pagehide',()=>{piano.releaseAll();if(rhythm.isPlaying)rhythm.stopGame();});
  document.dispatchEvent(new CustomEvent('piano:ready'));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initialize().catch(showError),{once:true});
else initialize().catch(showError);
