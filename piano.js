// 钢琴键映射
const pianoKeys = {
    // 第一组八度
    'z': 48, // C3
    's': 49, // C#3
    'x': 50, // D3
    'd': 51, // D#3
    'c': 52, // E3
    'v': 53, // F3
    'g': 54, // F#3
    'b': 55, // G3
    'h': 56, // G#3
    'n': 57, // A3
    'j': 58, // A#3
    'm': 59, // B3

    // 中央C所在的八度
    'a': 60, // C4 (中央C)
    'w': 61, // C#4
    'e': 62, // D4
    'r': 63, // D#4
    't': 64, // E4
    'y': 65, // F4
    'u': 66, // F#4
    'i': 67, // G4
    'o': 68, // G#4
    'p': 69, // A4
    '[': 70, // A#4
    ']': 71, // B4
    '\\': 72, // C5

    // 数字键映射（保持原有的映射）
    '1': 60, // C4 (中央C)
    '2': 62, // D4
    '3': 64, // E4
    '4': 65, // F4
    '5': 67, // G4
    '6': 69, // A4
    '7': 71, // B4
    '8': 72, // C5
};

// 音符与频率的对应关系
const midiToFrequency = note => 440 * Math.pow(2, (note - 69) / 12);

class Piano {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.activeOscillators = {};
        this.practiceMode = null;
        this.setupEventListeners();
    }

    createOscillator(frequency) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime + 0.1, 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }

    playNote(note) {
        if (this.activeOscillators[note]) return;

        const frequency = midiToFrequency(note);
        const { oscillator, gainNode } = this.createOscillator(frequency);
        
        oscillator.start();
        this.activeOscillators[note] = { oscillator, gainNode };

        // 更新视觉反馈
        this.updateKeyVisual(note, true);
    }

    stopNote(note) {
        if (!this.activeOscillators[note]) return;

        const { gainNode } = this.activeOscillators[note];
        gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);

        setTimeout(() => {
            if (this.activeOscillators[note]) {
                this.activeOscillators[note].oscillator.stop();
                delete this.activeOscillators[note];
            }
        }, 100);

        // 更新视觉反馈
        this.updateKeyVisual(note, false);
    }

    updateKeyVisual(note, isPressed) {
        // 找到对应的钢琴键DOM元素
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            if (isPressed) {
                keyElement.classList.add('active');
            } else {
                keyElement.classList.remove('active');
            }
        }
    }

    setPracticeMode(practiceMode) {
        this.practiceMode = practiceMode;
    }

    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (event) => {
            if (event.repeat) return;
            const note = pianoKeys[event.key.toLowerCase()];
            if (note) {
                this.playNote(note);
                // 检查练习模式
                if (this.practiceMode) {
                    this.practiceMode.checkNote(note);
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            const note = pianoKeys[event.key.toLowerCase()];
            if (note) {
                this.stopNote(note);
            }
        });

        // 鼠标点击事件
        document.querySelectorAll('.piano-key').forEach(key => {
            key.addEventListener('mousedown', () => {
                const note = parseInt(key.dataset.note);
                this.playNote(note);
                // 检查练习模式
                if (this.practiceMode) {
                    this.practiceMode.checkNote(note);
                }
            });

            key.addEventListener('mouseup', () => {
                const note = parseInt(key.dataset.note);
                this.stopNote(note);
            });

            key.addEventListener('mouseleave', () => {
                const note = parseInt(key.dataset.note);
                this.stopNote(note);
            });
        });
    }
}

// 练习模式类
class PracticeModeManager {
    constructor(piano) {
        this.piano = piano;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        this.isPlaying = false;

        // 延迟初始化DOM元素，确保它们存在
        this.initializeDOM();
    }

