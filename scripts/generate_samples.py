import numpy as np
from scipy.io import wavfile
from scipy.signal import sawtooth
import os

def generate_piano_note(freq, duration=1.0, sample_rate=44100, amplitude=0.5):
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Generate a complex waveform that approximates a piano note
    fundamental = amplitude * np.sin(2 * np.pi * freq * t)
    second_harmonic = 0.5 * amplitude * np.sin(2 * np.pi * (2 * freq) * t)
    third_harmonic = 0.25 * amplitude * np.sin(2 * np.pi * (3 * freq) * t)
    
    # Combine harmonics
    note = fundamental + second_harmonic + third_harmonic
    
    # Apply envelope
    envelope = np.exp(-3 * t)
    note = note * envelope
    
    # Normalize
    note = note / np.max(np.abs(note))
    
    return note

def note_to_freq(note):
    # A4 = 440Hz
    # Each semitone is a factor of 2^(1/12)
    A4 = 440
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    octave = int(note[-1])
    note_name = note[:-1]
    
    semitones_from_a4 = (octave - 4) * 12 + notes.index(note_name) - notes.index('A')
    return A4 * (2 ** (semitones_from_a4 / 12))

def generate_piano_samples():
    if not os.path.exists('../samples'):
        os.makedirs('../samples')
    
    # Generate F notes from F1 to F6
    for octave in range(1, 7):
        note = f'F{octave}'
        freq = note_to_freq(note)
        audio_data = generate_piano_note(freq)
        
        # Convert to 16-bit PCM
        audio_data_16bit = (audio_data * 32767).astype(np.int16)
        
        # Save as WAV first
        wav_path = f'../samples/piano-{note}.wav'
        wavfile.write(wav_path, 44100, audio_data_16bit)
        
        # Convert to MP3 using ffmpeg
        mp3_path = f'../samples/piano-{note}.mp3'
        os.system(f'ffmpeg -i {wav_path} -codec:a libmp3lame -qscale:a 2 {mp3_path}')
        
        # Remove WAV file
        os.remove(wav_path)
        print(f'Generated {mp3_path}')

if __name__ == '__main__':
    generate_piano_samples()
