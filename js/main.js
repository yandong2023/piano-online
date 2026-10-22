import { Piano } from './piano.js';
import { PracticeMode } from './practice-mode.js';
import { PianoRecorder } from './recorder.js';
import { RhythmGame } from './rhythm-game.js';
import { Tutorial } from './tutorial.js';
import { initializeSongDiscovery } from './song-discovery.js';
import { populateSongSelects } from './song-select-options.js';
import { initializeGuidedHomepage } from './guided-homepage.js';
import { initializeGuidedEntryBindings } from './guided-entry-bindings.js';
import { installAudioRuntime } from './audio-runtime.mjs';

document.addEventListener('DOMContentLoaded', async () => {
  let recorder = null;
  let cleanupAudioRuntime = null;
  let piano = null;
  let practiceMode = null;

  try {
    initializeSongDiscovery();
    populateSongSelects();
    initializeGuidedHomepage();

    const hasPiano = Boolean(document.querySelector('.keys'));
    if (!hasPiano) return;

    piano = new Piano();
    cleanupAudioRuntime = installAudioRuntime(piano);

    if (document.getElementById('song-select') && document.getElementById('start-practice')) {
      practiceMode = new PracticeMode(piano);
      window.pianoPracticeMode = practiceMode;
      initializeGuidedEntryBindings();
    }

    if (document.getElementById('start-recording')) {
      recorder = new PianoRecorder(piano);
    }

    if (document.getElementById('start-rhythm-game')) {
      new RhythmGame(piano);
    }

    if (document.getElementById('tutorial-overlay')) {
      window.pianoTutorial = new Tutorial(piano);
    }

    const resumeAudio = async () => {
      try {
        // An early recording/control click can precede the idle callback too.
        await piano.audio.ensureRunning();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    };

    ['pointerdown', 'keydown'].forEach((event) => {
      document.addEventListener(event, resumeAudio, { once: true, capture: true });
    });

    window.addEventListener('beforeunload', () => {
      cleanupAudioRuntime?.();
      recorder?.dispose();
      piano?.audio?.dispose();
    });
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});