    initializeDOM() {
        // 获取DOM元素
        this.noteDisplay = document.getElementById('noteDisplay');
        this.songSelect = document.getElementById('songSelect');
        this.startButton = document.getElementById('startPractice');

        if (!this.noteDisplay || !this.songSelect || !this.startButton) {
            console.error('Practice mode elements not found, retrying in 100ms...');
            setTimeout(() => this.initializeDOM(), 100);
            return;
        }

        console.log('Practice mode elements found, initializing events');
        
        // 绑定事件
        this.startButton.addEventListener('click', () => this.togglePractice());
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }

    togglePractice() {
        if (this.isPlaying) {
            this.stopPractice();
        } else {
            this.startPractice();
        }
    }

    startPractice() {
        const selectedSong = this.songSelect.value;
        if (!selectedSong || !songs[selectedSong]) {
            alert('请选择一首歌曲');
            return;
        }

        this.currentSong = songs[selectedSong];
        this.currentNoteIndex = 0;
        this.isPlaying = true;
        this.startButton.textContent = '停止练习';
        this.displayCurrentNote();

        // 开始提示播放
        this.startHintInterval();
    }

    stopPractice() {
        this.isPlaying = false;
        this.startButton.textContent = '开始练习';
        this.noteDisplay.textContent = '';
        if (this.hintInterval) {
            clearInterval(this.hintInterval);
        }
    }

    displayCurrentNote() {
        if (!this.isPlaying || !this.currentSong || this.currentNoteIndex >= this.currentSong.notes.length) {
            return;
        }

        const currentNote = this.currentSong.notes[this.currentNoteIndex];
        this.noteDisplay.innerHTML = `
            <div class="text-2xl">
                请按: ${currentNote.key}
                ${currentNote.duration > 1 ? `<span class="text-red-500">(按 ${currentNote.duration} 次)</span>` : ''}
            </div>
        `;

        // 高亮显示对应的琴键
        this.highlightKey(currentNote.midi);
    }

    highlightKey(midiNote) {
        // 移除所有键的高亮
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('key-hint');
        });

        // 添加当前键的高亮
        const key = document.querySelector(`.piano-key[data-note="${midiNote}"]`);
        if (key) {
            key.classList.add('key-hint');
        }
    }

    startHintInterval() {
        if (this.hintInterval) {
            clearInterval(this.hintInterval);
        }
        this.hintInterval = setInterval(() => {
            if (this.isPlaying && this.currentSong) {
                const currentNote = this.currentSong.notes[this.currentNoteIndex];
                if (currentNote) {
                    this.piano.playNote(currentNote.midi);
                }
            }
        }, 5000);
    }

    handleKeyPress(event) {
        if (!this.isPlaying || !this.currentSong) {
            return;
        }

        const pressedKey = event.key.toLowerCase();
        const currentNote = this.currentSong.notes[this.currentNoteIndex];
        
        if (!currentNote) {
            return;
        }

        // 检查按键是否匹配当前音符
        const noteKey = currentNote.key.match(/\(按(.+)键\)/)[1].toLowerCase();
        if (pressedKey === noteKey) {
            // 播放音符
            this.piano.playNote(currentNote.midi);

            // 更新剩余次数或移动到下一个音符
            if (currentNote.duration > 1) {
                currentNote.duration--;
                this.displayCurrentNote();
            } else {
                this.currentNoteIndex++;
                if (this.currentNoteIndex >= this.currentSong.notes.length) {
                    alert('恭喜你完成演奏！');
                    this.stopPractice();
                } else {
                    this.displayCurrentNote();
                }
            }
        }
    }

    checkNote(note) {
        if (!this.isPlaying || this.currentGroupNotes.length === 0) return;

        // 检查按键间隔
        const currentTime = Date.now();
        if (currentTime - this.lastKeyPressTime < this.keyPressInterval) {
            return; // 如果按键间隔太短，忽略这次按键
        }
        this.lastKeyPressTime = currentTime;

        // 检查是否是当前组中的音符，且还需要按这个音符
        if (this.remainingNotes.has(note) && this.remainingNotes.get(note) > 0) {
            // 减少这个音符需要按的次数
            this.remainingNotes.set(note, this.remainingNotes.get(note) - 1);
            this.renderNotes();

            // 检查是否所有音符都已经按对了正确的次数
            let allCorrect = true;
            for (let [_, remaining] of this.remainingNotes) {
                if (remaining > 0) {
                    allCorrect = false;
                    break;
                }
            }

            if (allCorrect) {
                // 清除当前的提示音定时器
                if (this.displayTimeout) {
                    clearInterval(this.displayTimeout);
                }
                
                // 延迟一下再加载下一组，让用户看到所有音符都变绿
                setTimeout(() => {
                    this.currentNoteIndex += this.groupSize;
                    if (this.currentNoteIndex >= this.currentSong.notes.length) {
                        this.songComplete();
                    } else {
                        this.loadNextGroup();
                    }
                }, 500);
            }
        }
    }

    songComplete() {
        this.isPlaying = false;
        if (this.displayTimeout) {
            clearInterval(this.displayTimeout);
        }
        this.renderNotes();
        // 显示完成消息
        setTimeout(() => {
            alert('恭喜！您已经完成了这首歌的练习！');
        }, 500);
    }

    start() {
        if (!this.currentSong) return;
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.correctNotes.clear();
        this.loadNextGroup();
        this.playCurrentNote();
    }

    stop() {
        this.isPlaying = false;
        if (this.displayTimeout) {
            clearInterval(this.displayTimeout);
        }
        if (this.nextNoteTimeout) {
            clearTimeout(this.nextNoteTimeout);
        }
        // 清除所有正在播放的音符
        Object.keys(this.piano.activeOscillators).forEach(note => {
            this.piano.stopNote(parseInt(note));
        });
    }
}

