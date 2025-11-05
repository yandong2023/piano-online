// 导入所需的模块
import { Piano } from './piano.js';
import { PracticeMode } from './practice-mode.js';
import { PianoRecorder } from './recorder.js';
import { RhythmGame } from './rhythm-game.js';
import { Tutorial } from './tutorial.js';

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

        // 4. 初始化节奏大师游戏
        console.log('Initializing Rhythm Game...');
        const rhythmGame = new RhythmGame(piano);
        console.log('Rhythm Game initialized');

        // 5. 初始化首次使用教程
        console.log('Initializing Tutorial...');
        const tutorial = new Tutorial(piano);
        console.log('Tutorial initialized');

        // 等待首次交互恢复音频上下文
        const resumeAudio = async () => {
            if (piano?.audio?.context?.state === 'suspended') {
                try {
                    await piano.audio.context.resume();
                    console.log('AudioContext resumed successfully');
                } catch (error) {
                    console.error('Failed to resume AudioContext:', error);
                }
            }
        };
        ['click', 'keydown', 'touchstart'].forEach(event => {
            document.addEventListener(event, resumeAudio, { once: true });
        });

        // 页面卸载时释放资源
        window.addEventListener('beforeunload', () => {
            recorder?.dispose();
            if (piano?.audio?.context) {
                piano.audio.context.close();
            }
        });

        // 将 tutorial 暴露到全局,方便调试
        window.pianoTutorial = tutorial;

        console.log('All components initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
