// 节奏大师游戏类
export class RhythmGame {
    constructor(piano) {
        this.piano = piano;
        this.isPlaying = false;
        this.score = 0;
        this.combo = 0;
        this.lives = 3;
        this.fallingNotes = [];
        this.noteSequence = [];
        this.currentNoteIndex = 0;
        this.gameSpeed = 1;
        this.noteDropInterval = null;
        this.gameLoop = null;
        
        // 音符下落时间（毫秒）- 调整到合适的速度,更慢一些让玩家有时间反应
        this.noteDropTime = 4000;
        // 音符命中区域高度
        this.hitZoneHeight = 100;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSongData();
    }

    initializeElements() {
        this.startButton = document.getElementById('start-rhythm-game');
        this.stopButton = document.getElementById('stop-rhythm-game');
        this.gameStats = document.getElementById('game-stats');
        this.noteDropZone = document.getElementById('note-drop-zone');
        this.fallingNotesContainer = document.getElementById('falling-notes');
        this.scoreElement = document.getElementById('game-score');
        this.comboElement = document.getElementById('game-combo');
        this.livesElement = document.getElementById('game-lives');
        this.songSelect = document.getElementById('song-select');
        this.gameInstructions = document.getElementById('game-instructions');

        if (!this.startButton) {
            console.error('节奏大师开始按钮未找到');
        }
        if (!this.songSelect) {
            console.error('歌曲选择器未找到');
        }
    }

