import { songs, calculateScore } from './practice-songs.js';
import { t } from './i18n.js';

const PROGRESS_STORAGE_KEY = 'piano-online-progress-v1';

class PracticeMode {
    constructor(piano) {
        this.piano = piano;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        this.isPlaying = false;
        this.startTime = null;
        this.correctNotes = 0;
        this.wrongNotes = 0;
        this.resultModal = null;

        this.loadResultStyles();
        this.initializeUI();
    }

    loadResultStyles() {
        if (document.querySelector('link[data-practice-result-styles]')) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/practice-result.css';
        link.dataset.practiceResultStyles = 'true';
        document.head.appendChild(link);
    }

    initializeUI() {
        this.songSelect = document.getElementById('song-select');
        this.startButton = document.getElementById('start-practice');
        this.stopButton = document.getElementById('stop-practice');
        this.practiceStats = document.getElementById('practice-stats');
        this.correctNotesSpan = document.getElementById('correct-notes');
        this.wrongNotesSpan = document.getElementById('wrong-notes');
        this.progressSpan = document.getElementById('progress');
        this.keyHint = document.getElementById('key-hint');
        this.keyHintKey = this.keyHint?.querySelector('.hint-key');
        this.keyHintNote = this.keyHint?.querySelector('.hint-note');

        if (!this.songSelect || !this.startButton || !this.stopButton || !this.practiceStats) {
            console.error('Practice mode UI is incomplete');
            return;
        }

        this.startButton.disabled = true;
        this.startButton.textContent = `✨ ${t('practice.start')}`;
        this.stopButton.textContent = t('practice.stop');
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        this.songSelect.addEventListener('change', (event) => {
            const songId = event.target.value;
            this.currentSong = songId && songs[songId]
                ? { ...songs[songId], id: songId }
                : null;
            this.startButton.disabled = !this.currentSong;
            this.emitPracticeEvent('songchange', {
                songId: this.currentSong?.id || null,
                noteIndex: 0
            });
        });

        this.startButton.addEventListener('click', () => this.startPractice());
        this.stopButton.addEventListener('click', () => this.stopPractice());
        this.piano.onNotePlay = (note) => this.handleNotePlayed(note);
    }

    startPractice() {
        if (!this.currentSong) {
            this.showTransientMessage(t('practice.noSong'));
            return;
        }

        this.closeResultModal();
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.correctNotes = 0;
        this.wrongNotes = 0;
        this.startTime = Date.now();

        this.startButton.style.display = 'none';
        this.stopButton.style.display = 'block';
        this.practiceStats.style.display = 'block';
        if (this.keyHint) this.keyHint.style.display = 'block';

        this.updateStats();
        this.updateKeyHint();
        this.emitPracticeEvent('start', {
            songId: this.currentSong.id,
            noteIndex: 0,
            totalNotes: this.currentSong.notes.length
        });
        this.track('song_start', { song_id: this.currentSong.id });
    }

    stopPractice({ completed = false, showResult = false } = {}) {
        if (!this.isPlaying && !showResult) return;

        this.isPlaying = false;
        this.startButton.style.display = 'block';
        this.stopButton.style.display = 'none';
        this.practiceStats.style.display = 'none';
        if (this.keyHint) this.keyHint.style.display = 'none';
        this.clearKeyHighlight();
        this.emitPracticeEvent('stop', {
            songId: this.currentSong?.id || null,
            noteIndex: this.currentNoteIndex,
            completed
        });

        if (showResult && this.currentSong) {
            this.showResultModal({ completed });
        }
    }

    finishPractice() {
        this.emitPracticeEvent('progress', {
            songId: this.currentSong.id,
            noteIndex: this.currentSong.notes.length,
            totalNotes: this.currentSong.notes.length,
            completed: true
        });
        this.stopPractice({ completed: true, showResult: true });
        this.track('song_complete', {
            song_id: this.currentSong.id,
            correct_notes: this.correctNotes,
            wrong_notes: this.wrongNotes
        });
    }

