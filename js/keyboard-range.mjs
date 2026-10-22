import { noteToMidi } from './audio-note-utils.mjs';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function keyboardNotes(startOctave = 3, octaves = 3) {
  const start = (startOctave + 1) * 12;
  return Array.from({ length: octaves * 12 + 1 }, (_, offset) => {
    const midi = start + offset;
    const name = NAMES[midi % 12];
    return { note: `${name}${Math.floor(midi / 12) - 1}`, type: name.includes('#') ? 'black' : 'white' };
  });
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
