// 首次使用教程逻辑
export class Tutorial {
    constructor(piano) {
        this.piano = piano;
        this.hasSeenTutorial = localStorage.getItem('piano-tutorial-completed') === 'true';
        this.init();
    }

    init() {
        if (this.hasSeenTutorial) return;

        window.setTimeout(() => {
            this.show();
        }, 700);

        this.setupEventListeners();
    }

    show() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hide() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    complete() {
        localStorage.setItem('piano-tutorial-completed', 'true');
        this.hasSeenTutorial = true;
        this.hide();
    }

    setupEventListeners() {
        const freePlayButton = document.getElementById('tutorial-skip');
        freePlayButton?.addEventListener('click', () => {
            this.complete();
        });

        const guidedStartButton = document.getElementById('tutorial-start');
        guidedStartButton?.addEventListener('click', () => {
            this.complete();
        });
    }

    static resetTutorial() {
        localStorage.removeItem('piano-tutorial-completed');
        window.location.reload();
    }
}
