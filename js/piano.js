import PianoAudio from './piano-audio.js';
import { PracticeMode } from './practice-mode.js';
import { PianoRecorder } from './recorder.js';

console.log('piano.js loaded');

class Piano {
    constructor() {
        console.log('Piano constructor called');
        this.audio = new PianoAudio();
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
        
        // 等待 DOM 加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.generateKeyboard();
                this.initializeKeyboard();
                this.setupEventListeners();
            });
        } else {
            this.generateKeyboard();
            this.initializeKeyboard();
            this.setupEventListeners();
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

        const notes = [
            { note: 'C3', type: 'white' },
            { note: 'C#3', type: 'black' },
            { note: 'D3', type: 'white' },
            { note: 'D#3', type: 'black' },
            { note: 'E3', type: 'white' },
            { note: 'F3', type: 'white' },
            { note: 'F#3', type: 'black' },
            { note: 'G3', type: 'white' },
            { note: 'G#3', type: 'black' },
            { note: 'A3', type: 'white' },
            { note: 'A#3', type: 'black' },
            { note: 'B3', type: 'white' },
            { note: 'C4', type: 'white' },
            { note: 'C#4', type: 'black' },
            { note: 'D4', type: 'white' },
            { note: 'D#4', type: 'black' },
            { note: 'E4', type: 'white' },
            { note: 'F4', type: 'white' },
            { note: 'F#4', type: 'black' },
            { note: 'G4', type: 'white' },
            { note: 'G#4', type: 'black' },
            { note: 'A4', type: 'white' },
            { note: 'A#4', type: 'black' },
            { note: 'B4', type: 'white' },
            { note: 'C5', type: 'white' },
            { note: 'C#5', type: 'black' },
            { note: 'D5', type: 'white' },
            { note: 'D#5', type: 'black' },
            { note: 'E5', type: 'white' },
            { note: 'F5', type: 'white' },
            { note: 'F#5', type: 'black' },
            { note: 'G5', type: 'white' },
            { note: 'G#5', type: 'black' },
            { note: 'A5', type: 'white' },
            { note: 'A#5', type: 'black' },
            { note: 'B5', type: 'white' },
            { note: 'C6', type: 'white' }
        ];

        notes.forEach(({ note, type }) => {
            const key = document.createElement('div');
            key.className = `key ${type}`;
            key.dataset.note = note;

            // Add solfege name
            const noteName = note.charAt(0);
            const solfege = solfegeMap[noteName];
            if (solfege) {
                key.dataset.solfege = solfege;
            }
            // 更纯净的外观暂不显示键盘映射标签

            keysContainer.appendChild(key);
        });
    }

    initializeKeyboard() {
        console.log('Initializing keyboard');
        // 获取所有钢琴键
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            const note = key.dataset.note;
            this.keys[note] = key;
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key);
            if (e.repeat) return; // 忽略按键重复
            const note = this.getNoteFromKeyCode(e.key.toLowerCase());
            if (note) {
                console.log('Playing note:', note);
                this.pressKey(note);
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

        // 鼠标事件监听
        Object.values(this.keys).forEach(key => {
            key.addEventListener('mousedown', () => {
                const note = key.dataset.note;
                this.pressKey(note);
            });

            key.addEventListener('mouseup', () => {
                const note = key.dataset.note;
                this.releaseKey(note);
            });

            key.addEventListener('mouseleave', () => {
                const note = key.dataset.note;
                this.releaseKey(note);
            });
        });
    }

    getNoteFromKeyCode(key) {
        return this.keyMap[key];
    }

    pressKey(note) {
        console.log('Pressing key:', note);
        if (this.keys[note]) {
            this.keys[note].classList.add('active');
        }
        this.audio.playNote(note);
        
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
