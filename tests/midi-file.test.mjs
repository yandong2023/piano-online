import assert from 'node:assert/strict';
import test from 'node:test';
import { midiNumberToNote, parseMidi, timelineMs } from '../js/midi-file.mjs';

function midiBytes(track) {
  const header = [0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, 0x01, 0xe0];
  const length = track.length;
  return Uint8Array.from([
    ...header,
    0x4d, 0x54, 0x72, 0x6b,
    (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff,
    ...track
  ]);
}

test('maps MIDI note 60 to middle C', () => {
  assert.equal(midiNumberToNote(60), 'C4');
  assert.equal(midiNumberToNote(61), 'C#4');
});

test('reads a note that uses running status and default tempo', () => {
  const bytes = midiBytes([
    0x00, 0x90, 0x3c, 0x64,
    0x83, 0x60, 0x3c, 0x00,
    0x00, 0xff, 0x2f, 0x00
  ]);
  const parsed = parseMidi(bytes);
  const timed = timelineMs(parsed.events, parsed.division);
  assert.equal(parsed.division, 480);
  assert.deepEqual(timed.map((event) => [event.type, event.note, event.ms]), [
    ['on', 60, 0],
    ['off', 60, 500]
  ]);
});

test('rejects a file that is not MIDI', () => {
  assert.throws(() => parseMidi(Uint8Array.from([1, 2, 3, 4])), /not a MIDI file/);
});
