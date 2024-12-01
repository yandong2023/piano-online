class PianoAudio {
    constructor() {
        console.log('PianoAudio constructor called');
        this.initialized = false;
        this.sampler = null;
        this.reverb = null;
        this.context = null;
        this.samples = {};
        this.gainNode = null;
        this.sustainedNotes = new Set();
        
        // 创建所有音符的音频元素
        this.audioElements = {};
        this.volume = 0.5;
        
        // 预加载所有音符
        this.preloadNotes();
    }

    async init() {
        if (this.initialized) return true;

        try {
            console.log('Initializing PianoAudio');
            // 创建 AudioContext
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建增益节点
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.context.destination);
            
            // 设置音量
            this.setVolume(this.volume);
            
            console.log('AudioContext created, waiting for user interaction');
            
            // 添加点击事件来恢复 AudioContext
            const resumeAudioContext = async () => {
                if (this.context.state === 'suspended') {
                    await this.context.resume();
                    console.log('AudioContext resumed successfully');
                }
            };
            
            // 添加多个事件监听器来恢复 AudioContext
            const events = ['click', 'keydown', 'touchstart'];
            events.forEach(event => {
                document.addEventListener(event, resumeAudioContext, { once: true });
            });
            
            // Start audio context
            await Tone.start();
            console.log("Audio context started");
            
            // Initialize sampler
            this.sampler = new Tone.Sampler({
                urls: {
                    "C4": "piano-C4.mp3",
                    "G4": "piano-G4.mp3",
                    "C5": "piano-C5.mp3"
                },
                baseUrl: "samples/",
                onload: () => {
                    console.log("Sampler loaded");
                    this.initialized = true;
                }
            }).toDestination();

            // Add reverb
            this.reverb = new Tone.Reverb({
                decay: 2,
                wet: 0.2
            }).toDestination();
            this.sampler.connect(this.reverb);

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    preloadNotes() {
        console.log('Preloading notes');
        // 只加载实际存在的音符文件
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = ['3', '4', '5', '6'];
        
        notes.forEach(note => {
            octaves.forEach(octave => {
                const noteId = `${note}${octave}`;
                const audio = new Audio(`samples/piano-${noteId}.mp3`);
                audio.preload = 'auto';
                this.audioElements[noteId] = audio;
                
                // 对于升号音符，使用相邻的音符
                if (note !== 'E' && note !== 'B') {
                    const sharpNoteId = `${note}#${octave}`;
                    this.audioElements[sharpNoteId] = audio;
                }
                
                console.log(`Preloading note: samples/piano-${noteId}.mp3`);
            });
        });
    }

    playNote(note) {
        console.log('Playing note:', note);
        try {
            if (this.sampler && this.sampler.loaded) {
                this.sampler.triggerAttack(note);
            } else {
                // 如果是升号音符，使用相邻的音符
                const audioElement = this.audioElements[note] || this.audioElements[this.getNearestNote(note)];
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.volume = this.volume;
                    audioElement.play().catch(error => {
                        console.error('Failed to play note:', error);
                        // 如果播放失败，尝试重新加载
                        audioElement.load();
                    });
                } else {
                    console.warn('No audio element found for note:', note);
                }
            }
        } catch (error) {
            console.error('Error playing note:', note, error);
        }
    }

    stopNote(note) {
        console.log('Stopping note:', note);
        try {
            if (this.sampler && this.sampler.loaded) {
                this.sampler.triggerRelease(note);
            } else if (this.audioElements[note]) {
                // 如果使用的是音频元素，设置淡出效果
                const audio = this.audioElements[note];
                const fadeOut = setInterval(() => {
                    if (audio.volume > 0.1) {
                        audio.volume -= 0.1;
                    } else {
                        audio.pause();
                        audio.volume = this.volume;
                        clearInterval(fadeOut);
                    }
                }, 50);
            }
        } catch (error) {
            console.error('Error stopping note:', note, error);
        }
    }

    getNearestNote(note) {
        // 将升号音符映射到相邻的音符
        const noteMap = {
            'C#': 'D',
            'D#': 'E',
            'F#': 'G',
            'G#': 'A',
            'A#': 'B'
        };
        
        const noteName = note.slice(0, -1);  // 去掉最后的数字
        const octave = note.slice(-1);       // 获取八度数
        
        if (noteMap[noteName]) {
            return noteMap[noteName] + octave;
        }
        return note;
    }

    setVolume(value) {
        console.log('Setting volume:', value);
        this.volume = value;
        if (this.sampler) {
            this.sampler.volume.value = Tone.gainToDb(value);
        }
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
        // 设置所有音频元素的音量
        Object.values(this.audioElements).forEach(audio => {
            audio.volume = value;
        });
    }

    setSustain(enabled) {
        if (enabled) {
            this.sustainedNotes.clear();
        } else {
            // 释放所有持续的音符
            this.sustainedNotes.forEach(note => {
                this.stopNote(note);
            });
            this.sustainedNotes.clear();
        }
    }
}

export default PianoAudio;