    handleNotePlayed(note) {
        if (!this.isPlaying || !this.currentSong) return;

        const expectedNote = this.currentSong.notes[this.currentNoteIndex];
        const keyElement = this.piano.keys[note];

        if (note === expectedNote) {
            this.correctNotes += 1;
            this.currentNoteIndex += 1;
            this.flashKey(keyElement, 'success', 450);

            if (this.currentNoteIndex >= this.currentSong.notes.length) {
                this.finishPractice();
                return;
            }
        } else {
            this.wrongNotes += 1;
            this.flashKey(keyElement, 'error', 350);
        }

        this.updateStats();
        this.updateKeyHint();
        this.emitPracticeEvent('progress', {
            songId: this.currentSong.id,
            noteIndex: this.currentNoteIndex,
            totalNotes: this.currentSong.notes.length,
            correctNotes: this.correctNotes,
            wrongNotes: this.wrongNotes,
            expectedNote: this.currentSong.notes[this.currentNoteIndex]
        });
    }

    flashKey(keyElement, className, duration) {
        if (!keyElement) return;
        keyElement.classList.add(className);
        window.setTimeout(() => keyElement.classList.remove(className), duration);
    }

    updateStats() {
        const totalNotes = this.currentSong?.notes.length || 0;
        const progress = totalNotes
            ? Math.round((this.currentNoteIndex / totalNotes) * 100)
            : 0;

        if (this.correctNotesSpan) {
            this.correctNotesSpan.textContent = `${t('practice.correct')}: ${this.correctNotes}`;
        }
        if (this.wrongNotesSpan) {
            this.wrongNotesSpan.textContent = `${t('practice.wrong')}: ${this.wrongNotes}`;
        }
        if (this.progressSpan) {
            this.progressSpan.textContent = `${t('practice.progress')}: ${progress}%`;
        }
    }

    updateKeyHint() {
        if (!this.isPlaying || !this.currentSong) return;

        const currentNote = this.currentSong.notes[this.currentNoteIndex];
        const keyboardKey = this.getKeyboardKeyForNote(currentNote);

        if (this.keyHintKey) this.keyHintKey.textContent = keyboardKey;
        if (this.keyHintNote) this.keyHintNote.textContent = currentNote;
        this.highlightKey(currentNote);
    }

    getKeyboardKeyForNote(note) {
        const candidates = Object.entries(this.piano.keyMap)
            .filter(([, mappedNote]) => mappedNote === note)
            .map(([key]) => key);

        const priority = (key) => {
            if (/^[a-z]$/.test(key)) return 0;
            if (/^[0-9]$/.test(key)) return 1;
            return 2;
        };

        candidates.sort((a, b) => priority(a) - priority(b));
        return candidates[0]?.toUpperCase() || '';
    }

    highlightKey(note) {
        this.clearKeyHighlight();
        document.querySelectorAll('.key').forEach((key) => {
            if (key.dataset.note === note) key.classList.add('current');
        });
    }

    clearKeyHighlight() {
        document.querySelectorAll('.key.current').forEach((key) => {
            key.classList.remove('current');
        });
    }

