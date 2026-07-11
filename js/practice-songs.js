import { songs as librarySongs, calculateScore } from '../data/song-library.mjs';

const flatToSharp = Object.freeze({
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
});

function normalizeNote(note) {
  return String(note).replace(/^([A-G]b)(-?\d+)$/, (_, name, octave) => `${flatToSharp[name] || name}${octave}`);
}

export const songs = Object.fromEntries(
  Object.entries(librarySongs).map(([id, song]) => [
    id,
    { ...song, notes: song.notes.map(normalizeNote) }
  ])
);

export { calculateScore };
