import { publicSongs, getSongTitle } from '../data/song-library.mjs';

function locale() {
  return document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

export function populateSongSelects() {
  const currentLocale = locale();

  document.querySelectorAll('select#song-select').forEach((select) => {
    const selectedValue = select.value;
    const existing = new Set(Array.from(select.options).map((option) => option.value));

    for (const song of publicSongs) {
      if (existing.has(song.id)) continue;
      const option = document.createElement('option');
      option.value = song.id;
      option.textContent = getSongTitle(song, currentLocale);
      select.appendChild(option);
    }

    if (selectedValue) select.value = selectedValue;
  });
}
