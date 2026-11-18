import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FULL_PIANO_RANGE,
  keyboardNotesBetween,
  fullKeyboardNotes,
  keyboardMapForFullRange,
  fullRangeForNote,
} from '../js/keyboard-range.mjs';
import { noteToMidi } from '../js/audio-note-utils.mjs';

// The existing computer layout covers every semitone from C3 to C6.
// These tests check the playable range independently of any DOM layout.
const baseMap = Object.fromEntries(keyboardNotesBetween(48, 84)
  .map(({ note }, index) => [`key-${index}`, note]));

test('full piano has exactly A0 through C8, including the partial lowest octave', () => {
  assert.deepEqual(FULL_PIANO_RANGE, { start: 21, end: 108 });
  const keys = fullKeyboardNotes();
  assert.equal(keys.length, 88);
  assert.equal(keys[0].note, 'A0');
  assert.equal(keys[1].note, 'A#0');
  assert.equal(keys[2].note, 'B0');
  assert.equal(keys.at(-1).note, 'C8');
  assert.equal(keys.filter(key => key.type === 'white').length, 52);
  assert.equal(keys.filter(key => key.type === 'black').length, 36);
  assert.deepEqual(keys.map(key => noteToMidi(key.note)),
    Array.from({ length: 88 }, (_, index) => index + 21));
});

test('inclusive MIDI ranges handle a single note, sharps and negative octave names', () => {
  assert.deepEqual(keyboardNotesBetween(21, 21), [{ note: 'A0', type: 'white' }]);
  assert.deepEqual(keyboardNotesBetween(22, 24), [
    { note: 'A#0', type: 'black' },
    { note: 'B0', type: 'white' },
    { note: 'C1', type: 'white' },
  ]);
  assert.equal(keyboardNotesBetween(0, 127)[0].note, 'C-1');
  assert.equal(keyboardNotesBetween(0, 127).at(-1).note, 'G9');
  for (const [start, end] of [[-1, 108], [21, 128], [22, 21], [21.5, 108], [21, NaN]]) {
    assert.throws(() => keyboardNotesBetween(start, end), `${start}–${end}`);
  }
});

test('computer octave banks preserve default shortcuts and cover every full piano note', () => {
  assert.deepEqual(keyboardMapForFullRange(baseMap, 3), baseMap);
  const lowest = keyboardMapForFullRange(baseMap, 0);
  const highest = keyboardMapForFullRange(baseMap, 5);
  assert.equal(Math.min(...Object.values(lowest).map(noteToMidi)), 21);
  assert.equal(Math.max(...Object.values(lowest).map(noteToMidi)), 48);
  assert.equal(Math.min(...Object.values(highest).map(noteToMidi)), 72);
  assert.equal(Math.max(...Object.values(highest).map(noteToMidi)), 108);
  const playable = new Set();
  for (let octave = 0; octave <= 5; octave++) {
    for (const note of Object.values(keyboardMapForFullRange(baseMap, octave))) {
      assert.ok(noteToMidi(note) >= 21 && noteToMidi(note) <= 108, note);
      playable.add(note);
    }
  }
  assert.equal(playable.size, 88);
});

test('guided notes select a playable bank and keep the current bank when it already works', () => {
  for (const { note } of fullKeyboardNotes()) {
    for (let current = 0; current <= 5; current++) {
      const next = fullRangeForNote(note, current);
      const currentNotes = Object.values(keyboardMapForFullRange(baseMap, current));
      assert.ok(Number.isInteger(next) && next >= 0 && next <= 5, `${note}: ${next}`);
      assert.ok(Object.values(keyboardMapForFullRange(baseMap, next)).includes(note), note);
      if (currentNotes.includes(note)) assert.equal(next, current, note);
    }
  }
});