    showResultModal({ completed }) {
        this.closeResultModal();

        const totalAttempts = this.correctNotes + this.wrongNotes;
        const accuracy = totalAttempts
            ? Math.round((this.correctNotes / totalAttempts) * 100)
            : 0;
        const score = calculateScore(this.correctNotes, this.wrongNotes);
        const durationSeconds = Math.max(0, Math.round((Date.now() - this.startTime) / 1000));
        const duration = this.formatDuration(durationSeconds);
        const progress = this.saveProgress(score, accuracy, durationSeconds, completed);

        const modal = document.createElement('div');
        modal.className = 'practice-result-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'practice-result-title');

        const nextSongOption = this.getNextSongOption();
        modal.innerHTML = `
            <div class="practice-result-card">
                <h2 id="practice-result-title">${completed ? '🎉 ' : ''}${t(completed ? 'practice.completedTitle' : 'practice.stoppedTitle')}</h2>
                <p class="practice-result-song">${this.escapeHtml(this.getSongName())}</p>
                <div class="practice-result-score">${score}</div>
                ${progress.isNewBest ? `<div class="practice-result-badge">${t('practice.newBest')}</div>` : ''}
                <div class="practice-result-grid">
                    <div class="practice-result-stat"><strong>${accuracy}%</strong><span>${t('practice.accuracy')}</span></div>
                    <div class="practice-result-stat"><strong>${duration}</strong><span>${t('practice.duration')}</span></div>
                    <div class="practice-result-stat"><strong>${progress.bestScore}</strong><span>${t('practice.bestScore')}</span></div>
                </div>
                <div class="practice-result-actions">
                    <button type="button" class="btn primary" data-action="retry">${t('practice.practiceAgain')}</button>
                    ${nextSongOption ? `<button type="button" class="btn secondary" data-action="next">${t('practice.nextSong')}</button>` : ''}
                    <button type="button" class="btn secondary" data-action="close">${t('practice.close')}</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-action="close"]')) {
                this.closeResultModal();
                return;
            }

            if (event.target.closest('[data-action="retry"]')) {
                this.startPractice();
                return;
            }

            if (event.target.closest('[data-action="next"]') && nextSongOption) {
                this.songSelect.value = nextSongOption.value;
                this.songSelect.dispatchEvent(new Event('change', { bubbles: true }));
                this.startPractice();
            }
        });

        document.body.appendChild(modal);
        this.resultModal = modal;
        modal.querySelector('[data-action="retry"]')?.focus();
    }

    getNextSongOption() {
        const options = Array.from(this.songSelect.options).filter((option) => option.value);
        const currentIndex = options.findIndex((option) => option.value === this.currentSong?.id);
        return currentIndex >= 0 ? options[currentIndex + 1] || null : null;
    }

    getSongName() {
        const selectedOption = this.songSelect.selectedOptions?.[0];
        return selectedOption?.textContent?.replace(/^\S+\s*/, '').trim()
            || this.currentSong?.nameEn
            || this.currentSong?.name
            || '';
    }

    saveProgress(score, accuracy, durationSeconds, completed) {
        let progress = {};
        try {
            progress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
        } catch {
            progress = {};
        }

        const previous = progress[this.currentSong.id] || {};
        const bestScore = Math.max(previous.bestScore || 0, score);
        const isNewBest = score > (previous.bestScore || 0);

        progress[this.currentSong.id] = {
            bestScore,
            bestAccuracy: Math.max(previous.bestAccuracy || 0, accuracy),
            bestDurationSeconds: previous.bestDurationSeconds
                ? Math.min(previous.bestDurationSeconds, durationSeconds)
                : durationSeconds,
            completed: Boolean(previous.completed || completed),
            attempts: (previous.attempts || 0) + 1,
            lastPracticedAt: new Date().toISOString()
        };

        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        return { bestScore, isNewBest };
    }

    formatDuration(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    closeResultModal() {
        this.resultModal?.remove();
        this.resultModal = null;
    }

    showTransientMessage(message) {
        const element = document.createElement('div');
        element.className = 'practice-result-badge';
        element.style.position = 'fixed';
        element.style.left = '50%';
        element.style.bottom = '32px';
        element.style.zIndex = '10001';
        element.style.transform = 'translateX(-50%)';
        element.textContent = message;
        document.body.appendChild(element);
        window.setTimeout(() => element.remove(), 2200);
    }

    escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value;
        return element.innerHTML;
    }

    emitPracticeEvent(name, detail) {
        document.dispatchEvent(new CustomEvent(`piano:practice-${name}`, { detail }));
    }

    track(eventName, params) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
    }
}

export { PracticeMode };
