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
    this.disposed = false;
    this.context = null;
    this.gainNode = null;
    this.volume = 0.62;
    this.releaseSeconds = 0.14;
    this.minimumAttackSeconds = 0.045;
    this.sustainEnabled = false;
    this.sustainedNotes = new Set();
    this.pressedNotes = new Set();
    this.buffers = new Map();
    this.loadingBuffers = new Map();
    this.loadControllers = new Map();
    this.retryAfter = new Map();
    this.pendingNotes = new Map();
    this.activeVoices = new Map();
    this.lastTriggerAt = new Map();
    this.duplicateWindowMs = 24;
  }

  async init() {
    if (this.disposed) return false;
    if (this.initialized) return true;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio API is not supported');
      this.context = new AudioContextClass({ latencyHint: 'interactive' });
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.context.destination);
      this.initialized = true;
      // Downloads improve later notes, but never gate a key's first attack.
      ['C4', 'E4', 'G4', 'C5'].forEach(note => this.loadBuffer(note).catch(() => {}));
      return true;
    } catch (error) {
      console.error('Failed to initialize piano audio:', error);
      return false;
    }
  }

  async ensureRunning() {
    if (this.disposed) throw new Error('Piano audio is disposed');
    if (!this.initialized && !await this.init()) throw new Error('Web Audio is unavailable');
    // Safari can interrupt a previously running context after an app/audio switch.
    if (this.context.state !== 'running' && this.context.state !== 'closed') await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Audio context is not running');
  }

  async loadBuffer(sampleNote) {
    if (this.disposed) throw new Error('Piano audio is disposed');
    if (this.buffers.has(sampleNote)) return this.buffers.get(sampleNote);
    if (this.loadingBuffers.has(sampleNote)) return this.loadingBuffers.get(sampleNote);
    if (Date.now() < (this.retryAfter.get(sampleNote) || 0)) throw new Error('Sample retry backoff');
    const controller = new AbortController();
    this.loadControllers.set(sampleNote, controller);
    const timeout = setTimeout(() => controller.abort(), 8000);
    const promise = fetch(sampleUrl(sampleNote), { cache: 'force-cache', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(data => this.context.decodeAudioData(data.slice(0)))
      .then(buffer => {
        if (!this.disposed) { this.buffers.set(sampleNote, buffer); this.retryAfter.delete(sampleNote); }
        return buffer;
      })
      .catch(error => {
        if (!this.disposed) this.retryAfter.set(sampleNote, Date.now() + 15000);
        throw error;
      })
      .finally(() => {
        clearTimeout(timeout);
        if (this.loadControllers.get(sampleNote) === controller) {
          this.loadControllers.delete(sampleNote);
          this.loadingBuffers.delete(sampleNote);
        }
      });
    this.loadingBuffers.set(sampleNote, promise);
    return promise;
  }

  async playNote(note, velocity = 0.9) {
    noteToMidi(note); // Reject invalid input without leaving a held key behind.
    if (this.disposed) return false;
    const nowMs = performance.now();
    const previous = this.lastTriggerAt.get(note);
    // Deduplicate simultaneous event paths, not a genuine release-and-repress.
    if (this.pressedNotes.has(note) && previous !== undefined && nowMs - previous < this.duplicateWindowMs) return false;
    this.lastTriggerAt.set(note, nowMs);
    this.pressedNotes.add(note);
    this.sustainedNotes.delete(note);
    const request = { createdAt: nowMs, released: false };
    this.pendingNotes.set(note, request);
    try {
      // A running context must start synchronously: even a very short tap counts.
      if (!this.initialized || this.context.state !== 'running') await this.ensureRunning();
      if (this.disposed || this.pendingNotes.get(note) !== request) return false;
      // Do not replay stale taps when a denied/interrupted context resumes much later.
      if (request.released && performance.now() - request.createdAt > 300) return false;
      const preferred = nearestSampleNote(note);
      if (!this.buffers.has(preferred)) this.loadBuffer(preferred).catch(() => {});
      let sampleNote = this.buffers.has(preferred) ? preferred : null;
      if (!sampleNote && this.buffers.size) {
        const closest = nearestSampleNote(note, [...this.buffers.keys()]);
        if (Math.abs(noteToMidi(note) - noteToMidi(closest)) <= 12) sampleNote = closest;
      }
      this.releaseVoices(note, 0.015, 0);
      if (sampleNote) this.playSample(note, sampleNote, velocity);
      else this.playOscillatorFallback(note, velocity);
      // An initial resume may finish after pointerup. Give that tap a short attack
      // instead of dropping it; stopAll invalidates it entirely on blur/pagehide.
      if (request.released || !this.pressedNotes.has(note)) {
        if (this.sustainEnabled) this.sustainedNotes.add(note);
        else this.releaseVoices(note);
      }
      return true;
    } catch (error) {
      if (this.pendingNotes.get(note) === request) {
        this.pressedNotes.delete(note);
        this.lastTriggerAt.delete(note);
      }
      throw error;
    } finally {
      if (this.pendingNotes.get(note) === request) this.pendingNotes.delete(note);
    }
  }

  trackVoice(note, source, voiceGain, startedAt, level) {
    const voice = { source, gainNode: voiceGain, startedAt, level, released: false };
    const voices = this.activeVoices.get(note) || new Set();
    voices.add(voice);
    this.activeVoices.set(note, voices);
    source.onended = () => {
      voices.delete(voice);
      if (!voices.size && this.activeVoices.get(note) === voices) this.activeVoices.delete(note);
      source.disconnect();
      voiceGain.disconnect();
    };
    source.start(startedAt);
    return voice;
  }

  playSample(note, sampleNote, velocity) {
    const source = this.context.createBufferSource();
    const voiceGain = this.context.createGain();
    const startedAt = this.context.currentTime;
    source.buffer = this.buffers.get(sampleNote);
    source.playbackRate.value = playbackRateForNote(note, sampleNote);
    const level = Math.min(1, Math.max(0.08, Number(velocity) || 0.9));
    voiceGain.gain.value = level;
    voiceGain.gain.setValueAtTime(level, startedAt);
    source.connect(voiceGain);
    voiceGain.connect(this.gainNode);
    this.trackVoice(note, source, voiceGain, startedAt, level);
  }

  playOscillatorFallback(note, velocity = 0.7) {
    const oscillator = this.context.createOscillator();
    const voiceGain = this.context.createGain();
    const startedAt = this.context.currentTime;
    // Conservative fallback level: do not blast the user when a sample is missing.
    const level = Math.min(1, Math.max(0.08, Number(velocity) || 0.7)) * 0.07;
    voiceGain.gain.value = level;
    oscillator.type = 'triangle';
    oscillator.frequency.value = midiToFrequency(noteToMidi(note));
    voiceGain.gain.setValueAtTime(level, startedAt);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 1.4);
    oscillator.connect(voiceGain);
    voiceGain.connect(this.gainNode);
    this.trackVoice(note, oscillator, voiceGain, startedAt, level);
    oscillator.stop(startedAt + 1.45);
  }

  stopNote(note) {
    this.pressedNotes.delete(note);
    this.lastTriggerAt.delete(note);
    const pending = this.pendingNotes.get(note);
    if (pending) pending.released = true;
    if (this.sustainEnabled) { this.sustainedNotes.add(note); return; }
    this.releaseVoices(note);
  }

  releaseVoices(note, releaseSeconds = this.releaseSeconds, minimumAttack = this.minimumAttackSeconds) {
    const voices = this.activeVoices.get(note);
    if (!voices || !this.context) return;
    const now = this.context.currentTime;
    voices.forEach(voice => {
      if (voice.released) return;
      voice.released = true;
      const releaseAt = Math.max(now, voice.startedAt + minimumAttack);
      const gain = voice.gainNode.gain;
      // Before the first rendering quantum, AudioParam.value can still be its
      // default (1). Never turn a quiet fallback into a full-scale attack.
      const current = Math.min(voice.level, Math.max(0.0001, gain.value || 0.0001));
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
      gain.setValueAtTime(current, releaseAt);
      gain.exponentialRampToValueAtTime(0.0001, releaseAt + releaseSeconds);
      try { voice.source.stop(releaseAt + releaseSeconds + 0.03); } catch (_) {}
    });
  }

  stopAll() {
    this.pendingNotes.clear();
    this.pressedNotes.clear();
    this.sustainedNotes.clear();
    this.lastTriggerAt.clear();
    [...this.activeVoices.keys()].forEach(note => this.releaseVoices(note, 0.015, 0));
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (this.gainNode && this.context) this.gainNode.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
  }

  setSustain(enabled) {
    const next = Boolean(enabled);
    if (next === this.sustainEnabled) return;
    this.sustainEnabled = next;
    if (!next) {
      const deferred = [...this.sustainedNotes];
      this.sustainedNotes.clear();
      deferred.forEach(note => { if (!this.pressedNotes.has(note)) this.releaseVoices(note); });
    }
  }

  dispose() {
    this.disposed = true;
    this.stopAll();
    this.loadControllers.forEach(controller => controller.abort());
    this.loadControllers.clear();
    this.activeVoices.clear();
    this.buffers.clear();
    this.loadingBuffers.clear();
    this.retryAfter.clear();
    if (this.context && this.context.state !== 'closed') this.context.close();
  }
}

export default PianoAudio;
