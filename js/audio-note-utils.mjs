const SEMITONE_BY_NAME = Object.freeze({
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
});

const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const SAMPLE_NOTES = Object.freeze(
  [3, 4, 5, 6].flatMap((octave) => NATURAL_NOTES.map((name) => `${name}${octave}`)),
);

export function parseNote(note) {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(String(note).trim());
  if (!match) throw new TypeError(`Unsupported note: ${note}`);
  return { name: `${match[1]}${match[2]}`, octave: Number(match[3]) };
}

export function noteToMidi(note) {
  const { name, octave } = parseNote(note);
  return (octave + 1) * 12 + SEMITONE_BY_NAME[name];
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function nearestSampleNote(note, sampleNotes = SAMPLE_NOTES) {
  const targetMidi = noteToMidi(note);
  return sampleNotes.reduce((best, candidate) => {
    const distance = Math.abs(noteToMidi(candidate) - targetMidi);
    if (!best || distance < best.distance) return { note: candidate, distance };
    if (distance === best.distance && noteToMidi(candidate) < noteToMidi(best.note)) {
      return { note: candidate, distance };
    }
    return best;
  }, null).note;
}

export function playbackRateForNote(note, sampleNote) {
  return 2 ** ((noteToMidi(note) - noteToMidi(sampleNote)) / 12);
}

export function sampleUrl(sampleNote) {
  return `/samples/piano-${sampleNote}.mp3`;
}
