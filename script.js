const songs = {
    'twinkle': {
        notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'],
        name: '小星星'
    },
    'happy-birthday': {
        notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4'],
        name: '生日快乐'
    }
};

class Piano {
    constructor() {
        // 初始化音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // 钢琴音色配置
        this.samples = {};
        this.isLoading = true;
        this.loadSamples();
        
        // 当前按下的键
        this.activeNotes = new Map();
        
        // 录制相关
        this.isRecording = false;
        this.recordedNotes = [];
        this.startTime = null;
        
        this.initializeListeners();
    }
    
    async loadSamples() {
        const notes = [
            'A0', 'C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3',
            'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6'
        ];
        
        try {
            const loadPromises = notes.map(async note => {
                const response = await fetch(`samples/piano-${note}.mp3`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.samples[note] = audioBuffer;
            });
            
            await Promise.all(loadPromises);
            this.isLoading = false;
            console.log('Piano samples loaded successfully');
        } catch (error) {
            console.error('Error loading piano samples:', error);
        }
    }
    
    getNearestSample(note) {
        // 获取最接近的采样音符
        const noteNumber = this.getNoteNumber(note);
        const samples = Object.keys(this.samples);
        let closest = samples[0];
        
        samples.forEach(sample => {
            if (Math.abs(this.getNoteNumber(sample) - noteNumber) < 
                Math.abs(this.getNoteNumber(closest) - noteNumber)) {
                closest = sample;
            }
        });
        
        return this.samples[closest];
    }
    
    initializeListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        document.getElementById('record-btn').addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playRecording();
        });
    }
    
    handleKeyDown(e) {
        const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
        if (!key) return;
        
        const note = key.dataset.note;
        this.playNote(note);
        key.classList.add('active');
        
        if (this.isRecording) {
            this.recordNote(note);
        }
    }
    
    handleKeyUp(e) {
        const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
        if (key) {
            key.classList.remove('active');
        }
    }
    
    playNote(note) {
        const sample = this.getNearestSample(note);
        const source = this.audioContext.createBufferSource();
        source.buffer = sample;
        source.connect(this.masterGain);
        source.start();
    }
    
    toggleRecording() {
        this.isRecording = !this.isRecording;
        const btn = document.getElementById('record-btn');
        
        if (this.isRecording) {
            this.recordedNotes = [];
            this.startTime = Date.now();
            btn.textContent = "停止录制";
            btn.classList.add('recording');
        } else {
            btn.textContent = "开始录制";
            btn.classList.remove('recording');
        }
    }
    
    recordNote(note) {
        const time = Date.now() - this.startTime;
        this.recordedNotes.push({
            note,
            time
        });
    }
    
    playRecording() {
        if (this.recordedNotes.length === 0) return;
        
        const now = Tone.now();
        this.recordedNotes.forEach(({note, time}) => {
            this.playNote(note);
        });
    }
}

// 等待页面加载完成后初始化钢琴
window.addEventListener('load', () => {
    new Piano();
}); 