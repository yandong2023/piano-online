export function installAudioRuntime(piano, documentRef = document) {
  if (!piano?.audio) return () => {};

  const applySustain = (enabled) => {
    piano.sustainPedal = Boolean(enabled);
    piano.audio.setSustain(piano.sustainPedal);
    const toggle = documentRef.getElementById('sustain-toggle');
    if (toggle && toggle.checked !== piano.sustainPedal) toggle.checked = piano.sustainPedal;
  };

  // Let the audio engine decide whether a released note stops immediately
  // or waits for the sustain pedal.
  piano.releaseKey = (note) => {
    piano.keys[note]?.classList.remove('active');
    piano.audio.stopNote(note);
  };

  const onKeyDown = (event) => {
    if (event.code === 'Space' && !event.repeat) applySustain(true);
  };
  const onKeyUp = (event) => {
    if (event.code === 'Space') applySustain(false);
  };

  documentRef.addEventListener('keydown', onKeyDown, { capture: true });
  documentRef.addEventListener('keyup', onKeyUp, { capture: true });

  const toggle = documentRef.getElementById('sustain-toggle');
  const onToggle = (event) => applySustain(event.target.checked);
  toggle?.addEventListener('change', onToggle);

  const originalMidiHandler = piano.handleMIDIMessage?.bind(piano);
  if (originalMidiHandler) {
    piano.handleMIDIMessage = (message) => {
      originalMidiHandler(message);
      const command = message.data[0] >> 4;
      if (command === 11 && message.data[1] === 64) {
        applySustain((message.data[2] || 0) >= 64);
      }
    };
  }

  return () => {
    documentRef.removeEventListener('keydown', onKeyDown, { capture: true });
    documentRef.removeEventListener('keyup', onKeyUp, { capture: true });
    toggle?.removeEventListener('change', onToggle);
  };
}
