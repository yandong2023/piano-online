import assert from 'node:assert/strict';
import test from 'node:test';
import { songs } from '../data/song-library.mjs';
import { flattenScorePitches, scoreSongs } from '../data/song-scores.mjs';

const durationUnits = Object.freeze({
  '8': 1,
  q: 2,
  h: 4,
  w: 8
});

const flatToSharp = Object.freeze({
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#'
});

function normalizePitch(pitch) {
  return String(pitch).replace(/^([A-G]b)(-?\d+)$/, (_, name, octave) => `${flatToSharp[name] || name}${octave}`);
}

test('interactive score catalog now covers fifteen songs', () => {
  assert.equal(Object.keys(scoreSongs).length, 15);
});

test('every score follows the exact practice-note order', () => {
  for (const songId of Object.keys(scoreSongs)) {
    const song = songs[songId];
    assert.ok(song, `missing practice song ${songId}`);

    const expected = song.notes.map(normalizePitch);
    const actual = flattenScorePitches(songId).map(normalizePitch);
    assert.deepEqual(actual, expected, `${songId} score and practice notes differ`);
  }
});

test('every simplified measure has a complete time-signature duration', () => {
  for (const [songId, score] of Object.entries(scoreSongs)) {
    assert.equal(score.arrangement, 'simplified-beginner');
    const expectedUnits = score.timeSignature.beats * (8 / score.timeSignature.beatType);

    score.measures.forEach((measure, index) => {
      const actualUnits = measure.reduce((total, event) => {
        assert.match(event.pitch, /^[A-G](?:#|b)?-?\d+$/);
        assert.ok(durationUnits[event.duration], `${songId} has invalid duration ${event.duration}`);
        return total + durationUnits[event.duration];
      }, 0);

      assert.equal(actualUnits, expectedUnits, `${songId} measure ${index + 1} is incomplete`);
    });
  }
});

test('second score batch includes beginner and classical priorities', () => {
  for (const songId of [
    'two-tigers',
    'mary-lamb',
    'hot-cross-buns',
    'old-macdonald',
    'row-boat',
    'london-bridge',
    'brahms-lullaby',
    'minuet-in-g',
    'we-wish-you',
    'deck-the-halls'
  ]) {
    assert.ok(scoreSongs[songId], `missing second-batch score ${songId}`);
  }
});
