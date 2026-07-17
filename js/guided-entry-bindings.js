function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
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

function scrollToPractice() {
    document.querySelector('.practice-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

export function initializeGuidedEntryBindings() {
    const select = document.getElementById('song-select');
    const startButton = document.getElementById('start-practice');
    const section = document.querySelector('.practice-section');
    const isEnglish = document.documentElement.lang?.toLowerCase().startsWith('en');

    if (!select || !startButton || !section) return;

    startButton.textContent = isEnglish
        ? 'Step 2: Start guided practice'
        : '第 2 步：开始跟弹';

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

    document.querySelectorAll('[data-guided-song]').forEach((entry) => {
        if (entry.dataset.guidedEntryBound === 'true') return;
        entry.dataset.guidedEntryBound = 'true';

        entry.addEventListener('click', (event) => {
            event.preventDefault();
            const songId = entry.dataset.guidedSong;
            const optionExists = Array.from(select.options).some((option) => option.value === songId);
            if (!songId || !optionExists) return;

            select.value = songId;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            completeFirstVisitTutorial();
            scrollToPractice();

            track('guided_song_entry', {
                song_id: songId,
                source: entry.dataset.entrySource || 'unknown'
            });

            window.setTimeout(() => {
                startButton.click();
                section.classList.add('practice-active');
            }, 360);
        });
    });

    document.querySelectorAll('[data-free-play]').forEach((entry) => {
        if (entry.dataset.freePlayCompletionBound === 'true') return;
        entry.dataset.freePlayCompletionBound = 'true';
        entry.addEventListener('click', () => {
            completeFirstVisitTutorial();
        });
    });

    document.addEventListener('piano:practice-start', () => {
        section.classList.add('practice-active');
    });

    document.addEventListener('piano:practice-stop', () => {
        section.classList.remove('practice-active');
    });
}
