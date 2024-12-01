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
        this.audioContext = null;
        this.masterGainNode = null;
        this.buffers = {};
        this.activeNotes = {};
        this.sustainPedal = false;
        this.recording = false;
        this.recordedNotes = [];
        this.startTime = 0;
        this.currentSong = null;
        this.metronome = null;
        this.volume = 0.8;

        // 初始化界面
        this.generatePianoKeys();
        this.setupEventListeners();
        this.setupVisualization();
        this.initializeAudio();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.volume;
            
            // 创建分析器节点用于波形显示
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.masterGainNode.connect(this.analyser);
            
            await this.loadSamples();
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    async loadSamples() {
        const baseUrl = 'https://piano-samples.s3.amazonaws.com/';
        const notes = Array.from({ length: 88 }, (_, i) => i + 21); // MIDI notes 21-108
        
        try {
            await Promise.all(notes.map(async (note) => {
                const response = await fetch(`${baseUrl}${note}_mf.mp3`);
                const arrayBuffer = await response.arrayBuffer();
                this.buffers[note] = await this.audioContext.decodeAudioData(arrayBuffer);
            }));
        } catch (error) {
            console.error('Error loading samples:', error);
            // 降级到使用振荡器
            this.useFallbackSynth();
        }
    }

    useFallbackSynth() {
        // 使用振荡器作为后备方案
        const notes = Array.from({ length: 88 }, (_, i) => i + 21);
        notes.forEach(note => {
            const frequency = 440 * Math.pow(2, (note - 69) / 12);
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * 2;
            const buffer = this.audioContext.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < length; i++) {
                data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
            }
            
            this.buffers[note] = buffer;
        });
    }

    setupVisualization() {
        this.waveformCanvas = document.getElementById('waveform');
        this.canvasCtx = this.waveformCanvas.getContext('2d');
        this.drawWaveform();
    }

    drawWaveform() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        this.canvasCtx.fillRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.beginPath();

        const sliceWidth = this.waveformCanvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * this.waveformCanvas.height / 2;

            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.canvasCtx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
        this.canvasCtx.stroke();

        requestAnimationFrame(() => this.drawWaveform());
    }

    playNote(note, velocity = 0.7) {
        if (!this.audioContext || !this.buffers[note]) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.buffers[note];
        gainNode.gain.value = velocity;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        source.start();
        this.activeNotes[note] = { source, gainNode };

        // 录制模式
        if (this.recording) {
            const time = (Date.now() - this.startTime) / 1000;
            this.recordedNotes.push({
                note,
                velocity,
                time,
                duration: 0,
                type: 'noteOn'
            });
        }

        // 更新视觉反馈
        this.updateKeyVisual(note, true);
        this.updateCurrentNote(note);
    }

    stopNote(note) {
        if (!this.activeNotes[note]) return;
        
        if (this.sustainPedal) {
            // 如果踏板按下，只记录结束时间但不停止声音
            if (this.recording) {
                const time = (Date.now() - this.startTime) / 1000;
                this.recordedNotes.push({
                    note,
                    time,
                    type: 'noteOff'
                });
            }
        } else {
            const { gainNode } = this.activeNotes[note];
            gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            
            setTimeout(() => {
                if (this.activeNotes[note]) {
                    this.activeNotes[note].source.stop();
                    delete this.activeNotes[note];
                }
            }, 100);
        }

        // 更新视觉反馈
        this.updateKeyVisual(note, false);
    }

    toggleSustainPedal() {
        this.sustainPedal = !this.sustainPedal;
        document.getElementById('sustainPedal').textContent = this.sustainPedal ? '开启' : '关闭';
        
        if (!this.sustainPedal) {
            // 释放所有持续的音符
            Object.keys(this.activeNotes).forEach(note => {
                this.stopNote(parseInt(note));
            });
        }
    }

    startRecording() {
        this.recording = true;
        this.recordedNotes = [];
        this.startTime = Date.now();
        document.getElementById('recordButton').classList.add('bg-red-700');
        document.getElementById('playButton').disabled = true;
    }

    stopRecording() {
        this.recording = false;
        document.getElementById('recordButton').classList.remove('bg-red-700');
        document.getElementById('playButton').disabled = false;
    }

    playRecording() {
        if (this.recordedNotes.length === 0) return;
        
        const startTime = this.audioContext.currentTime;
        
        this.recordedNotes.forEach(event => {
            if (event.type === 'noteOn') {
                this.audioContext.setTimeout(() => {
                    this.playNote(event.note, event.velocity);
                }, event.time * 1000);
            } else {
                this.audioContext.setTimeout(() => {
                    this.stopNote(event.note);
                }, event.time * 1000);
            }
        });
    }

    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 鼠标事件
        const pianoKeys = document.querySelectorAll('.piano-key');
        pianoKeys.forEach(key => {
            key.addEventListener('mousedown', e => {
                const note = parseInt(key.dataset.note);
                if (!isNaN(note)) {
                    this.playNote(note, 0.7);
                }
            });

            key.addEventListener('mouseup', e => {
                const note = parseInt(key.dataset.note);
                if (!isNaN(note)) {
                    this.stopNote(note);
                }
            });

            key.addEventListener('mouseleave', e => {
                const note = parseInt(key.dataset.note);
                if (!isNaN(note)) {
                    this.stopNote(note);
                }
            });
        });

        // 控制按钮事件
        document.getElementById('recordButton').addEventListener('click', () => {
            if (!this.recording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        });

        document.getElementById('playButton').addEventListener('click', () => {
            this.playRecording();
        });

        document.getElementById('sustainPedal').addEventListener('click', () => {
            this.toggleSustainPedal();
        });

        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            if (this.masterGainNode) {
                this.masterGainNode.gain.value = this.volume;
            }
        });
    }

    updateCurrentNote(note) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note / 12) - 1;
        const noteName = noteNames[note % 12];
        document.getElementById('currentNote').textContent = `${noteName}${octave}`;
    }

    // 其他已有的方法保持不变...
}

// 初始化钢琴
document.addEventListener('DOMContentLoaded', () => {
    window.piano = new Piano();
});
