import { getSongById } from '../data/song-library.mjs';

const songId = document.body.dataset.songId;
const song = getSongById(songId);

function syncSelectedSong() {
    const select = document.getElementById('song-select');
    if (!song || !select) return false;

    select.value = songId;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

function startGuidedPractice() {
    const practiceSection = document.getElementById('practice-start');
    const startButton = document.getElementById('start-practice');

    practiceSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    syncSelectedSong();

    window.setTimeout(() => {
        syncSelectedSong();

        if (startButton && !startButton.disabled) {
            startButton.click();
        } else {
            startButton?.focus();
        }
    }, 420);

    if (typeof window.gtag === 'function') {
        window.gtag('event', 'song_page_start', { song_id: songId });
    }
}

function syncStatusPanel() {
    const panel = document.querySelector('.song-practice-shell .practice-status-panel');
    if (!panel) return;

    const active = Array.from(panel.children).some((element) => {
        return window.getComputedStyle(element).display !== 'none';
    });

    panel.classList.toggle('is-active', active);
}

function initializeSongPage() {
    syncSelectedSong();
    window.setTimeout(syncSelectedSong, 100);
    window.setTimeout(syncSelectedSong, 500);

    document.querySelectorAll('[data-start-song]').forEach((button) => {
        button.addEventListener('click', startGuidedPractice);
    });

    const panel = document.querySelector('.song-practice-shell .practice-status-panel');
    if (panel) {
        syncStatusPanel();
        const observer = new MutationObserver(syncStatusPanel);
        observer.observe(panel, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'class']
        });
    }

    if (typeof window.gtag === 'function') {
        window.gtag('event', 'song_page_view', { song_id: songId });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSongPage, { once: true });
} else {
    initializeSongPage();
}
