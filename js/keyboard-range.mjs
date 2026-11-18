import { noteToMidi } from './audio-note-utils.mjs';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FULL_PIANO_RANGE = Object.freeze({ start: 21, end: 108 });

export function keyboardNotesBetween(startMidi, endMidi) {
  if (!Number.isInteger(startMidi) || !Number.isInteger(endMidi)
    || startMidi < 0 || endMidi > 127 || startMidi > endMidi) {
    throw new RangeError('Expected an inclusive MIDI range between 0 and 127.');
  }
  return Array.from({ length: endMidi - startMidi + 1 }, (_, offset) => {
    const midi = startMidi + offset;
    const name = NAMES[midi % 12];
    return { note: `${name}${Math.floor(midi / 12) - 1}`, type: name.includes('#') ? 'black' : 'white' };
  });
}

export function keyboardNotes(startOctave = 3, octaves = 3) {
  const start = (startOctave + 1) * 12;
  return keyboardNotesBetween(start, start + octaves * 12);
}

export function fullKeyboardNotes() {
  return keyboardNotesBetween(FULL_PIANO_RANGE.start, FULL_PIANO_RANGE.end);
}

export function keyboardMapForFullRange(baseMap, startOctave) {
  const octave = Math.max(0, Math.min(5, Math.trunc(startOctave)));
  return Object.fromEntries(Object.entries(baseMap).map(([key, note]) => {
    const midi = noteToMidi(note) + (octave - 3) * 12;
    const shifted = `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
    return [key, shifted, midi];
  }).filter(([, , midi]) => midi >= FULL_PIANO_RANGE.start && midi <= FULL_PIANO_RANGE.end)
    .map(([key, note]) => [key, note]));
}

export function fullRangeForNote(note, startOctave) {
  const midi = noteToMidi(note);
  if (!Number.isFinite(midi) || midi < FULL_PIANO_RANGE.start || midi > FULL_PIANO_RANGE.end) return startOctave;
  if (midi >= (startOctave + 1) * 12 && midi <= (startOctave + 4) * 12) return startOctave;
  return Math.max(0, Math.min(5, Math.floor(midi / 12) - 2));
}

export function mobileRangeForNote(note, startOctave) {
  const midi = noteToMidi(note);
  if (midi >= (startOctave + 1) * 12 && midi <= (startOctave + 3) * 12) return startOctave;
  return Math.max(1, Math.min(5, Math.floor(midi / 12) - 2));
}

export function keyboardMapForRange(baseMap, startOctave, mobile) {
  if (!mobile) return { ...baseMap };
  const visible = new Set(keyboardNotes(startOctave, 2).map(key => key.note));
  return Object.fromEntries(Object.entries(baseMap).map(([key, note]) => {
    const shifted = note.replace(/\d+$/, octave => Number(octave) + startOctave - 3);
    return [key, shifted];
  }).filter(([, note]) => visible.has(note)));
}
