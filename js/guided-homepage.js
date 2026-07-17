const DEFAULT_GUIDED_SONG = 'happy-birthday';

const copy = {
    zh: {
        tutorialBadge: '第一次来？',
        tutorialTitle: '先跟着提示，弹完你的第一首歌',
        tutorialDescription: '不用识谱。页面会逐个告诉你下一步该按哪个电脑键。',
        tutorialSong: '推荐：《生日快乐》',
        tutorialSongMeta: '约 1 分钟 · 熟悉旋律 · 适合第一次体验',
        tutorialStart: '开始第一首歌',
        tutorialFree: '我先自由弹',
        heroEyebrow: '不会识谱也能开始',
        heroTitle: '跟着按键提示，弹完你的<span class="hero-accent">第一首歌。</span>',
        heroDescription: '选择一首熟悉的旋律，页面会高亮下一个电脑按键。你只需要跟着按，就能一步步弹完整首歌。',
        heroPrimary: '跟着《生日快乐》弹',
        heroSecondary: '我想自由弹奏',
        heroNote: '新手推荐：先体验提示练习，再探索自由弹奏和节奏模式。',
        visualNow: '新手第一首歌',
        visualSong: '生日快乐',
        visualPrompt: '下一步按',
        cardKicker: '新手推荐 · 约 1 分钟',
        cardTitle: '不要只试几个琴键，先弹完一首熟悉的歌',
        cardDescription: '系统会告诉你下一个按哪个键，并自动记录进度。弹错也不会中断，继续跟着提示即可。',
        cardPrimary: '立即跟弹《生日快乐》',
        cardSecondary: '先自由弹奏',
        stepOne: '选一首歌',
        stepOneDescription: '已经为你选好《生日快乐》',
        stepTwo: '点击开始',
        stepTwoDescription: '页面会显示下一个电脑按键',
        stepThree: '跟着亮键弹',
        stepThreeDescription: '按对后自动进入下一个音',
        chooseLabel: '第 1 步：选择要练习的歌曲',
        chooseHint: '第一次建议从《生日快乐》开始',
        startButton: '第 2 步：开始跟弹',
        moreSummary: '自由弹奏与更多玩法',
        emptyTitle: '歌曲已经选好',
        emptyDescription: '点击“开始跟弹”，这里会显示下一个要按的电脑键。',
        selectedPrefix: '当前歌曲：'
    },
    en: {
        tutorialBadge: 'First time here?',
        tutorialTitle: 'Follow the prompts and finish your first song',
        tutorialDescription: 'No sheet music required. We show you the next computer key one note at a time.',
        tutorialSong: 'Recommended: Happy Birthday',
        tutorialSongMeta: 'About 1 minute · Familiar melody · Beginner friendly',
        tutorialStart: 'Start my first song',
        tutorialFree: 'Free play first',
        heroEyebrow: 'NO SHEET MUSIC REQUIRED',
        heroTitle: 'Follow the key prompts and finish your <span class="hero-accent">first song.</span>',
        heroDescription: 'Choose a familiar melody and follow the highlighted computer key. One note at a time, you can play the whole song.',
        heroPrimary: 'Play Happy Birthday with prompts',
        heroSecondary: 'I want free play',
        heroNote: 'Recommended for beginners: try guided practice before rhythm mode or free play.',
        visualNow: 'Your first guided song',
        visualSong: 'Happy Birthday',
        visualPrompt: 'Next key',
        cardKicker: 'BEGINNER PICK · ABOUT 1 MINUTE',
        cardTitle: 'Do more than test a few keys — finish a familiar song',
        cardDescription: 'We show the next key and track your progress. A wrong note will not stop the lesson; simply follow the next prompt.',
        cardPrimary: 'Start Happy Birthday',
        cardSecondary: 'Free play first',
        stepOne: 'Choose a song',
        stepOneDescription: 'Happy Birthday is ready for you',
        stepTwo: 'Press start',
        stepTwoDescription: 'The next computer key appears',
        stepThree: 'Follow the highlight',
        stepThreeDescription: 'Each correct note moves you forward',
        chooseLabel: 'Step 1: Choose a song',
        chooseHint: 'Happy Birthday is recommended for your first try',
        startButton: 'Step 2: Start guided practice',
        moreSummary: 'Free play and more modes',
        emptyTitle: 'Your song is ready',
        emptyDescription: 'Press “Start guided practice” and the next computer key will appear here.',
        selectedPrefix: 'Selected song: '
    }
};

