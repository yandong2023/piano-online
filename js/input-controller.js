// Unified input layer for keyboard, mouse, touch and future MIDI support.
// Product modules should subscribe to note events instead of binding their own key listeners.

export class InputController {
    constructor(piano) {
        this.piano = piano;
        this.listeners = new Set();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    emit(note, source = 'unknown') {
        this.listeners.forEach(callback => callback({ note, source }));
    }

    handleNote(note, source = 'keyboard') {
        if (!note) return;
        this.piano.audio.playNote(note);
        this.emit(note, source);
    }
}
