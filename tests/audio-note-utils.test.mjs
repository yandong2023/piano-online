import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  nearestSampleNote,
  noteToMidi,
  playbackRateForNote,
  sampleUrl,
  SAMPLE_NOTES,
  WARMUP_SAMPLE_NOTES,
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

test('all 88 piano pitches have a sample within one semitone', () => {
  assert.equal(SAMPLE_NOTES.length, 52);
  assert.equal(new Set(SAMPLE_NOTES).size, 52);
  assert.equal(SAMPLE_NOTES[0], 'A0');
  assert.equal(SAMPLE_NOTES.at(-1), 'C8');
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let midi = 21; midi <= 108; midi++) {
    const note = `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
    assert.ok(Math.abs(noteToMidi(nearestSampleNote(note)) - midi) <= 1, note);
  }
  assert.equal(nearestSampleNote('A0'), 'A0');
  assert.equal(nearestSampleNote('C8'), 'C8');
});

test('expanded samples do not increase the 19-note warmup budget', () => {
  assert.equal(WARMUP_SAMPLE_NOTES.length, 19);
  assert.equal(WARMUP_SAMPLE_NOTES[0], 'C3');
  assert.equal(WARMUP_SAMPLE_NOTES.at(-1), 'G5');
  assert.ok(WARMUP_SAMPLE_NOTES.every(note => noteToMidi(note) >= 48 && noteToMidi(note) <= 79));
});

test('every declared piano sample is shipped with its verified source checksum', () => {
  const manifest = readFileSync(new URL('../samples/SHA256SUMS', import.meta.url), 'utf8');
  const checksums = new Map(manifest.trim().split('\n').map(line => {
    const [hash, name] = line.split(/\s+/);
    return [name, hash];
  }));
  assert.equal(checksums.size, 52);
  for (const note of SAMPLE_NOTES) {
    const name = `piano-${note}.mp3`;
    const bytes = readFileSync(new URL(`../samples/${name}`, import.meta.url));
    assert.ok(bytes.length > 1000, `${name} is not a placeholder`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), checksums.get(name), name);
  }
});
