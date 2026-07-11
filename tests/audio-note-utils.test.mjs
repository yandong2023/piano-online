import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nearestSampleNote,
  noteToMidi,
  playbackRateForNote,
  sampleUrl,
} from '../js/audio-note-utils.mjs';

test('converts note names to MIDI numbers', () => {
  assert.equal(noteToMidi('C4'), 60);
  assert.equal(noteToMidi('A4'), 69);
  assert.equal(noteToMidi('C#4'), 61);
});

test('selects a nearby natural-note sample for black keys', () => {
  assert.equal(nearestSampleNote('C#4'), 'C4');
  assert.equal(nearestSampleNote('F#5'), 'F5');
});

test('calculates equal-tempered playback rates', () => {
  assert.ok(Math.abs(playbackRateForNote('C#4', 'C4') - 2 ** (1 / 12)) < 1e-10);
  assert.equal(playbackRateForNote('C4', 'C4'), 1);
});

test('uses root-relative sample URLs for nested song pages', () => {
  assert.equal(sampleUrl('C4'), '/samples/piano-C4.mp3');
});
