// 导入所需的模块
import { songs } from './practice-songs.js';
import { Piano } from './piano.js';
import { PracticeMode } from './practice-mode.js';
import { PianoRecorder } from './recorder.js';

// 等待 DOM 完全加载
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    try {
        // 1. 首先初始化钢琴实例
        console.log('Initializing Piano...');
        const piano = new Piano();
        await piano.audio.init();
        console.log('Piano initialized');

        // 2. 初始化练习模式
        console.log('Initializing Practice Mode...');
        const practiceMode = new PracticeMode(piano);
        console.log('Practice Mode initialized');

        // 3. 初始化录音功能
        console.log('Initializing Recorder...');
        const recorder = new PianoRecorder(piano);
        console.log('Recorder initialized');

        // 4. 确保歌曲列表已加载
        console.log('Available songs:', Object.keys(songs));
        
        // 5. 初始化歌曲选择下拉列表
        const songSelect = document.getElementById('song-select');
        if (songSelect) {
            // 清空现有选项
            songSelect.innerHTML = '';
            
            // 添加默认选项
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '选择曲目...';
            songSelect.appendChild(defaultOption);
            
            // 按难度排序添加歌曲
            const sortedSongs = Object.entries(songs)
                .sort((a, b) => a[1].difficulty - b[1].difficulty);
            
            sortedSongs.forEach(([id, song]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${song.name} (难度: ${song.difficulty})`;
                songSelect.appendChild(option);
            });
            
            console.log('Song select initialized with', songSelect.options.length - 1, 'songs');
        } else {
            console.error('Song select element not found');
        }

    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