    initializeEventListeners() {
        if (!this.startButton) {
            console.error('节奏大师开始按钮未找到!无法添加事件监听器');
            return;
        }

        this.startButton.addEventListener('click', (e) => {
            console.log('节奏大师按钮被点击');
            e.preventDefault();
            e.stopPropagation();
            this.startGame();
        });

        if (this.stopButton) {
            this.stopButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.stopGame();
            });
        }

        // 监听钢琴按键
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying) {
                this.handleKeyPress(e.key);
            }
        });

        console.log('节奏大师事件监听器已添加');
    }

    initializeSongData() {
        // 歌曲数据 - 每首歌曲的音符序列
        this.songData = {
            'twinkle': {
                name: '小星星',
                notes: [
                    { note: 'C', time: 0 },
                    { note: 'C', time: 600 },
                    { note: 'G', time: 1200 },
                    { note: 'G', time: 1800 },
                    { note: 'A', time: 2400 },
                    { note: 'A', time: 3000 },
                    { note: 'G', time: 3600 },
                    { note: 'F', time: 4800 },
                    { note: 'F', time: 5400 },
                    { note: 'E', time: 6000 },
                    { note: 'E', time: 6600 },
                    { note: 'D', time: 7200 },
                    { note: 'D', time: 7800 },
                    { note: 'C', time: 8400 }
                ]
            },
            'happy-birthday': {
                name: '生日快乐',
                notes: [
                    { note: 'C', time: 0 },
                    { note: 'C', time: 400 },
                    { note: 'D', time: 800 },
                    { note: 'C', time: 1400 },
                    { note: 'F', time: 2000 },
                    { note: 'E', time: 2800 },
                    { note: 'C', time: 3800 },
                    { note: 'C', time: 4200 },
                    { note: 'D', time: 4600 },
                    { note: 'C', time: 5200 },
                    { note: 'G', time: 5800 },
                    { note: 'F', time: 6600 }
                ]
            },
            'ode-to-joy': {
                name: '欢乐颂',
                notes: [
                    { note: 'E', time: 0 },
                    { note: 'E', time: 500 },
                    { note: 'F', time: 1000 },
                    { note: 'G', time: 1500 },
                    { note: 'G', time: 2000 },
                    { note: 'F', time: 2500 },
                    { note: 'E', time: 3000 },
                    { note: 'D', time: 3500 },
                    { note: 'C', time: 4000 },
                    { note: 'C', time: 4500 },
                    { note: 'D', time: 5000 },
                    { note: 'E', time: 5500 },
                    { note: 'E', time: 6000 },
                    { note: 'D', time: 6750 },
                    { note: 'D', time: 7500 }
                ]
            },
            'jingle-bells': {
                name: '铃儿响叮当',
                notes: [
                    { note: 'E', time: 0 },
                    { note: 'E', time: 500 },
                    { note: 'E', time: 1000 },
                    { note: 'E', time: 2000 },
                    { note: 'E', time: 2500 },
                    { note: 'E', time: 3000 },
                    { note: 'E', time: 4000 },
                    { note: 'G', time: 4500 },
                    { note: 'C', time: 5000 },
                    { note: 'D', time: 5500 },
                    { note: 'E', time: 6000 },
                    { note: 'F', time: 7500 },
                    { note: 'F', time: 8000 },
                    { note: 'F', time: 8500 },
                    { note: 'F', time: 9000 },
                    { note: 'F', time: 9500 },
                    { note: 'E', time: 10000 },
                    { note: 'E', time: 10500 },
                    { note: 'E', time: 11000 },
                    { note: 'E', time: 11500 },
                    { note: 'D', time: 12000 },
                    { note: 'D', time: 12500 },
                    { note: 'E', time: 13000 },
                    { note: 'D', time: 13500 },
                    { note: 'G', time: 14500 }
                ]
            },
            'mary-lamb': {
                name: '玛丽有只小羊羔',
                notes: [
                    { note: 'E', time: 0 },
                    { note: 'D', time: 500 },
                    { note: 'C', time: 1000 },
                    { note: 'D', time: 1500 },
                    { note: 'E', time: 2000 },
                    { note: 'E', time: 2500 },
                    { note: 'E', time: 3000 },
                    { note: 'D', time: 4000 },
                    { note: 'D', time: 4500 },
                    { note: 'D', time: 5000 },
                    { note: 'E', time: 6000 },
                    { note: 'G', time: 6500 },
                    { note: 'G', time: 7000 },
                    { note: 'E', time: 8000 },
                    { note: 'D', time: 8500 },
                    { note: 'C', time: 9000 },
                    { note: 'D', time: 9500 },
                    { note: 'E', time: 10000 },
                    { note: 'E', time: 10500 },
                    { note: 'E', time: 11000 },
                    { note: 'E', time: 11500 },
                    { note: 'D', time: 12000 },
                    { note: 'D', time: 12500 },
                    { note: 'E', time: 13000 },
                    { note: 'D', time: 13500 },
                    { note: 'C', time: 14500 }
                ]
            }
        };
    }

    startGame() {
        const selectedSong = this.songSelect.value;
        if (!selectedSong || !this.songData[selectedSong]) {
            alert('请先选择一首歌曲！');
            return;
        }

        this.isPlaying = true;
        this.score = 0;
        this.combo = 0;
        this.lives = 3;
        this.fallingNotes = [];
        this.currentNoteIndex = 0;

        // 显示游戏界面
        this.startButton.style.display = 'none';
        this.stopButton.style.display = 'inline-block';
        this.gameStats.style.display = 'flex';
        this.noteDropZone.style.display = 'block';
        this.gameInstructions.style.display = 'block';
        document.body.classList.add('rhythm-mode');

        // 设置音符序列
        this.noteSequence = this.songData[selectedSong].notes;

        // 更新显示
        this.updateScoreDisplay();
        this.updateComboDisplay();
        this.updateLivesDisplay();

        // 开始游戏循环
        this.startGameLoop();

        // 延迟一下再开始生成音符,给玩家准备时间
        setTimeout(() => {
            if (this.isPlaying) {
                this.startNoteGeneration();
                this.playBackgroundMusic();
            }
        }, 1000);

        console.log(`开始节奏大师游戏: ${this.songData[selectedSong].name}`);
    }

    stopGame() {
        this.isPlaying = false;
        
        // 清除定时器
        if (this.noteDropInterval) {
            clearInterval(this.noteDropInterval);
            this.noteDropInterval = null;
        }
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 清除所有下落音符
        this.fallingNotes = [];
        this.fallingNotesContainer.innerHTML = '';
        
        // 隐藏游戏界面
        this.startButton.style.display = 'inline-block';
        this.stopButton.style.display = 'none';
        this.gameStats.style.display = 'none';
        this.noteDropZone.style.display = 'none';
        this.gameInstructions.style.display = 'none';
        document.body.classList.remove('rhythm-mode');
        
        console.log('节奏大师游戏结束');
    }

    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.updateGame();
        }, 16); // 60 FPS
    }

    startNoteGeneration() {
        // 游戏开始时间
        this.gameStartTime = Date.now();

        // 为每个音符设置定时器,在正确的时间生成
        this.noteSequence.forEach((noteData, index) => {
            // 音符应该在 (noteData.time - noteDropTime) 时生成,这样它正好在 noteData.time 时到达底部
            const generateTime = noteData.time;

            setTimeout(() => {
                if (this.isPlaying) {
                    this.createFallingNote(noteData.note, noteData.time);

                    // 如果是最后一个音符,设置游戏结束检查
                    if (index === this.noteSequence.length - 1) {
                        setTimeout(() => {
                            if (this.isPlaying && this.fallingNotes.length === 0) {
                                this.endGame(true);
                            }
                        }, this.noteDropTime + 1000);
                    }
                }
            }, generateTime);
        });

        console.log(`开始生成 ${this.noteSequence.length} 个音符`);
    }

    createFallingNote(note, startTime) {
        const noteElement = document.createElement('div');
        noteElement.className = 'falling-note';

        // 使用C3作为基准音高,和keyMap保持一致 (A→C3, S→D3...)
        const fullNote = note + '3';

        // 通过keyMap反向查找键盘按键
        let keyboardKey = null;
        for (const [key, mappedNote] of Object.entries(this.piano.keyMap)) {
            if (mappedNote === fullNote) {
                keyboardKey = key;
                break;
            }
        }

        // 显示键盘按键,而不是音符名称
        noteElement.textContent = keyboardKey ? keyboardKey.toUpperCase() : note;
        noteElement.dataset.note = note;
        noteElement.dataset.fullNote = fullNote;
        noteElement.dataset.key = keyboardKey;

        // 查找对应的钢琴键元素
        const pianoKey = document.querySelector(`.key[data-note="${fullNote}"]`);

        if (pianoKey && keyboardKey) {
            const keyRect = pianoKey.getBoundingClientRect();
            const containerRect = this.noteDropZone.getBoundingClientRect();
            const leftPosition = keyRect.left - containerRect.left + (keyRect.width / 2) - 20;

            noteElement.style.left = `${leftPosition}px`;
            noteElement.style.top = '-50px';

            this.fallingNotesContainer.appendChild(noteElement);

            // 添加到下落音符数组
            this.fallingNotes.push({
                element: noteElement,
                note: note,
                fullNote: fullNote,
                keyboardKey: keyboardKey.toLowerCase(),
                startTime: Date.now(),
                x: leftPosition
            });

            console.log(`创建音符 ${note} (${fullNote}) → 键盘键 ${keyboardKey.toUpperCase()}, 位置: ${leftPosition}px`);
        } else {
            console.error(`找不到钢琴键或键盘映射: ${fullNote}, keyboardKey: ${keyboardKey}`);
        }
    }

    getNoteIndex(note) {
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return noteOrder.indexOf(note);
    }

    updateGame() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();
        const dropZoneHeight = this.noteDropZone.offsetHeight;

        // 从后往前遍历,这样删除元素不会影响索引
        for (let i = this.fallingNotes.length - 1; i >= 0; i--) {
            const fallingNote = this.fallingNotes[i];

            // 跳过无效的音符对象
            if (!fallingNote || !fallingNote.element) {
                this.fallingNotes.splice(i, 1);
                continue;
            }

            // 检查元素是否有hit类(已命中),如果有就不更新位置
            if (fallingNote.element.classList.contains('hit')) {
                continue;
            }

            const elapsed = currentTime - fallingNote.startTime;
            const progress = elapsed / this.noteDropTime;

            if (progress >= 1) {
                // 音符到达底部,错过了
                this.handleMissedNote(fallingNote);
                this.fallingNotes.splice(i, 1);
            } else {
                // 更新音符位置
                const topPosition = progress * (dropZoneHeight + 50);
                fallingNote.element.style.top = `${topPosition}px`;
            }
        }
    }

    handleKeyPress(key) {
        // 使用钢琴的键盘映射
        const fullNote = this.piano.getNoteFromKeyCode(key.toLowerCase());
        if (fullNote) {
            console.log(`按键 ${key.toUpperCase()} → 音符 ${fullNote}`);
            // 直接传入完整的音符(带八度)
            this.checkNoteHit(fullNote);
            this.piano.audio.playNote(fullNote); // 播放音符
        }
    }

    checkNoteHit(pressedNote) {
        const hitZoneTop = this.noteDropZone.offsetHeight - this.hitZoneHeight;
        let hit = false;

        console.log(`按下音符: ${pressedNote}, 当前下落音符数量: ${this.fallingNotes.length}`);

        // 检查是否有音符在命中区域内 - 找到最接近底部的匹配音符
        let closestNote = null;
        let closestDistance = Infinity;
        let closestIndex = -1;

        this.fallingNotes.forEach((fallingNote, index) => {
            const noteTop = parseInt(fallingNote.element.style.top);
            console.log(`音符 ${index}: fullNote=${fallingNote.fullNote}, note=${fallingNote.note}, 位置: ${noteTop}, 命中区域: ${hitZoneTop} - ${this.noteDropZone.offsetHeight}`);

            // 比较完整的音符名称(带八度)
            if (fallingNote.fullNote === pressedNote) {
                // 检查是否在命中区域内
                if (noteTop >= hitZoneTop - 50 && noteTop <= this.noteDropZone.offsetHeight + 20) {
                    const distance = Math.abs(noteTop - this.noteDropZone.offsetHeight + this.hitZoneHeight);
                    console.log(`找到匹配音符! fullNote=${fallingNote.fullNote}, 距离: ${distance}`);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestNote = fallingNote;
                        closestIndex = index;
                    }
                }
            }
        });

        // 如果找到了匹配的音符,立即移除
        if (closestNote) {
            console.log(`✓ 命中音符: ${closestNote.fullNote} at index ${closestIndex}`);
            this.handleHitNote(closestNote, closestIndex);
            hit = true;
        } else {
            console.log(`✗ 没有找到匹配的音符 ${pressedNote}`);
        }

        if (!hit) {
            // 没有命中，减少连击
            this.combo = 0;
            this.updateComboDisplay();
        }
    }

    handleHitNote(fallingNote, index) {
        console.log('🎯 handleHitNote called for:', fallingNote.fullNote, '键:', fallingNote.keyboardKey);

        // 获取元素引用
        const element = fallingNote.element;

        if (!element) {
            console.error('❌ 元素不存在!');
            return;
        }

        console.log('📍 当前元素位置:', element.style.top, element.style.left);

        // 立即从数组中移除,防止updateGame继续处理
        this.fallingNotes.splice(index, 1);
        console.log('✂️ 从数组中移除,剩余音符数:', this.fallingNotes.length);

        // 获取当前位置并固定
        const currentTop = element.style.top;
        const currentLeft = element.style.left;

        // 完全停止所有可能的更新
        element.style.animation = 'none';
        element.style.position = 'absolute';
        element.style.top = currentTop;
        element.style.left = currentLeft;

        // 立即添加炸裂动画
        element.classList.add('hit');
        element.style.pointerEvents = 'none';

        console.log('💥 添加hit类,开始炸裂动画');

        // 计算分数
        const baseScore = 100;
        const comboBonus = this.combo * 10;
        const totalScore = baseScore + comboBonus;

        this.score += totalScore;
        this.combo++;

        // 更新显示
        this.updateScoreDisplay();
        this.updateComboDisplay();

        // 显示连击效果
        this.showComboEffect();

        // 立即移除DOM元素
        setTimeout(() => {
            if (element && element.parentNode) {
                element.remove();
                console.log('🗑️ DOM元素已移除');
            } else {
                console.log('⚠️ 元素已经被移除或不存在');
            }
        }, 200);

        console.log(`✅ 命中成功! 音符: ${fallingNote.fullNote}, 分数: ${totalScore}, 连击: ${this.combo}`);
    }

    handleMissedNote(fallingNote) {
        // 播放错过效果
        fallingNote.element.classList.add('missed');
        
        // 减少生命值
        this.lives--;
        this.combo = 0;
        
        // 更新显示
        this.updateLivesDisplay();
        this.updateComboDisplay();
        
        // 检查游戏结束
        if (this.lives <= 0) {
            this.endGame(false);
        }
        
        // 延迟移除DOM元素
        setTimeout(() => {
            fallingNote.element.remove();
        }, 500);
        
        console.log(`错过音符: ${fallingNote.note}, 剩余生命: ${this.lives}`);
    }

    showComboEffect() {
        if (this.combo > 1) {
            const effect = document.createElement('div');
            effect.className = 'combo-effect';
            effect.textContent = `${this.combo} COMBO!`;
            this.noteDropZone.appendChild(effect);
            
            setTimeout(() => {
                effect.remove();
            }, 600);
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = `分数: ${this.score}`;
    }

    updateComboDisplay() {
        this.comboElement.textContent = `连击: ${this.combo}`;
    }

    updateLivesDisplay() {
        this.livesElement.textContent = `生命: ${this.lives}`;
    }

    playBackgroundMusic() {
        // 播放背景音乐(按照歌曲节奏自动演奏)
        this.noteSequence.forEach((noteData) => {
            setTimeout(() => {
                if (this.isPlaying) {
                    // 播放音符,使用C3作为基准
                    this.piano.audio.playNote(noteData.note + '3');
                }
            }, noteData.time);
        });
    }

    endGame(success) {
        this.stopGame();

        // 显示游戏结束弹窗
        this.showGameOverModal(success);
    }

    showGameOverModal(success) {
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        
        const content = document.createElement('div');
        content.className = 'game-over-content';
        
        content.innerHTML = `
            <h2>${success ? '恭喜完成！' : '游戏结束'}</h2>
            <div class="final-score">最终分数: ${this.score}</div>
            <div class="game-over-buttons">
                <button class="btn primary" onclick="this.closest('.game-over-modal').remove()">确定</button>
                <button class="btn secondary" onclick="location.reload()">重新开始</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 点击背景关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}