function getLocale() {
    return document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

function ensureStylesheet() {
    if (document.querySelector('link[data-guided-homepage-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/guided-homepage.css?v=20260717.1';
    link.dataset.guidedHomepageStyles = 'true';
    document.head.appendChild(link);
}

function setText(element, value) {
    if (element) element.textContent = value;
}

function updateTutorial(strings) {
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
        <div class="tutorial-content guided-tutorial-content">
            <span class="guided-tutorial-badge">${strings.tutorialBadge}</span>
            <h2>${strings.tutorialTitle}</h2>
            <p class="guided-tutorial-description">${strings.tutorialDescription}</p>
            <div class="guided-tutorial-steps" aria-label="Three steps">
                <span><b>1</b>${strings.stepOne}</span>
                <span><b>2</b>${strings.stepTwo}</span>
                <span><b>3</b>${strings.stepThree}</span>
            </div>
            <div class="guided-tutorial-song">
                <strong>${strings.tutorialSong}</strong>
                <span>${strings.tutorialSongMeta}</span>
            </div>
            <div class="tutorial-buttons guided-tutorial-buttons">
                <button class="tutorial-start" id="tutorial-start" data-guided-song="${DEFAULT_GUIDED_SONG}" data-entry-source="first-visit-modal">${strings.tutorialStart}</button>
                <button class="tutorial-skip" id="tutorial-skip" data-free-play="true" data-entry-source="first-visit-modal">${strings.tutorialFree}</button>
            </div>
        </div>`;
}

function updateHero(strings) {
    const hero = document.querySelector('.hero-home');
    if (!hero) return;

    setText(hero.querySelector('.hero-eyebrow'), strings.heroEyebrow);
    const title = hero.querySelector('h1');
    if (title) title.innerHTML = strings.heroTitle;
    setText(hero.querySelector('.hero-subtitle'), strings.heroDescription);

    const primary = hero.querySelector('#hero-start-fullscreen');
    if (primary) {
        primary.textContent = strings.heroPrimary;
        primary.dataset.guidedSong = DEFAULT_GUIDED_SONG;
        primary.dataset.entrySource = 'hero-primary';
        primary.removeAttribute('aria-label');
    }

    const secondary = hero.querySelector('.hero-text-link');
    if (secondary) {
        secondary.innerHTML = `${strings.heroSecondary} <span aria-hidden="true">→</span>`;
        secondary.href = '#practice-start';
        secondary.dataset.freePlay = 'true';
        secondary.dataset.entrySource = 'hero-secondary';
    }

    if (!hero.querySelector('.hero-guided-note')) {
        const note = document.createElement('p');
        note.className = 'hero-guided-note';
        note.textContent = strings.heroNote;
        hero.querySelector('.hero-cta')?.insertAdjacentElement('afterend', note);
    }

    setText(hero.querySelector('.concert-now-playing'), strings.visualNow);
    setText(hero.querySelector('.concert-song-title'), strings.visualSong);
    setText(hero.querySelector('.concert-prompt span'), strings.visualPrompt);
}

function createGuidedStartCard(strings) {
    const section = document.querySelector('.practice-section');
    const intro = section?.querySelector('.section-intro');
    if (!section || !intro || section.querySelector('.guided-start-card')) return;

    const card = document.createElement('div');
    card.className = 'guided-start-card';
    card.innerHTML = `
        <div class="guided-start-copy">
            <span class="guided-start-kicker">${strings.cardKicker}</span>
            <h3>${strings.cardTitle}</h3>
            <p>${strings.cardDescription}</p>
        </div>
        <div class="guided-start-actions">
            <button type="button" class="btn primary" data-guided-song="${DEFAULT_GUIDED_SONG}" data-entry-source="practice-recommendation">${strings.cardPrimary}</button>
            <button type="button" class="btn secondary" data-free-play="true" data-entry-source="practice-recommendation">${strings.cardSecondary}</button>
        </div>
        <div class="guided-start-steps">
            <div><span>1</span><strong>${strings.stepOne}</strong><small>${strings.stepOneDescription}</small></div>
            <div><span>2</span><strong>${strings.stepTwo}</strong><small>${strings.stepTwoDescription}</small></div>
            <div><span>3</span><strong>${strings.stepThree}</strong><small>${strings.stepThreeDescription}</small></div>
        </div>`;

    intro.insertAdjacentElement('afterend', card);
}

function restructurePracticeControls(strings) {
    const section = document.querySelector('.practice-section');
    const controls = section?.querySelector('.practice-controls');
    const selectContainer = controls?.querySelector('.song-select-container');
    const select = controls?.querySelector('#song-select');
    const startButton = controls?.querySelector('#start-practice');
    const stopButton = controls?.querySelector('#stop-practice');
    const controlRow = controls?.querySelector('.control-row');
    const buttons = controls?.querySelector('.practice-buttons');
    const startGame = controls?.querySelector('#start-rhythm-game');
    const stopGame = controls?.querySelector('#stop-rhythm-game');
    const fullscreen = controls?.querySelector('#toggle-fullscreen');

    if (!controls || !selectContainer || !select || !startButton || controls.dataset.guidedReady === 'true') return;
    controls.dataset.guidedReady = 'true';
    select.value = DEFAULT_GUIDED_SONG;

    const header = document.createElement('div');
    header.className = 'practice-path-header';
    header.innerHTML = `<span>1</span><div><strong>${strings.chooseLabel}</strong><small>${strings.chooseHint}</small></div>`;
    selectContainer.prepend(header);

    const primaryActions = document.createElement('div');
    primaryActions.className = 'practice-primary-actions';
    startButton.textContent = strings.startButton;
    primaryActions.append(startButton);
    if (stopButton) primaryActions.append(stopButton);
    selectContainer.insertAdjacentElement('afterend', primaryActions);

    const details = document.createElement('details');
    details.className = 'practice-more-options';
    const summary = document.createElement('summary');
    summary.textContent = strings.moreSummary;
    const body = document.createElement('div');
    body.className = 'practice-more-options-body';
    details.append(summary, body);

    if (controlRow) body.append(controlRow);
    if (buttons) {
        buttons.classList.add('practice-secondary-buttons');
        [startGame, stopGame, fullscreen].forEach((button) => {
            if (button) buttons.append(button);
        });
        body.append(buttons);
    }
    controls.append(details);

    const statusPanel = section.querySelector('.practice-status-panel');
    if (statusPanel && !statusPanel.querySelector('[data-practice-empty-state]')) {
        const emptyState = document.createElement('div');
        emptyState.className = 'practice-empty-state';
        emptyState.dataset.practiceEmptyState = 'true';
        emptyState.innerHTML = `
            <span class="practice-empty-icon" aria-hidden="true">🎵</span>
            <strong>${strings.emptyTitle}</strong>
            <p>${strings.emptyDescription}</p>
            <small data-selected-song-label>${strings.selectedPrefix}${select.selectedOptions[0]?.textContent || ''}</small>`;
        statusPanel.prepend(emptyState);
    }
}

function setupFreePlayEntries() {
    document.querySelectorAll('[data-free-play]').forEach((element) => {
        if (element.dataset.freePlayBound === 'true') return;
        element.dataset.freePlayBound = 'true';
        element.addEventListener('click', (event) => {
            event.preventDefault();
            document.getElementById('tutorial-overlay')?.style.setProperty('display', 'none');
            document.querySelector('.practice-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'free_play_entry', {
                    source: element.dataset.entrySource || 'unknown'
                });
            }
        });
    });
}

export function initializeGuidedHomepage() {
    if (!document.querySelector('.hero-home') || document.documentElement.dataset.guidedHomepage === 'true') return;
    document.documentElement.dataset.guidedHomepage = 'true';

    const strings = copy[getLocale()];
    ensureStylesheet();
    updateTutorial(strings);
    updateHero(strings);
    createGuidedStartCard(strings);
    restructurePracticeControls(strings);
    setupFreePlayEntries();
}