// 歌曲数据
const songs = {
    'twinkle': {
        name: '小星星',
        difficulty: '入门',
        notes: [
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4
            { midi: 60, key: '(按Z键)', duration: 1 },
            { midi: 67, key: '(按K键)', duration: 1 }, // G4
            { midi: 67, key: '(按K键)', duration: 1 },
            { midi: 69, key: '(按L键)', duration: 1 }, // A4
            { midi: 69, key: '(按L键)', duration: 1 },
            { midi: 67, key: '(按K键)', duration: 2 }, // G4
            { midi: 65, key: '(按J键)', duration: 1 }, // F4
            { midi: 65, key: '(按J键)', duration: 1 },
            { midi: 64, key: '(按H键)', duration: 1 }, // E4
            { midi: 64, key: '(按H键)', duration: 1 },
            { midi: 62, key: '(按G键)', duration: 1 }, // D4
            { midi: 62, key: '(按G键)', duration: 1 },
            { midi: 60, key: '(按Z键)', duration: 2 }  // C4
        ]
    },
    'canon': {
        name: '卡农',
        difficulty: '中级',
        notes: [
            { midi: 71, key: '(按J键)', duration: 1 }, // 高音1
            { midi: 69, key: '(按H键)', duration: 1 }, // 6
            { midi: 67, key: '(按G键)', duration: 1 }, // 5
            { midi: 66, key: '(按F键)', duration: 1 }, // #4
            { midi: 64, key: '(按D键)', duration: 1 }, // 3
            { midi: 62, key: '(按S键)', duration: 1 }, // 2
            { midi: 61, key: '(按A键)', duration: 1 }, // #1
            { midi: 59, key: '(按Z键)', duration: 1 }  // 低音7
        ]
    },
    'twoTigers': {
        name: '两只老虎',
        difficulty: '入门',
        notes: [
            // 两只老虎
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 两
            { midi: 62, key: '(按X键)', duration: 1 }, // D4 只
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 老
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 虎
            // 两只老虎
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 两
            { midi: 62, key: '(按X键)', duration: 1 }, // D4 只
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 老
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 虎
            // 跑得快
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 跑
            { midi: 65, key: '(按V键)', duration: 1 }, // F4 得
            { midi: 67, key: '(按B键)', duration: 2 }, // G4 快
            // 跑得快
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 跑
            { midi: 65, key: '(按V键)', duration: 1 }, // F4 得
            { midi: 67, key: '(按B键)', duration: 2 }, // G4 快
            // 一只没有眼睛
            { midi: 67, key: '(按B键)', duration: 0.5 }, // G4 一
            { midi: 69, key: '(按N键)', duration: 0.5 }, // A4 只
            { midi: 67, key: '(按B键)', duration: 0.5 }, // G4 没
            { midi: 65, key: '(按V键)', duration: 0.5 }, // F4 有
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 眼
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 睛
            // 一只没有尾巴
            { midi: 67, key: '(按B键)', duration: 0.5 }, // G4 一
            { midi: 69, key: '(按N键)', duration: 0.5 }, // A4 只
            { midi: 67, key: '(按B键)', duration: 0.5 }, // G4 没
            { midi: 65, key: '(按V键)', duration: 0.5 }, // F4 有
            { midi: 64, key: '(按C键)', duration: 1 }, // E4 尾
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 巴
            // 真奇怪
            { midi: 60, key: '(按Z键)', duration: 1 }, // C4 真
            { midi: 55, key: '(按Q键)', duration: 1 }, // G3 奇
            { midi: 60, key: '(按Z键)', duration: 2 }  // C4 怪
        ]
    }
};

