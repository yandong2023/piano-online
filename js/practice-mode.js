import { songs, calculateScore } from './practice-songs.js';

console.log('practice-mode.js loaded');
console.log('Imported songs:', songs);

class PracticeMode {
    constructor(piano) {
        console.log('PracticeMode constructor called');
        this.piano = piano;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        this.isPlaying = false;
        this.startTime = null;
        this.correctNotes = 0;
        this.wrongNotes = 0;

        // 等待 DOM 加载完成后再初始化
        this.initializeUI();
    }

    initializeUI() {
        console.log('Initializing UI...');
        
        // 获取UI元素
        this.songSelect = document.getElementById('song-select');
        this.startButton = document.getElementById('start-practice');
        this.stopButton = document.getElementById('stop-practice');
        this.practiceStats = document.getElementById('practice-stats');
        this.correctNotesSpan = document.getElementById('correct-notes');
        this.wrongNotesSpan = document.getElementById('wrong-notes');
        this.progressSpan = document.getElementById('progress');
        this.keyHint = document.getElementById('key-hint');

        // 检查是否找到所有必需的元素
        if (!this.songSelect || !this.startButton || !this.stopButton || !this.practiceStats) {
            console.error('Some required UI elements are missing');
            console.log('songSelect:', this.songSelect);
            console.log('startButton:', this.startButton);
            console.log('stopButton:', this.stopButton);
            console.log('practiceStats:', this.practiceStats);
            return;
        }

        // 获取提示元素
        this.keyHintKey = this.keyHint?.querySelector('.hint-key');
        this.keyHintNote = this.keyHint?.querySelector('.hint-note');

        // 初始状态下禁用开始按钮
        this.startButton.disabled = true;

        // 设置事件监听器
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 歌曲选择事件
        this.songSelect.addEventListener('change', (e) => {
            const songId = e.target.value;
            if (songId && songs[songId]) {
                this.currentSong = {
                    ...songs[songId],
                    id: songId
                };
                this.startButton.disabled = false;
                console.log('Selected song:', this.currentSong);
            } else {
                this.currentSong = null;
                this.startButton.disabled = true;
            }
        });

        // 开始按钮事件
        this.startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            this.startPractice();
        });
        
        // 停止按钮事件
        this.stopButton.addEventListener('click', () => {
            console.log('Stop button clicked');
            this.stopPractice();
        });

        // 设置钢琴的音符回调
        this.piano.onNotePlay = (note) => this.handleNotePlayed(note);
    }

    startPractice() {
        console.log('Starting practice with song:', this.currentSong);
        if (!this.currentSong) {
            console.error('No song selected');
            return;
        }

        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.correctNotes = 0;
        this.wrongNotes = 0;
        this.startTime = Date.now();

        // 显示停止按钮
        this.startButton.classList.add('hidden');
        this.stopButton.classList.remove('hidden');
        this.practiceStats.classList.remove('hidden');
        this.keyHint.classList.remove('hidden');

        // 更新统计信息
        this.updateStats();
        
        // 显示第一个音符提示
        this.updateKeyHint();
        
        console.log('Practice started successfully');
    }

    stopPractice() {
        this.isPlaying = false;
        
        // 显示开始按钮
        this.startButton.classList.remove('hidden');
        this.stopButton.classList.add('hidden');
        this.practiceStats.classList.add('hidden');
        this.keyHint.classList.add('hidden');

        // 移除所有键的高亮
        this.clearKeyHighlight();

        // 计算并显示最终得分
        if (this.correctNotes > 0 || this.wrongNotes > 0) {
            const score = calculateScore(this.correctNotes, this.wrongNotes);
            alert(`练习结束!\n正确: ${this.correctNotes}\n错误: ${this.wrongNotes}\n得分: ${score}`);
        }
    }

    handleNotePlayed(note) {
        if (!this.isPlaying || !this.currentSong) return;

        const expectedNote = this.currentSong.notes[this.currentNoteIndex];
        if (note === expectedNote) {
            this.correctNotes++;
            this.currentNoteIndex++;
            
            // 检查是否完成
            if (this.currentNoteIndex >= this.currentSong.notes.length) {
                this.stopPractice();
                alert('恭喜！你完成了这首曲子！');
                return;
            }
        } else {
            this.wrongNotes++;
        }

        // 更新统计信息和提示
        this.updateStats();
        this.updateKeyHint();
    }

    updateStats() {
        if (!this.currentSong) return;

        const totalNotes = this.currentSong.notes.length;
        const progress = Math.round((this.currentNoteIndex / totalNotes) * 100);

        this.correctNotesSpan.textContent = `正确: ${this.correctNotes}`;
        this.wrongNotesSpan.textContent = `错误: ${this.wrongNotes}`;
        this.progressSpan.textContent = `进度: ${progress}%`;
    }

    updateKeyHint() {
        console.log('Updating key hint, isPlaying:', this.isPlaying, 'currentSong:', this.currentSong);
        if (!this.isPlaying || !this.currentSong) return;

        const currentNote = this.currentSong.notes[this.currentNoteIndex];
        const keyboardKey = this.getKeyboardKeyForNote(currentNote);
        console.log('Current note:', currentNote, 'Keyboard key:', keyboardKey);

        // 更新提示文本
        if (this.keyHintKey && this.keyHintNote) {
            this.keyHintKey.textContent = keyboardKey;
            this.keyHintNote.textContent = currentNote;
            console.log('Updated hint text successfully');
        } else {
            console.error('Key hint elements not found');
        }

        // 高亮当前键
        this.highlightKey(currentNote);
    }

    getKeyboardKeyForNote(note) {
        // 遍历钢琴的 keyMap 找到对应的键盘按键
        for (const [key, mappedNote] of Object.entries(this.piano.keyMap)) {
            if (mappedNote === note) {
                return key;
            }
        }
        return '';
    }

    highlightKey(note) {
        // 移除之前的高亮
        this.clearKeyHighlight();

        // 添加新的高亮
        const keys = document.querySelectorAll('.piano-key');
        keys.forEach(key => {
            if (key.dataset.note === note) {
                key.classList.add('current');
            }
        });
    }

    clearKeyHighlight() {
        const keys = document.querySelectorAll('.piano-key');
        keys.forEach(key => {
            key.classList.remove('current');
        });
    }
}

export { PracticeMode };
