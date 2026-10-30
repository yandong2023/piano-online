import { encodeWav } from './wav-encoder.mjs';
import { pianoText as text } from './i18n.js';

// Capture the instrument's output in its own AudioContext. No microphone access.
export function recordingExtension(mimeType) {
  if (/mp4/i.test(mimeType)) return 'm4a';
  if (/ogg/i.test(mimeType)) return 'ogg';
  if (/wav/i.test(mimeType)) return 'wav';
  return 'webm';
}

export class PerformanceRecorder {
  constructor(audio, { onChange = () => {}, onTick = () => {}, maxDurationMs = 300000 } = {}) {
    this.audio = audio;
    this.onChange = onChange;
    this.onTick = onTick;
    this.maxDurationMs = maxDurationMs;
    this.state = 'idle';
    this.result = null;
    this.session = null;
    this.error = null;
    this.disposed = false;
  }

  static get supported() {
    return typeof globalThis.MediaRecorder === 'function';
  }

  change(state) {
    this.state = state;
    this.onChange(this);
  }

  async start() {
    if (this.disposed || ['starting', 'recording', 'stopping'].includes(this.state)) return;
    this.error = null;
    this.change('starting');
    try {
      if (!PerformanceRecorder.supported) throw new Error('Recording is unavailable');
      await this.audio.ensureRunning();
      if (this.disposed) return;
      const destination = this.audio.context.createMediaStreamDestination();
      const session = { destination, chunks: [], startedAt: performance.now(), durationMs: 0, failed: false };
      this.session = session;
      this.audio.gainNode.connect(destination);
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(destination.stream, mimeType ? { mimeType } : undefined);
      session.recorder = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size && this.session === session) session.chunks.push(event.data);
      };
      recorder.onerror = event => {
        if (this.session !== session) return;
        session.failed = true;
        this.error = event.error || new Error('Recording failed');
        this.stop();
      };
      recorder.onstop = () => this.finish(session);
      recorder.start(1000);
      session.startedAt = performance.now();
      this.onTick(0);
      session.interval = setInterval(() => this.onTick(performance.now() - session.startedAt), 250);
      session.timeout = setTimeout(() => this.stop(), this.maxDurationMs);
      this.change('recording');
    } catch (error) {
      if (this.disposed) return;
      this.error = error;
      if (this.session) this.cleanup(this.session);
      this.change(this.result ? 'ready' : 'idle');
    }
  }

  stop() {
    if (this.state !== 'recording') return;
    const session = this.session;
    session.durationMs = performance.now() - session.startedAt;
    clearInterval(session.interval);
    clearTimeout(session.timeout);
    this.change('stopping');
    if (session.recorder.state !== 'inactive') session.recorder.stop();
    // Some browsers become inactive before dispatching the error/stop events.
    // Always wait for onstop so the final dataavailable chunk is included.
  }

  finish(session) {
    if (this.disposed || this.session !== session) return;
    session.durationMs ||= performance.now() - session.startedAt;
    try {
      if (session.failed || !session.chunks.length) throw this.error || new Error('No recording data');
      const mimeType = session.recorder.mimeType || session.chunks[0].type;
      const blob = new Blob(session.chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const previous = this.result;
      this.result = {
        blob, url, durationMs: session.durationMs,
        filename: `piano-online-${new Date().toISOString().replace(/[:.]/g, '-')}.${recordingExtension(mimeType)}`,
      };
      if (previous) {
        URL.revokeObjectURL(previous.url);
        if (previous.wav) URL.revokeObjectURL(previous.wav.url);
      }
    } catch (error) {
      this.error = error;
    }
    this.cleanup(session);
    this.change(this.result ? 'ready' : 'idle');
  }

  cleanup(session) {
    clearInterval(session.interval);
    clearTimeout(session.timeout);
    try { this.audio.gainNode.disconnect(session.destination); } catch {}
    session.destination.stream.getTracks().forEach(track => track.stop());
    if (this.session === session) this.session = null;
  }

  async exportWav() {
    const take = this.result;
    if (!take || this.disposed) throw new Error('No recording to export');
    if (!take.wavPromise) {
      take.wavPromise = (async () => {
        const buffer = await this.audio.context.decodeAudioData(await take.blob.arrayBuffer());
        const blob = encodeWav(buffer);
        if (this.disposed || this.result !== take) throw new Error('Recording changed during export');
        take.wav = { blob, url: URL.createObjectURL(blob), filename: take.filename.replace(/\.[^.]+$/, '.wav') };
        return take.wav;
      })().catch(error => {
        take.wavPromise = null; // Allow another attempt without losing the original.
        throw error;
      });
    }
    return take.wavPromise;
  }

  dispose() {
    this.disposed = true;
    if (this.session) {
      const recorder = this.session.recorder;
      if (recorder) {
        recorder.onstop = recorder.onerror = recorder.ondataavailable = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      this.cleanup(this.session);
    }
    if (this.result) URL.revokeObjectURL(this.result.url);
    if (this.result?.wav) URL.revokeObjectURL(this.result.wav.url);
    this.result = null;
  }
}

function clock(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function mountStudioRecorder(audio, root) {
  const panel = root.querySelector('.studio-recorder');
  if (!panel) return null;
  const button = panel.querySelector('[data-record-toggle]');
  const status = panel.querySelector('[data-record-status]');
  const timer = panel.querySelector('[data-record-time]');
  const preview = panel.querySelector('audio');
  const playback = panel.querySelector('[data-record-playback]');
  const download = panel.querySelector('[data-record-download]');
  const wavButton = panel.querySelector('[data-record-wav]');
  let exporting = false;
  let displayedUrl = null;
  const recorder = new PerformanceRecorder(audio, {
    onTick: ms => { timer.textContent = clock(ms); },
    onChange: current => {
      const recording = current.state === 'recording';
      const busy = ['starting', 'recording', 'stopping'].includes(current.state);
      button.disabled = exporting || ['starting', 'stopping'].includes(current.state);
      button.setAttribute('aria-pressed', String(recording));
      panel.classList.toggle('is-recording', recording);
      button.textContent = recording ? text('停止录音', 'Stop recording')
        : current.state === 'starting' ? text('正在准备…', 'Preparing…')
        : current.state === 'stopping' ? text('正在保存…', 'Finishing…')
        : current.result ? text('重新录音', 'Record again') : text('开始录音', 'Record');
      if (busy) preview.pause();
      playback.hidden = busy || !current.result;
      status.textContent = current.error
        ? text('录音未能完成，请重试。已有的录音仍可回放和下载。', 'Recording failed. Try again. Any previous recording is still available.')
        : recording ? text('正在录制琴声，弹完后点击停止。', 'Recording the piano. Press Stop when finished.')
        : current.state === 'starting' ? text('正在开启录音。', 'Starting the recorder.')
        : current.state === 'stopping' ? text('正在整理录音，请稍候。', 'Finishing your recording.')
        : current.result ? text('录音完成，听听你的演奏。', 'Your recording is ready. Hear what you played.')
        : text('录下这段旋律，听见自己的进步。', 'Capture a little music. Hear your progress.');
      if (current.result && !busy && displayedUrl !== current.result.url) {
        displayedUrl = current.result.url;
        preview.src = displayedUrl;
        download.href = displayedUrl;
        download.download = current.result.filename;
        download.textContent = text('下载录音', 'Download audio') + ` · ${recordingExtension(current.result.blob.type).toUpperCase()}`;
        timer.textContent = clock(current.result.durationMs);
      }
    },
  });
  button.disabled = !PerformanceRecorder.supported;
  if (!PerformanceRecorder.supported) status.textContent = text(
    '当前浏览器不支持录音，请尝试新版 Chrome、Edge 或 Safari。',
    'Recording is unavailable. Try a recent Chrome, Edge or Safari browser.');
  button.addEventListener('click', () => {
    if (recorder.state === 'recording') recorder.stop();
    else void recorder.start();
  });
  wavButton.addEventListener('click', async () => {
    if (exporting || !recorder.result) return;
    exporting = true;
    button.disabled = wavButton.disabled = true;
    wavButton.textContent = text('正在生成 WAV…', 'Preparing WAV…');
    try {
      const file = await recorder.exportWav();
      if (recorder.disposed) return;
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename;
      panel.append(link);
      link.click();
      link.remove();
      status.textContent = text('WAV 已生成。也可以下载体积更小的原始格式。', 'WAV is ready. The original format is also available as a smaller file.');
    } catch {
      if (!recorder.disposed) status.textContent = text('WAV 转换未完成，请重试，或先下载原始格式。', 'WAV conversion failed. Try again, or download the original format.');
    } finally {
      exporting = false;
      button.disabled = ['starting', 'stopping'].includes(recorder.state);
      wavButton.disabled = false;
      wavButton.textContent = text('下载 WAV', 'Download WAV');
    }
  });
  // Mobile browsers can suspend Web Audio in the background. Finish the clip
  // while leaving the last result on this page for playback/download on return.
  document.addEventListener('visibilitychange', () => { if (document.hidden) recorder.stop(); });
  window.addEventListener('pagehide', () => recorder.stop());
  window.addEventListener('beforeunload', () => recorder.dispose());
  return recorder;
}