// 全局变量
let audioContext = null;
let currentSong = null;
let currentNoteIndex = 0;
let pressedKeys = new Set(); // 追踪已按下的键

// 处理键盘按下事件
async function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (pianoKeys[key] && !pressedKeys.has(key)) {
        pressedKeys.add(key);
        const note = pianoKeys[key];
        const frequency = midiToFrequency(note);
        
        // 找到对应的钢琴键并添加视觉效果
        const keys = document.querySelectorAll('.piano-key');
        keys.forEach(key => {
            const keyNote = parseInt(key.dataset.midi);
            if (keyNote === note) {
                key.classList.add('key-pressed');
            }
        });
        
        await audioPlayer.playNote(frequency);
    }
}

// 处理键盘释放事件
function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (pianoKeys[key]) {
        pressedKeys.delete(key);
        
        // 移除视觉效果
        const keys = document.querySelectorAll('.piano-key');
        keys.forEach(key => {
            const keyNote = parseInt(key.dataset.midi);
            if (keyNote === pianoKeys[event.key.toLowerCase()]) {
                key.classList.remove('key-pressed');
            }
        });
    }
}

// 加载歌曲
function loadSong(songId) {
    const song = songs[songId];
    if (!song) return;

    // 更新当前歌曲信息
    document.getElementById('currentSongName').textContent = song.name;
    document.getElementById('currentSongDifficulty').textContent = song.difficulty;
    
    // 显示歌曲音符
    const notesHtml = song.notes.map((note, index) => {
        return `<span class="inline-block px-2 py-1 m-1 bg-gray-100 rounded">${note.key}</span>`;
    }).join('');
    document.getElementById('songNotes').innerHTML = notesHtml;

    // 重置当前音符索引
    currentNoteIndex = 0;
    currentSong = song;
}

// 检查按键是否正确
function checkKeyPress(keyCode) {
    if (!currentSong || currentNoteIndex >= currentSong.notes.length) return;

    const expectedNote = currentSong.notes[currentNoteIndex];
    const pressedNote = keyToNote[keyCode];

    if (pressedNote === expectedNote.midi) {
        // 按键正确
        const noteElements = document.getElementById('songNotes').children;
        if (noteElements[currentNoteIndex]) {
            noteElements[currentNoteIndex].classList.add('bg-green-200');
        }
        currentNoteIndex++;

        // 检查是否完成
        if (currentNoteIndex >= currentSong.notes.length) {
            setTimeout(() => {
                alert('恭喜你完成了这首歌！');
                // 重置
                loadSong(currentSong.id);
            }, 500);
        }
    }
}

// 简单的音频播放器
class SimpleAudioPlayer {
    constructor() {
        this.context = null;
        this.oscillator = null;
        this.gainNode = null;
    }

