import {
  midiToFrequency,
  nearestSampleNote,
  noteToMidi,
  playbackRateForNote,
  sampleUrl,
} from './audio-note-utils.mjs';

class PianoAudio {
  constructor() {
    this.initialized = false;
    this.context = null;
    this.gainNode = null;
    this.volume = 0.62;
    this.releaseSeconds = 0.14;
    this.sustainEnabled = false;
    this.sustainedNotes = new Set();
    this.pressedNotes = new Set();
    this.buffers = new Map();
    this.loadingBuffers = new Map();
    this.activeVoices = new Map();
    this.lastTriggerAt = new Map();
    this.duplicateWindowMs = 24;
  }

  async init() {
    if (this.initialized) return true;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio API is not supported');

      this.context = new AudioContextClass();
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.context.destination);
      this.initialized = true;

      // Warm the most common beginner range without blocking first paint.
      ['C4', 'E4', 'G4', 'C5'].forEach((note) => {
        this.loadBuffer(note).catch(() => {});
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize piano audio:', error);
      return false;
    }
  }

  async ensureRunning() {
    if (!this.initialized) await this.init();
    if (this.context?.state === 'suspended') await this.context.resume();
  }

  async loadBuffer(sampleNote) {
    if (this.buffers.has(sampleNote)) return this.buffers.get(sampleNote);
    if (this.loadingBuffers.has(sampleNote)) return this.loadingBuffers.get(sampleNote);

    const promise = fetch(sampleUrl(sampleNote), { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => this.context.decodeAudioData(data.slice(0)))
      .then((buffer) => {
        this.buffers.set(sampleNote, buffer);
        this.loadingBuffers.delete(sampleNote);
        return buffer;
      })
      .catch((error) => {
        this.loadingBuffers.delete(sampleNote);
        throw error;
      });

    this.loadingBuffers.set(sampleNote, promise);
    return promise;
  }

  async playNote(note, velocity = 0.9) {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const previousTrigger = this.lastTriggerAt.get(note) || 0;
    if (nowMs - previousTrigger < this.duplicateWindowMs) return false;
    this.lastTriggerAt.set(note, nowMs);
    this.pressedNotes.add(note);

    try {
      await this.ensureRunning();
      const sampleNote = nearestSampleNote(note);
      const buffer = await this.loadBuffer(sampleNote);

      if (!this.pressedNotes.has(note) && !this.sustainEnabled) return false;

      this.releaseVoices(note, 0.025);

      const source = this.context.createBufferSource();
      const voiceGain = this.context.createGain();
      const startedAt = this.context.currentTime;
      const normalizedVelocity = Math.min(1, Math.max(0.08, Number(velocity) || 0.9));

      source.buffer = buffer;
      source.playbackRate.value = playbackRateForNote(note, sampleNote);
      voiceGain.gain.setValueAtTime(normalizedVelocity, startedAt);
      source.connect(voiceGain);
      voiceGain.connect(this.gainNode);

      const voice = { source, gainNode: voiceGain, released: false };
      const voices = this.activeVoices.get(note) || new Set();
      voices.add(voice);
      this.activeVoices.set(note, voices);

      source.onended = () => {
        voices.delete(voice);
        if (voices.size === 0) this.activeVoices.delete(note);
        source.disconnect();
        voiceGain.disconnect();
      };

      source.start(startedAt);
      return true;
    } catch (error) {
      console.warn(`Falling back to oscillator for ${note}:`, error);
      if (!this.pressedNotes.has(note) && !this.sustainEnabled) return false;
      await this.ensureRunning();
      this.playOscillatorFallback(note, velocity);
      return false;
    }
  }

  playOscillatorFallback(note, velocity = 0.7) {
    const oscillator = this.context.createOscillator();
    const voiceGain = this.context.createGain();
    const startedAt = this.context.currentTime;
    const normalizedVelocity = Math.min(0.65, Math.max(0.06, Number(velocity) || 0.7));

    oscillator.type = 'triangle';
    oscillator.frequency.value = midiToFrequency(noteToMidi(note));
    voiceGain.gain.setValueAtTime(normalizedVelocity, startedAt);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 1.4);
    oscillator.connect(voiceGain);
    voiceGain.connect(this.gainNode);

    const voice = { source: oscillator, gainNode: voiceGain, released: false };
    const voices = this.activeVoices.get(note) || new Set();
    voices.add(voice);
    this.activeVoices.set(note, voices);

    oscillator.onended = () => {
      voices.delete(voice);
      if (voices.size === 0) this.activeVoices.delete(note);
      oscillator.disconnect();
      voiceGain.disconnect();
    };

    oscillator.start(startedAt);
    oscillator.stop(startedAt + 1.45);
  }

  stopNote(note) {
    this.pressedNotes.delete(note);
    if (this.sustainEnabled) {
      this.sustainedNotes.add(note);
      return;
    }
    this.releaseVoices(note);
  }

  releaseVoices(note, releaseSeconds = this.releaseSeconds) {
    const voices = this.activeVoices.get(note);
    if (!voices || !this.context) return;

    const now = this.context.currentTime;
    voices.forEach((voice) => {
      if (voice.released) return;
      voice.released = true;
      const gain = voice.gainNode.gain;
      const current = Math.max(0.0001, gain.value || 0.0001);
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
      gain.exponentialRampToValueAtTime(0.0001, now + releaseSeconds);
      try {
        voice.source.stop(now + releaseSeconds + 0.03);
      } catch (_) {
        // A source can only be stopped once.
      }
    });
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (this.gainNode && this.context) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
    }
  }

  setSustain(enabled) {
    const next = Boolean(enabled);
    if (next === this.sustainEnabled) return;
    this.sustainEnabled = next;

    if (!next) {
      const deferred = [...this.sustainedNotes];
      this.sustainedNotes.clear();
      deferred.forEach((note) => {
        if (!this.pressedNotes.has(note)) this.releaseVoices(note);
      });
    }
  }

  dispose() {
    [...this.activeVoices.keys()].forEach((note) => this.releaseVoices(note, 0.02));
    this.activeVoices.clear();
    this.buffers.clear();
    this.loadingBuffers.clear();
    if (this.context && this.context.state !== 'closed') this.context.close();
  }
}

export default PianoAudio;
