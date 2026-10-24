import { midiNumberToNote, parseMidi, timelineMs } from './midi-file.mjs';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_EVENTS = 12000;
let cancel = () => {};
const active = new Set();

function releaseActive() {
  for (const note of active) {
    document.dispatchEvent(new CustomEvent('studio:note-off', { detail: { note } }));
  }
  active.clear();
}

export function stopMidiPlayback() {
  cancel();
  cancel = () => {};
  releaseActive();
}

export function playMidiBuffer(buffer) {
  stopMidiPlayback();
  const parsed = parseMidi(buffer);
  const timed = timelineMs(parsed.events, parsed.division);
  if (!timed.length) throw new Error('That MIDI file has no notes to play.');
  const clipped = timed.slice(0, MAX_EVENTS);
  const timers = [];
  for (const event of clipped) {
    timers.push(setTimeout(() => {
      const note = midiNumberToNote(event.note);
      if (event.type === 'on') {
        active.add(note);
        document.dispatchEvent(new CustomEvent('studio:note-on', { detail: { note } }));
      } else {
        active.delete(note);
        document.dispatchEvent(new CustomEvent('studio:note-off', { detail: { note } }));
      }
    }, Math.max(0, event.ms)));
  }
  cancel = () => {
    for (const id of timers) clearTimeout(id);
  };
  return { clipped: clipped.length < timed.length };
}

function bindMidiDrop() {
  const zone = document.getElementById('midi-drop');
  if (!zone || zone.dataset.bound === 'true') return;
  zone.dataset.bound = 'true';
  const status = document.getElementById('midi-status');
  const input = document.getElementById('midi-file');
  const setStatus = (message) => {
    if (status) status.textContent = message;
  };
  const handle = (file) => {
    document.dispatchEvent(new CustomEvent('studio:unlock-audio'));
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus('That MIDI file is too large. Use a file under 2 MB.');
      return;
    }
    file.arrayBuffer().then((buffer) => {
      const result = playMidiBuffer(buffer);
      setStatus(result.clipped
        ? `Playing ${file.name}. A long file was shortened so the browser stays responsive.`
        : `Playing ${file.name}.`);
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : 'Could not read that MIDI file.');
    });
  };
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-hot');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-hot'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-hot');
    handle(event.dataTransfer?.files?.[0]);
  });
  input?.addEventListener('change', () => handle(input.files?.[0]));
  document.getElementById('midi-stop')?.addEventListener('click', () => {
    stopMidiPlayback();
    setStatus('Stopped. Drop another MIDI file to play.');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindMidiDrop);
else bindMidiDrop();
