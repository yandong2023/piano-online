const FULLSCREEN_STYLESHEET = '/css/guided-practice-fullscreen.css?v=20260718.1';

function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
    }
}

function ensureFullscreenStylesheet() {
    if (document.querySelector('link[data-guided-fullscreen-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FULLSCREEN_STYLESHEET;
    link.dataset.guidedFullscreenStyles = 'true';
    document.head.appendChild(link);
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

async function requestFullscreen(element) {
    if (typeof element.requestFullscreen === 'function') {
        return element.requestFullscreen({ navigationUI: 'hide' });
    }
    if (typeof element.webkitRequestFullscreen === 'function') {
        return element.webkitRequestFullscreen();
    }
    throw new Error('Fullscreen API unavailable');
}

async function exitNativeFullscreen() {
    if (typeof document.exitFullscreen === 'function') {
        return document.exitFullscreen();
    }
    if (typeof document.webkitExitFullscreen === 'function') {
        return document.webkitExitFullscreen();
    }
}

function completeFirstVisitTutorial() {
    try {
        localStorage.setItem('piano-tutorial-completed', 'true');
    } catch {
        // Continue even when storage is unavailable.
    }

    if (typeof window.pianoTutorial?.complete === 'function') {
        window.pianoTutorial.complete();
        return;
    }

    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
}

function scrollToPractice(section, behavior = 'smooth') {
    section.scrollIntoView({ behavior, block: 'start' });
}

function setDocumentFocusLock(enabled) {
    document.body.classList.toggle('guided-focus-lock', enabled);
}

function clearFallbackFocus(section) {
    section.classList.remove('guided-focus-fallback');
    if (!getFullscreenElement()) {
        section.classList.remove('guided-focus-active');
        setDocumentFocusLock(false);
    }
}

async function exitGuidedFocus(section) {
    clearFallbackFocus(section);
    if (getFullscreenElement()) {
        try {
            await exitNativeFullscreen();
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    }
}

async function enterGuidedFocus(section, source) {
    if (section.classList.contains('guided-focus-active') || getFullscreenElement()) {
        return { mode: getFullscreenElement() ? 'fullscreen' : 'focus-fallback' };
    }

    section.classList.add('guided-focus-active');

    try {
        await requestFullscreen(section);
        setDocumentFocusLock(false);
        track('guided_fullscreen_result', { mode: 'fullscreen', source });
        return { mode: 'fullscreen' };
    } catch (error) {
        section.classList.add('guided-focus-fallback');
        setDocumentFocusLock(true);
        scrollToPractice(section, 'auto');
        track('guided_fullscreen_result', { mode: 'focus_fallback', source });
        return { mode: 'focus-fallback', error };
    }
}

function createFocusToolbar({ section, select, stopButton, isEnglish }) {
    const container = section.querySelector(':scope > .container');
    if (!container) return null;

    let toolbar = container.querySelector('.guided-focus-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'guided-focus-toolbar';
        toolbar.innerHTML = `
            <div class="guided-focus-song">
                <span>${isEnglish ? 'GUIDED PRACTICE' : '提示练习'}</span>
                <strong data-focus-song-title></strong>
            </div>
            <div class="guided-focus-help">${isEnglish ? 'Follow the highlighted computer key' : '看提示，按下高亮的电脑键'}</div>
            <div class="guided-focus-actions">
                <button type="button" class="guided-focus-stop">${isEnglish ? 'Stop practice' : '停止练习'}</button>
                <button type="button" class="guided-focus-exit">${isEnglish ? 'Exit full screen' : '退出全屏'}</button>
            </div>`;
        container.prepend(toolbar);
    }

    const updateSongTitle = () => {
        const title = toolbar.querySelector('[data-focus-song-title]');
        if (title) title.textContent = select.selectedOptions?.[0]?.textContent || '';
    };

    select.addEventListener('change', updateSongTitle);
    updateSongTitle();

    toolbar.querySelector('.guided-focus-stop')?.addEventListener('click', () => {
        stopButton?.click();
        exitGuidedFocus(section);
    });

    toolbar.querySelector('.guided-focus-exit')?.addEventListener('click', () => {
        exitGuidedFocus(section);
    });

    return toolbar;
}

export function initializeGuidedEntryBindings() {
    if (!document.querySelector('.hero-home')) return;

    const select = document.getElementById('song-select');
    const startButton = document.getElementById('start-practice');
    const stopButton = document.getElementById('stop-practice');
    const fullscreenButton = document.getElementById('toggle-fullscreen');
    const primaryActions = document.querySelector('.practice-primary-actions');
    const section = document.querySelector('.practice-section');
    const isEnglish = document.documentElement.lang?.toLowerCase().startsWith('en');

    if (!select || !startButton || !section) return;

    ensureFullscreenStylesheet();
    createFocusToolbar({ section, select, stopButton, isEnglish });

    startButton.textContent = isEnglish
        ? 'Step 2: Start guided practice'
        : '第 2 步：开始跟弹';

    if (fullscreenButton && primaryActions && fullscreenButton.parentElement !== primaryActions) {
        fullscreenButton.textContent = isEnglish ? 'Full screen' : '全屏演奏';
        fullscreenButton.classList.add('guided-visible-fullscreen');
        primaryActions.append(fullscreenButton);
    }

    if (select.value) {
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const updateSelectedSongLabel = () => {
        const label = document.querySelector('[data-selected-song-label]');
        if (!label) return;
        const prefix = isEnglish ? 'Selected song: ' : '当前歌曲：';
        label.textContent = `${prefix}${select.selectedOptions?.[0]?.textContent || ''}`;
    };

    select.addEventListener('change', updateSelectedSongLabel);
    updateSelectedSongLabel();

    let guidedEntryStarting = false;

    document.querySelectorAll('[data-guided-song]').forEach((entry) => {
        if (entry.dataset.guidedEntryBound === 'true') return;
        entry.dataset.guidedEntryBound = 'true';

        entry.addEventListener('click', (event) => {
            event.preventDefault();
            const songId = entry.dataset.guidedSong;
            const source = entry.dataset.entrySource || 'unknown';
            const optionExists = Array.from(select.options).some((option) => option.value === songId);
            if (!songId || !optionExists) return;

            select.value = songId;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            completeFirstVisitTutorial();

            track('guided_song_entry', { song_id: songId, source });

            guidedEntryStarting = true;
            void enterGuidedFocus(section, source);
            startButton.click();
            section.classList.add('practice-active');
            guidedEntryStarting = false;
        });
    });

    startButton.addEventListener('click', () => {
        if (guidedEntryStarting || section.classList.contains('guided-focus-active')) return;
        void enterGuidedFocus(section, 'practice-start-button');
    });

    document.querySelectorAll('[data-free-play]').forEach((entry) => {
        if (entry.dataset.freePlayCompletionBound === 'true') return;
        entry.dataset.freePlayCompletionBound = 'true';
        entry.addEventListener('click', () => {
            completeFirstVisitTutorial();
        });
    });

    const syncFullscreenState = () => {
        const active = getFullscreenElement() === section;
        section.classList.toggle('guided-focus-active', active || section.classList.contains('guided-focus-fallback'));
        if (!active && !section.classList.contains('guided-focus-fallback')) {
            setDocumentFocusLock(false);
        }
        if (fullscreenButton) {
            fullscreenButton.textContent = active
                ? (isEnglish ? 'Exit full screen' : '退出全屏')
                : (isEnglish ? 'Full screen' : '全屏演奏');
        }
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState);

    document.addEventListener('piano:practice-start', () => {
        section.classList.add('practice-active');
    });

    document.addEventListener('piano:practice-stop', () => {
        section.classList.remove('practice-active');
        void exitGuidedFocus(section);
    });

    document.addEventListener('piano:practice-progress', (event) => {
        if (event.detail?.completed) {
            void exitGuidedFocus(section);
        }
    });
}
