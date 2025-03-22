// 初始化音频生成器
let audioGenerator;

// 初始化音频上下文
async function initAudio() {
    try {
        audioGenerator = new AudioGenerator();
        console.log('Audio context started');
        setupMetronome();
        setupScalePractice();
        setupChordPractice();
        setupSightReading();
    } catch (error) {
        console.error('Failed to start audio context:', error);
    }
}

// 节拍器功能
function setupMetronome() {
    const startStopBtn = document.querySelector('.start-stop');
    const tempoUpBtn = document.querySelector('.tempo-up');
    const tempoDownBtn = document.querySelector('.tempo-down');
    const timeSignatureSelect = document.querySelector('.time-signature select');
    const tempoDisplay = document.querySelector('.tempo');

    let isPlaying = false;
    let tempo = 120;
    let timeSignature = 4;
    let count = 0;
    let intervalId = null;

    // 开始/停止按钮
    startStopBtn.addEventListener('click', () => {
        if (!isPlaying) {
            const interval = 60000 / tempo; // 计算每拍间隔（毫秒）
            count = 0;
            intervalId = setInterval(() => {
                audioGenerator.createMetronomeSound(count % timeSignature === 0);
                count = (count + 1) % timeSignature;
            }, interval);
            startStopBtn.textContent = '停止';
            isPlaying = true;
        } else {
            clearInterval(intervalId);
            startStopBtn.textContent = '开始';
            isPlaying = false;
            count = 0;
        }
    });

    // 调整速度
    tempoUpBtn.addEventListener('click', () => {
        tempo = Math.min(tempo + 5, 240);
        tempoDisplay.textContent = tempo;
        if (isPlaying) {
            clearInterval(intervalId);
            startStopBtn.click();
        }
    });

    tempoDownBtn.addEventListener('click', () => {
        tempo = Math.max(tempo - 5, 40);
        tempoDisplay.textContent = tempo;
        if (isPlaying) {
            clearInterval(intervalId);
            startStopBtn.click();
        }
    });

    // 拍号选择
    timeSignatureSelect.addEventListener('change', (e) => {
        timeSignature = parseInt(e.target.value);
        count = 0;
        if (isPlaying) {
            clearInterval(intervalId);
            startStopBtn.click();
        }
    });
}

// 音阶练习功能
function setupScalePractice() {
    const keySelect = document.querySelector('.key-select');
    const playScaleBtn = document.querySelector('.play-scale');

    // 定义音阶
    const scales = {
        C: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        G: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
        D: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
        A: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5', 'A5'],
        E: ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5'],
        B: ['B4', 'C#5', 'D#5', 'E5', 'F#5', 'G#5', 'A#5', 'B5'],
        F: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']
    };

    // 播放音阶
    playScaleBtn.addEventListener('click', () => {
        const key = keySelect.value;
        const scale = scales[key];
        
        // 依次播放音阶音符
        scale.forEach((note, index) => {
            setTimeout(() => {
                audioGenerator.playNote(note, 0.5);
            }, index * 500);
        });
    });
}

// 和弦练习功能
function setupChordPractice() {
    const chordSelect = document.querySelector('.chord-type');
    const playChordBtn = document.querySelector('.play-chord');

    // 定义和弦
    const chords = {
        major: ['C4', 'E4', 'G4'],
        minor: ['C4', 'Eb4', 'G4'],
        diminished: ['C4', 'Eb4', 'Gb4'],
        augmented: ['C4', 'E4', 'G#4'],
        dominant7: ['C4', 'E4', 'G4', 'Bb4']
    };

    // 播放和弦
    playChordBtn.addEventListener('click', () => {
        const chordType = chordSelect.value;
        const chord = chords[chordType];
        audioGenerator.playChord(chord, 1);
    });
}

// 视奏训练功能
function setupSightReading() {
    const difficultySelect = document.querySelector('.difficulty-selector select');
    const generateBtn = document.querySelector('.generate-notes');
    const staffContainer = document.getElementById('staff-container');
    const currentNotesDisplay = document.querySelector('.current-notes');
    
    // 创建五线谱渲染器
    const staffRenderer = new StaffRenderer(staffContainer);
    
    // 生成新的视奏练习
    generateBtn.addEventListener('click', () => {
        const difficulty = difficultySelect.value;
        const noteCount = difficulty === 'beginner' ? 4 : (difficulty === 'intermediate' ? 6 : 8);
        const notes = NoteUtils.generateRandomNotes(difficulty, noteCount);
        
        // 渲染五线谱
        staffRenderer.renderNotes(notes);
        
        // 显示音符名称（用于练习）
        currentNotesDisplay.textContent = `音符: ${notes.join(' - ')}`;
    });
    
    // 初始生成一个练习
    generateBtn.click();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 添加用户交互监听器来初始化音频
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
});
