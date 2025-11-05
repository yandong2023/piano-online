// 首次使用教程逻辑
export class Tutorial {
    constructor(piano) {
        this.piano = piano;
        this.hasSeenTutorial = localStorage.getItem('piano-tutorial-completed') === 'true';
        this.init();
    }

    init() {
        // 如果用户已经看过教程,不显示
        if (this.hasSeenTutorial) {
            return;
        }

        // 延迟显示教程,给页面加载时间
        setTimeout(() => {
            this.show();
        }, 1000);

        this.setupEventListeners();
    }

    show() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hide() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    complete() {
        localStorage.setItem('piano-tutorial-completed', 'true');
        this.hasSeenTutorial = true;
        this.hide();
    }

    setupEventListeners() {
        // 跳过按钮
        const skipButton = document.getElementById('tutorial-skip');
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                this.complete();
            });
        }

        // 开始体验按钮
        const startButton = document.getElementById('tutorial-start');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.complete();
            });
        }

        // 监听键盘按下 A 键
        const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'a' && !this.hasSeenTutorial) {
                // 用户按下了 A 键,显示成功提示
                const keyDemo = document.querySelector('.tutorial-key-demo');
                if (keyDemo) {
                    keyDemo.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                    keyDemo.textContent = '✓ 太棒了!';

                    // 2秒后自动关闭教程
                    setTimeout(() => {
                        this.complete();
                    }, 2000);
                }

                // 移除监听器,避免重复触发
                document.removeEventListener('keydown', handleKeyPress);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
    }

    // 提供一个方法让用户可以重新显示教程
    static resetTutorial() {
        localStorage.removeItem('piano-tutorial-completed');
        window.location.reload();
    }
}
