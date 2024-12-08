// 导入所需的模块
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

        console.log('All components initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
