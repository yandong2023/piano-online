const note = (pitch, duration = 'q') => ({ pitch, duration });

const durationTemplates = Object.freeze({
  3: Object.freeze({
    2: ['q', 'h'],
    3: ['q', 'q', 'q'],
    4: ['8', '8', 'q', 'q'],
    5: ['8', '8', '8', '8', 'q'],
    6: ['8', '8', '8', '8', '8', '8']
  }),
  4: Object.freeze({
    2: ['h', 'h'],
    3: ['q', 'q', 'h'],
    4: ['q', 'q', 'q', 'q'],
    5: ['8', '8', 'q', 'q', 'q'],
    6: ['8', '8', '8', '8', 'q', 'q'],
    7: ['8', '8', '8', '8', '8', '8', 'q'],
    8: ['8', '8', '8', '8', '8', '8', '8', '8']
  })
});

function createSimplifiedScore({ timeSignature, keySignature, notes, measureSizes }) {
  const durationMap = durationTemplates[timeSignature.beats];
  if (!durationMap) {
    throw new Error(`Unsupported time signature: ${timeSignature.beats}/${timeSignature.beatType}`);
  }

  let cursor = 0;
  const measures = measureSizes.map((size) => {
    const pitches = notes.slice(cursor, cursor + size);
    const durations = durationMap[size];
    cursor += size;

    if (pitches.length !== size || !durations) {
      throw new Error(`Invalid simplified score measure: size ${size}`);
    }

    return pitches.map((pitch, index) => note(pitch, durations[index]));
  });

  if (cursor !== notes.length) {
    throw new Error(`Measure sizes cover ${cursor} notes but score contains ${notes.length}`);
  }

  return Object.freeze({
    arrangement: 'simplified-beginner',
    timeSignature,
    keySignature,
    measures
  });
}

export const scoreSongs = Object.freeze({
  'happy-birthday': createSimplifiedScore({
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'G4', 'A4', 'G4', 'C5', 'B4', 'G4', 'G4', 'A4', 'G4', 'D5', 'C5', 'G4', 'G4', 'G5', 'E5', 'C5', 'B4', 'A4', 'F5', 'F5', 'E5', 'C5', 'D5', 'C5'],
    measureSizes: [5, 3, 4, 5, 3, 3, 2]
  }),
  twinkle: createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4', 'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'C4', 'G4', 'C5'],
    measureSizes: [4, 3, 4, 3, 4, 3, 4, 3, 3]
  }),
  'ode-to-joy': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4', 'E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'D4', 'C4', 'C4'],
    measureSizes: [4, 4, 4, 3, 4, 4, 4, 3]
  }),
  'jingle-bells': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'G4', 'C4', 'D4', 'E4', 'F4', 'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'G4'],
    measureSizes: [3, 3, 4, 3, 4, 4, 4]
  }),
  'blue-danube': createSimplifiedScore({
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'C5', 'E5', 'E5', 'E5', 'G5', 'G5', 'G5', 'E5', 'E5', 'E5', 'C5', 'C5', 'C5', 'E5', 'E5', 'E5', 'G5', 'G5', 'G5', 'F5', 'F5', 'F5', 'D5'],
    measureSizes: [3, 3, 3, 3, 3, 3, 3, 3]
  }),
  'two-tigers': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4', 'E4', 'F4', 'G4', 'G4', 'A4', 'G4', 'F4', 'E4', 'C4', 'G4', 'A4', 'G4', 'F4', 'E4', 'C4', 'C4', 'G3', 'C4', 'C4', 'G3', 'C4'],
    measureSizes: [4, 4, 3, 3, 6, 6, 3, 3]
  }),
  'mary-lamb': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4', 'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'C4'],
    measureSizes: [4, 3, 3, 3, 4, 4, 4]
  }),
  'hot-cross-buns': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['E4', 'D4', 'C4', 'E4', 'D4', 'C4', 'C4', 'C4', 'C4', 'C4', 'D4', 'D4', 'D4', 'D4', 'E4', 'D4', 'C4'],
    measureSizes: [3, 3, 4, 4, 3]
  }),
  'old-macdonald': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['C4', 'C4', 'C4', 'G3', 'A3', 'A3', 'G3', 'E4', 'E4', 'D4', 'D4', 'C4', 'G3', 'C4', 'C4', 'C4', 'G3', 'A3', 'A3', 'G3', 'E4', 'E4', 'D4', 'D4', 'C4'],
    measureSizes: [4, 3, 4, 3, 4, 3, 4]
  }),
  'row-boat': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['C4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'E4', 'F4', 'G4', 'C5', 'C5', 'C5', 'G4', 'G4', 'G4', 'E4', 'E4', 'E4', 'C4', 'C4', 'C4', 'G4', 'F4', 'E4', 'D4', 'C4'],
    measureSizes: [4, 4, 4, 4, 4, 4, 3]
  }),
  'london-bridge': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4', 'D4', 'E4', 'F4', 'E4', 'F4', 'G4', 'G4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4', 'D4', 'G4', 'E4', 'C4'],
    measureSizes: [4, 3, 4, 3, 4, 3, 3]
  }),
  'brahms-lullaby': createSimplifiedScore({
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'G4', 'B4', 'G4', 'G4', 'B4', 'G4', 'B4', 'E5', 'D5', 'C5', 'C5', 'B4', 'F4', 'G4', 'A4', 'F4', 'F4', 'G4', 'A4', 'G4', 'C5', 'B4', 'C5', 'D5', 'C5', 'G4'],
    measureSizes: [3, 3, 3, 3, 3, 3, 3, 3, 3]
  }),
  'minuet-in-g': createSimplifiedScore({
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'G Major',
    notes: ['D5', 'G4', 'A4', 'B4', 'C5', 'D5', 'G4', 'G4', 'E5', 'C5', 'D5', 'E5', 'F#5', 'G5', 'G4', 'G4', 'C5', 'D5', 'C5', 'B4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4'],
    measureSizes: [3, 3, 3, 3, 3, 3, 3, 3, 2]
  }),
  'we-wish-you': createSimplifiedScore({
    timeSignature: { beats: 3, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'C5', 'C5', 'D5', 'C5', 'B4', 'A4', 'A4', 'D5', 'D5', 'E5', 'D5', 'C5', 'B4', 'G4', 'E5', 'E5', 'F5', 'E5', 'D5', 'C5', 'A4', 'G4', 'A4', 'D5', 'B4', 'C5'],
    measureSizes: [3, 3, 3, 3, 3, 3, 3, 3, 3]
  }),
  'deck-the-halls': createSimplifiedScore({
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 'C Major',
    notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4', 'C4', 'D4', 'E4', 'F4', 'D4', 'E4', 'D4', 'C4', 'B3', 'C4', 'D4', 'E4', 'C4', 'D4', 'E4', 'F4', 'G4'],
    measureSizes: [4, 4, 4, 4, 4, 4]
  })
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

export function flattenScorePitches(songId) {
  const score = getScoreBySongId(songId);
  if (!score) return [];
  return score.measures.flatMap((current) => current.map((event) => event.pitch));
}
