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
        
        // 直接初始化，不等待 DOMContentLoaded
        this.initializeUI();
        this.setupEventListeners();
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
        this.keyHintKey = this.keyHint.querySelector('.hint-key');
        this.keyHintNote = this.keyHint.querySelector('.hint-note');

        console.log('Found song-select element:', this.songSelect);
        console.log('Available songs:', Object.keys(songs));

        if (!this.songSelect) {
            console.error('Could not find song-select element');
            return;
        }

        // 清空现有选项
        this.songSelect.innerHTML = '';
        console.log('Cleared existing options');

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '选择曲目...';
        this.songSelect.appendChild(defaultOption);
        console.log('Added default option');

        // 添加歌曲选项
        try {
            Object.entries(songs).forEach(([id, song]) => {
                console.log('Adding song:', id, song.name);
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${song.name} (难度: ${song.difficulty})`;
                this.songSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error adding song options:', error);
        }

        console.log('Final song-select options:', this.songSelect.innerHTML);
        console.log('Number of options:', this.songSelect.options.length);

        // 初始状态下禁用开始按钮
        if (this.startButton) {
            this.startButton.disabled = true;
        }
    }

    startPractice() {
        if (!this.currentSong) return;

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
        if (!this.isPlaying || !this.currentSong) return;

        const currentNote = this.currentSong.notes[this.currentNoteIndex];
        const keyboardKey = this.getKeyboardKeyForNote(currentNote);

        // 更新提示文本
        this.keyHintKey.textContent = keyboardKey;
        this.keyHintNote.textContent = currentNote;

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

    setupEventListeners() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.startPractice());
        }

        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stopPractice());
        }

        if (this.songSelect) {
            this.songSelect.addEventListener('change', () => {
                const selectedSongId = this.songSelect.value;
                if (selectedSongId && songs[selectedSongId]) {
                    this.currentSong = songs[selectedSongId];
                    if (this.startButton) {
                        this.startButton.disabled = false;
                    }
                } else {
                    this.currentSong = null;
                    if (this.startButton) {
                        this.startButton.disabled = true;
                    }
                }
            });
        }

        // 设置钢琴按键回调
        if (this.piano) {
            this.piano.onNotePlay = (note) => {
                if (this.isPlaying) {
                    this.handleNotePlayed(note);
                }
            };
        }
    }
}

export { PracticeMode };
