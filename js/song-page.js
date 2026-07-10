import { getSongById } from '../data/song-catalog.mjs';

window.addEventListener('load', () => {
    const songId = document.body.dataset.songId;
    const song = getSongById(songId);
    const select = document.getElementById('song-select');

    if (song && select) {
        select.value = songId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.querySelectorAll('[data-start-song]').forEach((button) => {
        button.addEventListener('click', () => {
            document.getElementById('practice-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => document.getElementById('start-practice')?.focus(), 450);

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'song_page_start', { song_id: songId });
            }
        });
    });

    if (typeof window.gtag === 'function') {
        window.gtag('event', 'song_page_view', { song_id: songId });
    }
});
