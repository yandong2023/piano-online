const note = (pitch, duration = 'q') => ({ pitch, duration });
const measure = (...events) => events;

export const scoreSongs = Object.freeze({
  'happy-birthday': {
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    measures: [
      measure(note('G4', '8'), note('G4', '8'), note('A4', 'q'), note('G4', 'q'), note('C5', 'q')),
      measure(note('B4', 'h'), note('G4', '8'), note('G4', '8'), note('A4', 'q')),
      measure(note('G4', 'q'), note('D5', 'q'), note('C5', 'h')),
      measure(note('G4', '8'), note('G4', '8'), note('G5', 'q'), note('E5', 'q'), note('C5', 'q')),
      measure(note('B4', 'q'), note('A4', 'q'), note('F5', 'q')),
      measure(note('F5', '8'), note('F5', '8'), note('E5', 'q'), note('C5', 'q')),
      measure(note('D5', 'q'), note('C5', 'h'))
    ]
  },
  twinkle: {
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    measures: [
      measure(note('C4', 'q'), note('C4', 'q'), note('G4', 'q'), note('G4', 'q')),
      measure(note('A4', 'q'), note('A4', 'q'), note('G4', 'h')),
      measure(note('F4', 'q'), note('F4', 'q'), note('E4', 'q'), note('E4', 'q')),
      measure(note('D4', 'q'), note('D4', 'q'), note('C4', 'h')),
      measure(note('G4', 'q'), note('G4', 'q'), note('F4', 'q'), note('F4', 'q')),
      measure(note('E4', 'q'), note('E4', 'q'), note('D4', 'h')),
      measure(note('G4', 'q'), note('G4', 'q'), note('F4', 'q'), note('F4', 'q')),
      measure(note('E4', 'q'), note('E4', 'q'), note('D4', 'h')),
      measure(note('C4', 'q'), note('G4', 'q'), note('C5', 'h'))
    ]
  },
  'ode-to-joy': {
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    measures: [
      measure(note('E4', 'q'), note('E4', 'q'), note('F4', 'q'), note('G4', 'q')),
      measure(note('G4', 'q'), note('F4', 'q'), note('E4', 'q'), note('D4', 'q')),
      measure(note('C4', 'q'), note('C4', 'q'), note('D4', 'q'), note('E4', 'q')),
      measure(note('E4', 'q'), note('D4', 'q'), note('D4', 'h')),
      measure(note('E4', 'q'), note('E4', 'q'), note('F4', 'q'), note('G4', 'q')),
      measure(note('G4', 'q'), note('F4', 'q'), note('E4', 'q'), note('D4', 'q')),
      measure(note('C4', 'q'), note('C4', 'q'), note('D4', 'q'), note('E4', 'q')),
      measure(note('D4', 'q'), note('C4', 'q'), note('C4', 'h'))
    ]
  },
  'jingle-bells': {
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    measures: [
      measure(note('E4', 'q'), note('E4', 'q'), note('E4', 'h')),
      measure(note('E4', 'q'), note('E4', 'q'), note('E4', 'h')),
      measure(note('E4', 'q'), note('G4', 'q'), note('C4', 'q'), note('D4', 'q')),
      measure(note('E4', 'w')),
      measure(note('F4', 'q'), note('F4', 'q'), note('F4', 'q'), note('F4', 'q')),
      measure(note('F4', 'q'), note('E4', 'q'), note('E4', 'q'), note('E4', 'q')),
      measure(note('E4', 'q'), note('D4', 'q'), note('D4', 'q'), note('E4', 'q')),
      measure(note('D4', 'h'), note('G4', 'h'))
    ]
  },
  'blue-danube': {
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    measures: [
      measure(note('G4', 'q'), note('C5', 'q'), note('E5', 'q')),
      measure(note('E5', 'q'), note('E5', 'q'), note('G5', 'q')),
      measure(note('G5', 'q'), note('G5', 'q'), note('E5', 'q')),
      measure(note('E5', 'q'), note('E5', 'q'), note('C5', 'q')),
      measure(note('C5', 'q'), note('C5', 'q'), note('E5', 'q')),
      measure(note('E5', 'q'), note('E5', 'q'), note('G5', 'q')),
      measure(note('G5', 'q'), note('G5', 'q'), note('F5', 'q')),
      measure(note('F5', 'q'), note('F5', 'q'), note('D5', 'q'))
    ]
  }
});

export function getScoreBySongId(songId) {
  return scoreSongs[songId] || null;
}

export function hasScoreForSong(songId) {
  return Boolean(getScoreBySongId(songId));
}

export function getScoreNoteCount(songId) {
  const score = getScoreBySongId(songId);
  if (!score) return 0;
  return score.measures.reduce((total, current) => total + current.length, 0);
}
