// 音频生成器类
class AudioGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.init();
    }

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
    }

    // 生成节拍器声音
    createMetronomeSound(isAccent = false) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 重拍使用较低的频率和较大的音量
        osc.frequency.value = isAccent ? 880 : 440;
        gainNode.gain.value = isAccent ? 0.5 : 0.3;
        
        osc.start();
        
        // 快速衰减
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // 生成钢琴音色
    createPianoSound(frequency, duration = 1) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 使用正弦波模拟钢琴音色
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        // 添加包络
        gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    // 音符名称转换为频率
    noteToFrequency(note) {
        const notes = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
        
        // 处理音符名称，支持#和b
        let noteName = note.slice(0, -1);
        if (noteName.length > 1 && (noteName[1] === '#' || noteName[1] === 'b')) {
            noteName = noteName.slice(0, 2);
        } else {
            noteName = noteName[0];
        }
        
        const octave = parseInt(note.slice(-1));
        
        if (!notes.hasOwnProperty(noteName) || isNaN(octave)) {
            console.error('Invalid note:', note);
            return 440; // 返回默认频率 A4
        }
        
        // A4 = 440Hz
        const A4 = 440;
        const A4_INDEX = 9 + 4 * 12; // A4的MIDI音符编号
        const noteIndex = notes[noteName] + octave * 12;
        
        return A4 * Math.pow(2, (noteIndex - A4_INDEX) / 12);
    }

    // 播放音符
    playNote(note, duration = 1) {
        try {
            const frequency = this.noteToFrequency(note);
            if (isFinite(frequency) && frequency > 0) {
                this.createPianoSound(frequency, duration);
            } else {
                console.error('Invalid frequency for note:', note);
            }
        } catch (error) {
            console.error('Error playing note:', note, error);
        }
    }

    // 播放和弦
    playChord(notes, duration = 1) {
        try {
            notes.forEach(note => {
                if (note && typeof note === 'string') {
                    this.playNote(note, duration);
                }
            });
        } catch (error) {
            console.error('Error playing chord:', notes, error);
        }
    }
}
