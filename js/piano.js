import PianoAudio from './piano-audio.js';
import { PracticeMode } from './practice-mode.js';
import { PianoRecorder } from './recorder.js';
import { createPracticeEntryController } from './practice-entry.mjs';
import { keyboardNotes, mobileRangeForNote, keyboardMapForRange, fullKeyboardNotes, keyboardMapForFullRange, fullRangeForNote } from './keyboard-range.mjs';
import { pianoText } from './i18n.js';

console.log('piano.js loaded');

class Piano {
    constructor() {
        console.log('Piano constructor called');
        this.audio = new PianoAudio();
        this.audio.scheduleWarmup();
        this.mobileViewport = window.matchMedia('(max-width: 640px)');
        this.startOctave = 3;
        this.octaves = this.mobileViewport.matches ? 2 : 3;
        this.keyboardMode = 'compact';
        try {
            if (document.querySelector('[data-studio]') && localStorage.getItem('piano-keyboard-mode') === 'full') this.keyboardMode = 'full';
        } catch { /* Playing also works when storage is unavailable. */ }
        this.keys = {};
        this.sustainPedal = false;
        this.isRecording = false;
        this.recordedNotes = [];
        this.onNotePlay = null;
        this.keyMap = {
            'a': 'C3',
            's': 'D3',
            'd': 'E3',
            'f': 'F3',
            'g': 'G3',
            'h': 'A3',
            'j': 'B3',
            'k': 'C4',
            'l': 'D4',
            ';': 'E4',
            'q': 'F4',
            'w': 'G4',
            'e': 'A4',
            'r': 'B4',
            't': 'C5',
            'y': 'D5',
            'u': 'E5',
            'i': 'F5',
            'o': 'G5',
            'p': 'A5',
            '1': 'C#3',
            '2': 'D#3',
            '3': 'F#3',
            '4': 'G#3',
            '5': 'A#3',
            '6': 'C#4',
            '7': 'D#4',
            '8': 'F#4',
            '9': 'G#4',
            '0': 'A#4',
            'z': 'A#4',
            'x': 'C#5',
            'c': 'D#5',
            'v': 'F#5',
            'b': 'G#5',
            'n': 'A#5',
            'm': 'B5',
            ',': 'C6'
        };
        this.baseKeyMap = { ...this.keyMap };
        
        // 等待 DOM 加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.generateKeyboard();
                this.initializeKeyboard();
                this.setupEventListeners();
                this.setupRangeControls();
            });
        } else {
            this.generateKeyboard();
            this.initializeKeyboard();
            this.setupEventListeners();
            this.setupRangeControls();
        }
    }

    generateKeyboard() {
        console.log('Generating keyboard');
        const keysContainer = document.querySelector('.keys');
        if (!keysContainer) {
            console.error('Keys container not found');
            return;
        }

        const solfegeMap = {
            'C': 'do',
            'D': 're',
            'E': 'mi',
            'F': 'fa',
            'G': 'so',
            'A': 'la',
            'B': 'si'
        };

        keysContainer.replaceChildren();
        const notes = this.keyboardMode === 'full' ? fullKeyboardNotes() : keyboardNotes(this.startOctave, this.octaves);
        const whiteCount = notes.filter(key => key.type === 'white').length;
        keysContainer.style.setProperty('--white-count', whiteCount);
        keysContainer.closest('.piano-container')?.style.setProperty('--white-count', whiteCount);
        const instrument = keysContainer.closest('[data-studio]');
        if (instrument) instrument.dataset.keyboardSize = this.keyboardMode;
        let whites = 0;

        notes.forEach(({ note, type }) => {
            const key = document.createElement('div');
            key.className = `key ${type}`;
            key.dataset.note = note;
            if (type === 'white') whites += 1;
            else key.style.setProperty('--key-left', `${whites / whiteCount * 100}%`);

            // Add solfege name
            const noteName = note.charAt(0);
            const solfege = solfegeMap[noteName];
            if (solfege) {
                key.dataset.solfege = solfege;
            }
            
            keysContainer.appendChild(key);
        });
        this.updateKeyLabels();
    }

    updateKeyLabels() {
        this.keyMap = this.keyboardMode === 'full'
            ? keyboardMapForFullRange(this.baseKeyMap, this.startOctave)
            : keyboardMapForRange(this.baseKeyMap, this.startOctave, this.mobileViewport.matches);
        const reverse = Object.entries(this.keyMap).reduce((map, [key, note]) => {
            map[note] = key.toUpperCase();
            return map;
        }, {});
        // Remapping computer keys must not replace held pointer/MIDI key nodes.
        document.querySelectorAll('.keys .key').forEach(key => {
            const letter = reverse[key.dataset.note];
            let label = key.querySelector('.key-label');
            if (letter && !label) {
                label = document.createElement('div');
                label.className = 'key-label';
                key.append(label);
            }
            if (letter) label.textContent = letter;
            else label?.remove();
            key.setAttribute('aria-label', `${key.dataset.note}${letter ? ` · ${letter}` : ''}`);
        });
    }

    initializeKeyboard() {
        console.log('Initializing keyboard');
        // 获取所有钢琴键
        this.keys = {};
        const keys = document.querySelectorAll('.keys .key');
        keys.forEach(key => {
            const note = key.dataset.note;
            this.keys[note] = key;
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            const inputStartedAt = performance.now();
            console.log('Key pressed:', e.key);
            if (e.repeat) return; // 忽略按键重复
            const note = this.getNoteFromKeyCode(e.key.toLowerCase());
            if (note) {
                console.log('Playing note:', note);
                this.pressKey(note, inputStartedAt);
            }
            // 处理延音踏板
            if (e.code === 'Space') {
                e.preventDefault(); // 防止页面滚动
                this.sustainPedal = true;
                const sustainControl = document.querySelector('.sustain-control input');
                if (sustainControl) {
                    sustainControl.checked = true;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            console.log('Key released:', e.key);
            const note = this.getNoteFromKeyCode(e.key.toLowerCase());
            if (note) {
                console.log('Releasing note:', note);
                this.releaseKey(note);
            }
            // 处理延音踏板
            if (e.code === 'Space') {
                e.preventDefault(); // 防止页面滚动
                this.sustainPedal = false;
                const sustainControl = document.querySelector('.sustain-control input');
                if (sustainControl) {
                    sustainControl.checked = false;
                }
            }
        });

        this.bindKeyPointers();

        // 默认显示按键提示
        const keysContainer = document.querySelector('.keys');
        const labelsToggle = document.getElementById('labels-toggle');
        if (keysContainer) {
            keysContainer.classList.add('show-labels'); // 默认显示
        }
        if (labelsToggle) {
            labelsToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    keysContainer.classList.add('show-labels');
                } else {
                    keysContainer.classList.remove('show-labels');
                }
            });
        }

        // 全屏逻辑
        const fullscreenBtn = document.getElementById('toggle-fullscreen');
        const heroStartBtn = document.getElementById('hero-start-fullscreen');
        const practiceSection = document.querySelector('.practice-section');
        if (fullscreenBtn && practiceSection) {
            const practiceEntry = createPracticeEntryController({
                documentRef: document,
                practiceSection
            });

            const enterPracticeFullscreen = async () => {
                const result = await practiceEntry.enter();
                if (result.mode === 'scroll-fallback' && result.error) {
                    console.error('全屏请求被拒绝:', result.error);
                }
            };

            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    enterPracticeFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });

            if (heroStartBtn) {
                heroStartBtn.addEventListener('click', () => {
                    practiceEntry.focusTarget();
                });
            }

            document.addEventListener('fullscreenchange', () => {
                if (document.fullscreenElement) {
                    practiceSection.classList.add('fullscreen');
                    fullscreenBtn.innerHTML = '⛶ 退出全屏';
                } else {
                    practiceSection.classList.remove('fullscreen');
                    fullscreenBtn.innerHTML = '⛶ 全屏模式';
                }
            });
        }

        // MIDI 初始化
        this.setupMIDI();
    }

    setupRangeControls() {
        const container = document.querySelector('.keys');
        this.keyboardViewport = document.getElementById('keyboard-viewport');
        if (!this.keyboardViewport) {
            const viewport = document.createElement('div');
            viewport.className = 'piano-keyboard-viewport';
            container.before(viewport);
            viewport.append(container);
            this.keyboardViewport = viewport;
        }
        this.rangeControls = document.querySelector('.studio-range');
        if (!this.rangeControls) {
            const controls = document.createElement('div');
            controls.className = 'piano-range';
            controls.innerHTML = '<button type="button" data-octave="-1" aria-label="Lower octave">◀</button><span data-piano-range aria-live="polite"></span><button type="button" data-octave="1" aria-label="Higher octave">▶</button>';
            this.keyboardViewport.after(controls);
            this.rangeControls = controls;
        }
        // Reuse the existing studio markup without changing generated song pages.
        this.rangeLabel = this.rangeControls.querySelector('[data-piano-range]') || this.rangeControls.querySelector(':scope > span');
        this.rangeLabel.setAttribute('aria-live', 'polite');
        this.rangeControls.querySelectorAll('[data-octave]').forEach(button => {
            button.addEventListener('click', () => {
                const direction = Number(button.dataset.octave);
                if (this.keyboardMode === 'compact' && this.mobileViewport.matches) this.setRange(this.startOctave + direction);
                else this.keyboardViewport.scrollBy({ left: direction * Math.min(this.keyboardViewport.clientWidth * .85, 322), behavior: 'instant' });
            });
        });
        document.querySelectorAll('button[data-keyboard-mode]').forEach(button => {
            button.addEventListener('click', () => this.setKeyboardMode(button.dataset.keyboardMode));
        });
        this.keyboardOctaveControl = document.getElementById('keyboard-octave');
        this.keyboardOctaveControl?.addEventListener('change', () => {
            this.setKeyboardOctave(Number(this.keyboardOctaveControl.value));
            document.querySelector('[data-studio]')?.focus({ preventScroll: true });
        });
        this.keyboardPosition = document.getElementById('keyboard-position');
        this.keyboardPosition?.addEventListener('input', () => {
            const max = this.keyboardViewport.scrollWidth - this.keyboardViewport.clientWidth;
            this.keyboardViewport.scrollTo({ left: Number(this.keyboardPosition.value) / 1000 * max, behavior: 'instant' });
        });
        this.keyboardViewport.addEventListener('scroll', () => this.updateScrollControls(), { passive: true });
        if (typeof ResizeObserver !== 'undefined') {
            this.keyboardResizeObserver = new ResizeObserver(() => this.updateScrollControls());
            this.keyboardResizeObserver.observe(this.keyboardViewport);
        }
        this.mobileViewport.addEventListener('change', () => {
            this.octaves = this.mobileViewport.matches ? 2 : 3;
            // The full piano keeps its nodes and held voices when the phone rotates.
            if (this.keyboardMode === 'full') this.updateRangeLabel();
            else this.setRange(3, true);
        });
        this.updateRangeLabel();
    }

    updateRangeLabel() {
        const full = this.keyboardMode === 'full';
        const range = full ? 'A0–C8' : `C${this.startOctave}–C${this.startOctave + this.octaves}`;
        const count = full ? 88 : this.octaves * 12 + 1;
        if (this.rangeLabel) {
            const language = document.documentElement.lang.toLowerCase();
            const traditional = language === 'zh-hant';
            this.rangeLabel.textContent = `${count} ${traditional ? '鍵' : pianoText('键', 'keys')} · ${range}`;
            const hint = document.createElement('span');
            hint.className = 'mobile-only';
            hint.textContent = ` · ${traditional ? '用兩側箭頭切換音區' : pianoText('用两侧箭头切换音区', 'Use arrows to change range')}`;
            this.rangeLabel.append(hint);
        }
        document.querySelector('.keys')?.setAttribute('aria-label', range);
        document.querySelectorAll('button[data-keyboard-mode]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.keyboardMode === this.keyboardMode));
        });
        document.querySelectorAll('[data-keyboard-navigation], [data-keyboard-mapping-control]').forEach(control => { control.hidden = !full; });
        if (this.keyboardOctaveControl) this.keyboardOctaveControl.value = String(this.startOctave);
        this.updateScrollControls();
    }

    updateScrollControls() {
        if (!this.keyboardViewport) return;
        const { scrollLeft, scrollWidth, clientWidth } = this.keyboardViewport;
        const max = Math.max(0, scrollWidth - clientWidth);
        if (this.keyboardPosition) {
            this.keyboardPosition.value = max ? String(Math.round(scrollLeft / max * 1000)) : '0';
            this.keyboardPosition.disabled = max === 0;
            const whites = document.querySelectorAll('.keys .key.white');
            const width = whites[0]?.getBoundingClientRect().width;
            if (width) {
                const first = whites[Math.max(0, Math.min(whites.length - 1, Math.floor(scrollLeft / width)))];
                const last = whites[Math.max(0, Math.min(whites.length - 1, Math.ceil((scrollLeft + clientWidth) / width) - 1))];
                this.keyboardPosition.setAttribute('aria-valuetext', `${first.dataset.note}–${last.dataset.note}`);
            }
        }
        this.rangeControls?.querySelectorAll('[data-octave]').forEach(button => {
            const lower = Number(button.dataset.octave) < 0;
            button.disabled = this.keyboardMode === 'compact' && this.mobileViewport.matches
                ? (lower ? this.startOctave === 1 : this.startOctave === 5)
                : (lower ? scrollLeft <= 1 : scrollLeft >= max - 1);
        });
    }

    setKeyboardMode(mode, { persist = true } = {}) {
        if (!['compact', 'full'].includes(mode) || mode === this.keyboardMode) return;
        const current = document.querySelector('.keys .key.current')?.dataset.note;
        if (this.releaseAll) this.releaseAll();
        else this.audio.stopAll();
        this.keyboardMode = mode;
        this.startOctave = 3;
        this.octaves = this.mobileViewport.matches ? 2 : 3;
        try { if (persist) localStorage.setItem('piano-keyboard-mode', mode); } catch {}
        this.generateKeyboard();
        this.initializeKeyboard();
        if (!this.releaseAll) this.bindKeyPointers();
        this.updateRangeLabel();
        const target = this.ensureNoteVisible(current || 'C4');
        if (current) target?.classList.add('current');
        document.dispatchEvent(new CustomEvent('piano:keyboard-change'));
    }

    setKeyboardOctave(startOctave, { automatic = false } = {}) {
        if (this.keyboardMode !== 'full' || !Number.isFinite(startOctave)) return;
        const next = Math.max(0, Math.min(5, Math.trunc(startOctave)));
        if (next === this.startOctave) return;
        this.startOctave = next;
        this.updateKeyLabels();
        this.updateRangeLabel();
        if (!automatic) {
            this.ensureNoteVisible(next === 0 ? 'A0' : next === 5 ? 'C8' : `C${next + 1}`, { remap: false });
            document.dispatchEvent(new CustomEvent('piano:keyboard-change'));
        }
    }

    setRange(startOctave, force = false, automatic = false) {
        if (this.keyboardMode === 'full') {
            this.setKeyboardOctave(startOctave, { automatic });
            return;
        }
        const next = this.mobileViewport.matches ? Math.max(1, Math.min(5, startOctave)) : 3;
        if (!force && next === this.startOctave) return;
        const current = document.querySelector('.keys .key.current')?.dataset.note;
        if (this.releaseAll) this.releaseAll({ cancelPending: !automatic });
        else if (automatic) [...this.audio.pressedNotes].forEach(note => this.releaseKey(note));
        else this.audio.stopAll();
        this.startOctave = next;
        this.generateKeyboard();
        this.initializeKeyboard();
        if (!this.releaseAll) this.bindKeyPointers();
        this.updateRangeLabel();
        this.keyboardViewport.scrollTo({ left: 0, behavior: 'instant' });
        // A manual range change also keeps an active teaching target visible.
        if (current) this.ensureNoteVisible(current)?.classList.add('current');
        if (!automatic) document.dispatchEvent(new CustomEvent('piano:keyboard-change'));
    }

    ensureNoteVisible(note, { remap = true } = {}) {
        // Practice emits a final progress event at notes.length before stopping.
        if (!note) return;
        if (this.keyboardMode === 'full' && remap) {
            this.setKeyboardOctave(fullRangeForNote(note, this.startOctave), { automatic: true });
        } else if (this.keyboardMode === 'compact' && this.mobileViewport.matches && !this.keys[note]) {
            this.setRange(mobileRangeForNote(note, this.startOctave), false, true);
        }
        const key = this.keys[note];
        const viewport = this.keyboardViewport;
        if (key && viewport) {
            const bounds = key.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
            if (bounds.left < frame.left || bounds.right > frame.right) {
                viewport.scrollTo({ left: viewport.scrollLeft + bounds.left - frame.left - (viewport.clientWidth - bounds.width) / 2, behavior: 'instant' });
            }
        }
        this.updateScrollControls();
        return key;
    }

    bindKeyPointers() {
        Object.values(this.keys).forEach(key => {
            key.addEventListener('pointerdown', event => {
                const inputStartedAt = performance.now();
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                key.setPointerCapture?.(event.pointerId);
                this.pressKey(key.dataset.note, inputStartedAt);
            });
            const release = () => this.releaseKey(key.dataset.note);
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => key.addEventListener(type, release));
        });
    }

    setupMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (midiAccess) => {
                    console.log('MIDI ready!');
                    const midiStatus = document.getElementById('midi-status');
                    const statusText = midiStatus?.querySelector('.status-text');
                    
                    const updateStatus = () => {
                        let hasDevice = false;
                        for (let input of midiAccess.inputs.values()) {
                            hasDevice = true;
                            input.onmidimessage = (message) => this.handleMIDIMessage(message);
                        }
                        if (midiStatus && statusText) {
                            if (hasDevice) {
                                midiStatus.classList.add('online');
                                midiStatus.classList.remove('offline');
                                statusText.textContent = 'MIDI 已连接';
                            } else {
                                midiStatus.classList.remove('online');
                                midiStatus.classList.add('offline');
                                statusText.textContent = '未检测到 MIDI';
                            }
                        }
                    };

                    midiAccess.onstatechange = (e) => {
                        console.log('MIDI state change:', e.port.name, e.port.state);
                        updateStatus();
                    };
                    updateStatus();
                },
                (err) => {
                    console.error('MIDI access failed:', err);
                }
            );
        }
    }

    handleMIDIMessage(message) {
        const command = message.data[0] >> 4;
        const note = message.data[1];
        const velocity = message.data.length > 2 ? message.data[2] : 0;
        
        // Note: MIDI note 60 is C4 (middle C)
        const midiToNoteName = (midiNote) => {
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(midiNote / 12) - 1;
            const noteName = noteNames[midiNote % 12];
            return `${noteName}${octave}`;
        };

        const noteStr = midiToNoteName(note);

        if (command === 9 && velocity > 0) { // Note on
            if (this.keyboardMode === 'full') this.ensureNoteVisible(noteStr, { remap: false });
            this.pressKey(noteStr, performance.now(), velocity / 127);
        } else if (command === 8 || (command === 9 && velocity === 0)) { // Note off
            this.releaseKey(noteStr);
        } else if (command === 11) { // Control change (e.g. sustain pedal)
            if (message.data[1] === 64) { // Sustain pedal
                this.sustainPedal = velocity >= 64;
                const sustainControl = document.querySelector('.sustain-control input');
                if (sustainControl) {
                    sustainControl.checked = this.sustainPedal;
                }
            }
        }
    }

    getNoteFromKeyCode(key) {
        return this.keyMap[key];
    }

    pressKey(note, inputStartedAt = performance.now(), velocity = 0.9) {
        console.log('Pressing key:', note);
        if (this.keys[note]) {
            this.keys[note].classList.add('active');
        }
        this.audio.playNote(note, velocity, inputStartedAt).catch(error => console.error('Piano audio:', error));
        
        // 触发音符播放回调
        if (this.onNotePlay) {
            this.onNotePlay(note);
        }

        if (this.isRecording) {
            this.recordedNotes.push({
                note: note,
                time: Date.now()
            });
        }
    }

    releaseKey(note) {
        console.log('Releasing key:', note);
        if (this.keys[note]) {
            this.keys[note].classList.remove('active');
        }
        if (!this.sustainPedal) {
            this.audio.stopNote(note);
        }
    }

    toggleRecording() {
        this.isRecording = !this.isRecording;
        if (this.isRecording) {
            this.recordedNotes = [];
        }
        return this.isRecording;
    }

    getRecordedNotes() {
        return this.recordedNotes;
    }

    updateNoteHints(notes) {
        this.currentNotes = notes;
        this.currentNoteIndex = 0;
        this.showCurrentBatch();
    }

    showCurrentBatch() {
        const practiceNotesContainer = document.getElementById('practice-notes');
        if (!practiceNotesContainer) return;

        // 清空现有内容
        practiceNotesContainer.innerHTML = '';

        // 创建提示容器
        const hintContainer = document.createElement('div');
        hintContainer.className = 'hint-notes';

        // 计算当前批次要显示的音符
        const endIndex = Math.min(this.currentNoteIndex + this.displayBatchSize, this.currentNotes.length);
        const currentBatch = this.currentNotes.slice(this.currentNoteIndex, endIndex);

        // 显示当前批次的音符
        currentBatch.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'hint-note';
            noteElement.textContent = note;

            const keyElement = document.createElement('div');
            keyElement.className = 'hint-key';
            const keyboardKey = this.getKeyboardKeyForNote(note);
            keyElement.textContent = keyboardKey.toUpperCase();

            hintContainer.appendChild(noteElement);
            hintContainer.appendChild(keyElement);
        });

        // 添加进度显示
        const progressElement = document.createElement('div');
        progressElement.className = 'hint-progress';
        progressElement.textContent = `进度: ${this.currentNoteIndex}/${this.currentNotes.length}`;
        hintContainer.appendChild(progressElement);

        practiceNotesContainer.appendChild(hintContainer);
    }

    moveToNextBatch() {
        if (this.currentNoteIndex + this.displayBatchSize < this.currentNotes.length) {
            this.currentNoteIndex += this.displayBatchSize;
            this.showCurrentBatch();
            return true;
        }
        return false;
    }

    checkCurrentNote(playedNote) {
        const currentBatchEnd = Math.min(this.currentNoteIndex + this.displayBatchSize, this.currentNotes.length);
        const currentBatch = this.currentNotes.slice(this.currentNoteIndex, currentBatchEnd);
        
        if (currentBatch.includes(playedNote)) {
            // 如果当前批次的所有音符都已经弹完，移动到下一批
            const remainingNotes = currentBatch.filter(note => note !== playedNote);
            if (remainingNotes.length === 0) {
                this.moveToNextBatch();
            }
            return true;
        }
        return false;
    }

    getKeyboardKeyForNote(note) {
        const keyMap = {
            'C4': 'A',
            'C#4': 'W',
            'D4': 'S',
            'D#4': 'E',
            'E4': 'D',
            'F4': 'F',
            'F#4': 'T',
            'G4': 'G',
            'G#4': 'Y',
            'A4': 'H',
            'A#4': 'U',
            'B4': 'J',
            'C5': 'K',
            'C#5': 'O',
            'D5': 'L',
            'D#5': 'P',
            'E5': ';',
            'F5': "'",
            'G5': '[',
            'G3': 'Z',
            'C3': 'Q',
            'C#3': '2',
            'D3': 'W',
            'D#3': '3',
            'E3': 'E',
            'F3': 'R',
            'F#3': '5',
            'A3': 'A',
            'A#3': '6',
            'B3': 'T',
            'C6': 'M',
            'C#6': ',',
            'D6': '.',
            'D#6': '/',
            'E6': 'N',
            'F6': 'B',
            'F#6': 'V',
            'G6': 'C',
            'G#6': 'X',
            'A6': 'Z',
            'A#6': '1',
            'B6': 'S',
        };
        return keyMap[note] || '';
    }

    updateKeyHint() {}
    startNewSong() {}
    handleCorrectKey() {}
}

function clearNoteHints() {
    const practiceNotesContainer = document.getElementById('practice-notes');
    if (practiceNotesContainer) {
        practiceNotesContainer.innerHTML = '<div class="note-hint">选择曲目开始练习</div>';
    }
}

export { Piano };
