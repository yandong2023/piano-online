import { featuredSongs, getSongTitle } from '../data/song-library.mjs';

function locale() {
    return document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

function ensureStylesheet() {
    if (document.querySelector('link[href*="/css/song-pages.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/song-pages.css?v=20260711.7';
    document.head.appendChild(link);
}

function addLibraryNavigation(currentLocale) {
    const nav = document.querySelector('.nav-links');
    if (!nav || nav.querySelector('[data-song-library-link]')) return;

    const link = document.createElement('a');
    link.dataset.songLibraryLink = 'true';
    link.href = currentLocale === 'en' ? '/en/songs/' : '/songs/';
    link.textContent = currentLocale === 'en' ? 'Songs' : '曲库';

    const anchors = nav.querySelectorAll(':scope > a');
    if (anchors.length > 1) nav.insertBefore(link, anchors[1]);
    else nav.appendChild(link);
}

function songHref(song, currentLocale) {
    return currentLocale === 'en'
        ? `/en/songs/${song.slug}/`
        : `/songs/${song.slug}/`;
}

function addHomepageSongs(currentLocale) {
    const quickStart = document.getElementById('quick-start');
    if (!quickStart || document.querySelector('.song-library-section')) return;

    const section = document.createElement('section');
    section.className = 'song-library-section';
    section.innerHTML = `
        <div class="container">
            <div class="song-library-heading">
                <div>
                    <div class="section-kicker">${currentLocale === 'en' ? 'Start with a song' : '从一首歌开始'}</div>
                    <h2>${currentLocale === 'en' ? 'Popular beginner piano songs' : '适合新手的热门歌曲'}</h2>
                    <p>${currentLocale === 'en'
                        ? 'Open a song page, learn the keyboard letters, and start guided practice.'
                        : '进入歌曲独立页，查看按键字母并立即开始提示练习。'}</p>
                </div>
                <a class="song-library-all" href="${currentLocale === 'en' ? '/en/songs/' : '/songs/'}">
                    ${currentLocale === 'en' ? 'View all songs' : '查看全部歌曲'}
                </a>
            </div>
            <div class="song-card-grid">
                ${featuredSongs.slice(0, 5).map((song) => `
                    <a class="song-card" href="${songHref(song, currentLocale)}">
                        <span class="song-card-level">${currentLocale === 'en' ? `Level ${song.difficulty}` : `难度 ${song.difficulty}`}</span>
                        <h3>${getSongTitle(song, currentLocale)}</h3>
                        <p>${song.estimatedMinutes} ${currentLocale === 'en' ? 'min' : '分钟'} · ${song.notes.length} ${currentLocale === 'en' ? 'notes' : '个音符'}</p>
                        <span class="song-card-action">${currentLocale === 'en' ? 'Start learning →' : '开始学习 →'}</span>
                    </a>
                `).join('')}
            </div>
        </div>`;

    quickStart.insertAdjacentElement('afterend', section);
}

export function initializeSongDiscovery() {
    ensureStylesheet();
    const currentLocale = locale();
    addLibraryNavigation(currentLocale);
    addHomepageSongs(currentLocale);
}