    async init() {
        try {
            console.log('Initializing audio context...');
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
            console.log('Audio context state:', this.context.state);
            
            if (this.context.state === 'suspended') {
                await this.context.resume();
                console.log('Audio context resumed');
            }
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    async playNote(frequency, duration = 1) {
        try {
            if (!this.context) {
                await this.init();
            }

            // 创建音频节点和效果器
            const masterGain = this.context.createGain();
            const compressor = this.context.createDynamicsCompressor();
            const highPassFilter = this.context.createBiquadFilter();
            const highShelf = this.context.createBiquadFilter();
            
            // 设置高通滤波器，去除低频噪音
            highPassFilter.type = 'highpass';
            highPassFilter.frequency.setValueAtTime(100, this.context.currentTime);
            highPassFilter.Q.setValueAtTime(0.7, this.context.currentTime);

            // 设置高频增强，使声音更明亮
            highShelf.type = 'highshelf';
            highShelf.frequency.setValueAtTime(2000, this.context.currentTime);
            highShelf.gain.setValueAtTime(6, this.context.currentTime);
            
            // 设置压缩器参数，增加瞬态响应
            compressor.threshold.setValueAtTime(-24, this.context.currentTime);
            compressor.knee.setValueAtTime(10, this.context.currentTime);
            compressor.ratio.setValueAtTime(8, this.context.currentTime);
            compressor.attack.setValueAtTime(0.002, this.context.currentTime);
            compressor.release.setValueAtTime(0.15, this.context.currentTime);
            
            // 使用更丰富的泛音组合来创建明亮的钢琴音色
            const harmonics = [
                { frequency: frequency, gain: 0.6, type: 'triangle' },     // 基频，降低一点以减少浑浊感
                { frequency: frequency * 2, gain: 0.4, type: 'triangle' }, // 第一泛音，增加三角波增加明亮度
                { frequency: frequency * 3, gain: 0.2, type: 'sine' },     // 第二泛音
                { frequency: frequency * 4, gain: 0.15, type: 'sine' },    // 第三泛音
                { frequency: frequency * 5, gain: 0.1, type: 'sine' },     // 第四泛音
                { frequency: frequency * 6, gain: 0.05, type: 'sine' },    // 第五泛音
                { frequency: frequency * 8, gain: 0.025, type: 'sine' }    // 第七泛音，增加高频泛音
            ];

            const oscillators = harmonics.map(harmonic => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                // 设置振荡器
                osc.type = harmonic.type;
                osc.frequency.setValueAtTime(harmonic.frequency, this.context.currentTime);
                
                // 创建更快的音量包络，增加瞬态响应
                gain.gain.setValueAtTime(0, this.context.currentTime);
                gain.gain.linearRampToValueAtTime(harmonic.gain, this.context.currentTime + 0.001); // 更快的起音
                gain.gain.exponentialRampToValueAtTime(harmonic.gain * 0.8, this.context.currentTime + 0.003);
                gain.gain.exponentialRampToValueAtTime(harmonic.gain * 0.4, this.context.currentTime + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
                
                // 连接音频节点
                osc.connect(gain);
                gain.connect(highPassFilter);
                
                return { oscillator: osc, gain: gain };
            });

            // 连接音频处理链
            highPassFilter.connect(highShelf);
            highShelf.connect(compressor);
            compressor.connect(masterGain);
            masterGain.connect(this.context.destination);
            
            // 设置主音量
            masterGain.gain.setValueAtTime(0.9, this.context.currentTime);

            // 启动所有振荡器
            oscillators.forEach(osc => {
                osc.oscillator.start();
                osc.oscillator.stop(this.context.currentTime + duration);
            });

            // 清理
            setTimeout(() => {
                oscillators.forEach(osc => {
                    osc.gain.disconnect();
                    osc.oscillator.disconnect();
                });
                masterGain.disconnect();
                compressor.disconnect();
                highPassFilter.disconnect();
                highShelf.disconnect();
            }, duration * 1000);

        } catch (error) {
            console.error('Error playing note:', error);
        }
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
    }
}

// 创建音频播放器实例
const audioPlayer = new SimpleAudioPlayer();

// 生成钢琴键
function generatePianoKeys() {
    console.log('Starting generatePianoKeys function');
    const pianoContainer = document.getElementById('piano');
    
    if (!pianoContainer) {
        console.error('Piano container still not found after initialization!');
        return;
    }

    console.log('Clearing existing piano keys');
    pianoContainer.innerHTML = '';

    // 定义音符和键盘映射
    const octaveNotes = [
        { note: 'C', type: 'white' },
        { note: 'C#', type: 'black' },
        { note: 'D', type: 'white' },
        { note: 'D#', type: 'black' },
        { note: 'E', type: 'white' },
        { note: 'F', type: 'white' },
        { note: 'F#', type: 'black' },
        { note: 'G', type: 'white' },
        { note: 'G#', type: 'black' },
        { note: 'A', type: 'white' },
        { note: 'A#', type: 'black' },
        { note: 'B', type: 'white' }
    ];

    // 生成3个八度的钢琴键（从C3到C5）
    for (let octave = 3; octave <= 5; octave++) {
        console.log(`Generating keys for octave ${octave}`);
        
        // 创建八度容器
        const octaveDiv = document.createElement('div');
        octaveDiv.className = 'octave';
        
        // 先创建白键
        octaveNotes.forEach((noteInfo, index) => {
            if (noteInfo.type === 'white') {
                const key = document.createElement('div');
                key.className = 'piano-key white';
                key.dataset.note = `${noteInfo.note}${octave}`;
                key.innerHTML = `<span class="key-label">${noteInfo.note}${octave}</span>`;
                octaveDiv.appendChild(key);
            }
        });

        // 再创建黑键
        let whiteKeyCount = 0;
        octaveNotes.forEach((noteInfo, index) => {
            if (noteInfo.type === 'black') {
                const key = document.createElement('div');
                key.className = 'piano-key black';
                key.dataset.note = `${noteInfo.note}${octave}`;
                key.innerHTML = `<span class="key-label">${noteInfo.note}${octave}</span>`;
                // 计算黑键的位置
                key.style.left = `${whiteKeyCount * 14.28 - 4}%`;
                octaveDiv.appendChild(key);
            } else {
                whiteKeyCount++;
            }
        });

        pianoContainer.appendChild(octaveDiv);
    }

    console.log('Piano keys generation completed');
}

// 计算音符频率
function getNoteFrequency(note, octave) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFrequency = 440; // A4
    const baseOctave = 4;
    const baseNoteIndex = 9; // A is at index 9
    
    const noteIndex = notes.indexOf(note);
    const octaveDiff = octave - baseOctave;
    const halfSteps = noteIndex - baseNoteIndex + (octaveDiff * 12);
    
    return baseFrequency * Math.pow(2, halfSteps / 12);
}

// 初始化
function initializeApp() {
    console.log('Initializing app...');
    
    // 确保piano容器存在
    let pianoContainer = document.getElementById('piano');
    if (!pianoContainer) {
        console.log('Piano container not found, waiting for DOM...');
        return false;
    }

    try {
        // 初始化音频上下文
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context initialized');

        // 生成钢琴键
        console.log('Generating piano keys...');
        generatePianoKeys();
        console.log('Piano keys generated successfully');
        
        // 初始化钢琴实例
        const piano = new Piano();
        const practiceMode = new PracticeModeManager(piano);
        
        console.log('App initialized successfully');
        return true;
    } catch (error) {
        console.error('Error during initialization:', error);
        return false;
    }
}

// DOM加载完成后尝试初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // 尝试初始化，如果失败则重试
    const tryInitialize = () => {
        if (!initializeApp()) {
            console.log('Initialization failed, retrying in 100ms...');
            setTimeout(tryInitialize, 100);
        }
    };
    
    tryInitialize();
});

// 确保在页面完全加载后也尝试初始化
window.addEventListener('load', () => {
    console.log('Window loaded');
    initializeApp();
});
