import { getSongById } from '../data/song-library.mjs';
import { initializeScoreViewer } from './score-viewer.js';

const songId = document.body.dataset.songId;
const song = getSongById(songId);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    practiceSection?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    syncSelectedSong();
    if (startButton && !startButton.disabled) startButton.click();
    practiceSection?.focus({ preventScroll: true });
    if (typeof window.gtag === 'function') window.gtag('event', 'song_page_start', { song_id: songId });
}

function initializeKeyPreview() {
    const preview = document.getElementById('keyboard-notes');
    if (!preview) return;
    const reveal = () => {
        preview.style.display = 'block';
        preview.tabIndex = -1;
        preview.focus({ preventScroll: true });
    };
    document.querySelectorAll('a[href="#keyboard-notes"]').forEach(link => {
        // Legacy song HTML has a root <base>. Resolve this anchor against the
        // actual song URL so normal clicks and opening a new tab stay on this song.
        const target = new URL(location.href);
        target.hash = 'keyboard-notes';
        link.href = target.href;
        link.dataset.viewKeys = '';
        link.addEventListener('click', reveal);
    });
    if (location.hash === '#keyboard-notes') {
        reveal();
        requestAnimationFrame(() => preview.scrollIntoView({ block: 'start' }));
    }
}

function syncStatusPanel() {
    const panel = document.querySelector('.song-practice-shell .practice-status-panel');
    if (!panel) return;
    const active = Array.from(panel.children).some(element => window.getComputedStyle(element).display !== 'none');
    panel.classList.toggle('is-active', active);
    panel.closest('.practice-layout')?.classList.toggle('has-active-status', active);
}

function bindLetterNotesCopy() {
    const lang = document.documentElement.lang || '';
    const copiedLabel = lang === 'zh-Hant' ? '已複製' : lang.startsWith('zh') ? '已复制' : 'Copied';
    document.querySelectorAll('[data-copy-target]').forEach((button) => {
        button.addEventListener('click', async () => {
            const target = document.getElementById(button.dataset.copyTarget);
            if (!target) return;
            let copied = false;
            const text = target.dataset.copyText ?? target.textContent;
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    copied = true;
                } catch { /* fall through to the selection fallback */ }
            }
            if (!copied) {
                const range = document.createRange();
                range.selectNodeContents(target);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                copied = document.execCommand('copy');
                selection.removeAllRanges();
            }
            if (!copied) return;
            const original = button.textContent;
            button.textContent = copiedLabel;
            setTimeout(() => { button.textContent = original; }, 2000);
            if (typeof window.gtag === 'function') window.gtag('event', 'letter_notes_copy', { song_id: songId, format: button.dataset.copyFormat });
        });
    });
}

function initializeSongPage() {
    syncSelectedSong();
    initializeKeyPreview();
    document.querySelectorAll('[data-start-song]').forEach(button => button.addEventListener('click', startGuidedPractice));
    const panel = document.querySelector('.song-practice-shell .practice-status-panel');
    if (panel) {
        syncStatusPanel();
        const observer = new MutationObserver(syncStatusPanel);
        observer.observe(panel, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
    }
    initializeScoreViewer(songId, { locale: document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en' });
    const scorePanel = document.querySelector('.studio-score');
    document.getElementById('song-select')?.addEventListener('change', (event) => {
        if (scorePanel) scorePanel.hidden = event.target.value !== songId;
    });
    if (typeof window.gtag === 'function') window.gtag('event', 'song_page_view', { song_id: songId });
}

bindLetterNotesCopy();

if (document.querySelector('[data-studio]') && !window.pianoPracticeMode) {
    document.addEventListener('piano:ready', initializeSongPage, { once: true });
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSongPage, { once: true });
} else {
    initializeSongPage();
}
