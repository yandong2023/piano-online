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

        // 显示/隐藏相应的按钮
        if (this.startButton && this.stopButton) {
            this.startButton.style.display = 'none';
            this.stopButton.style.display = 'block';
        }

        // 显示统计面板
        if (this.practiceStats) {
            this.practiceStats.style.display = 'block';
        }

        // 显示提示面板
        if (this.keyHint) {
            this.keyHint.style.display = 'block';
        }

        // 更新统计信息
        this.updateStats();
        
        // 显示第一个音符提示
        this.updateKeyHint();
        
        console.log('Practice started successfully');
    }

    stopPractice() {
        console.log('Stopping practice');
        this.isPlaying = false;
        
        // 显示/隐藏相应的按钮
        if (this.startButton && this.stopButton) {
            this.startButton.style.display = 'block';
            this.stopButton.style.display = 'none';
        }

        // 隐藏统计面板
        if (this.practiceStats) {
            this.practiceStats.style.display = 'none';
        }

        // 隐藏提示面板
        if (this.keyHint) {
            this.keyHint.style.display = 'none';
        }

        // 移除所有键的高亮
        this.clearKeyHighlight();

        // 计算并显示最终得分
        if (this.correctNotes > 0 || this.wrongNotes > 0) {
            const score = calculateScore(this.correctNotes, this.wrongNotes);
            alert(`练习结束!\n正确: ${this.correctNotes}\n错误: ${this.wrongNotes}\n得分: ${score}`);
        }
        
        console.log('Practice stopped successfully');
    }

    handleNotePlayed(note) {
        if (!this.isPlaying || !this.currentSong) return;

        const expectedNote = this.currentSong.notes[this.currentNoteIndex];
        const keyElement = this.piano.keys[note];

        if (note === expectedNote) {
            this.correctNotes++;
            this.currentNoteIndex++;

            // 显示成功视觉反馈
            if (keyElement) {
                keyElement.classList.add('success');
                setTimeout(() => {
                    keyElement.classList.remove('success');
                }, 500);
            }

            // 检查是否完成
            if (this.currentNoteIndex >= this.currentSong.notes.length) {
                this.stopPractice();
                this.showCompletionMessage();
                return;
            }
        } else {
            this.wrongNotes++;

            // 显示错误视觉反馈
            if (keyElement) {
                keyElement.classList.add('error');
                setTimeout(() => {
                    keyElement.classList.remove('error');
                }, 400);
            }
        }

        // 更新统计信息和提示
        this.updateStats();
        this.updateKeyHint();
    }

    showCompletionMessage() {
        const accuracy = this.correctNotes / (this.correctNotes + this.wrongNotes) * 100;
        const message = `
            🎉 恭喜完成！

            正确: ${this.correctNotes}
            错误: ${this.wrongNotes}
            准确率: ${accuracy.toFixed(1)}%
        `;
        alert(message);
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
        const candidates = [];
        for (const [key, mappedNote] of Object.entries(this.piano.keyMap)) {
            if (mappedNote === note) {
                candidates.push(key);
            }
        }

        if (candidates.length === 0) {
            return '';
        }

        const priority = (key) => {
            if (/^[a-z]$/.test(key)) return 0;
            if (/^[0-9]$/.test(key)) return 1;
            return 2;
        };

        candidates.sort((a, b) => priority(a) - priority(b));

        const chosenKey = candidates[0];
        return chosenKey.length > 1 && chosenKey.startsWith('w')
            ? chosenKey.substring(1)
            : chosenKey.toUpperCase();
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
