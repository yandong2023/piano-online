import numpy as np
from scipy.io import wavfile
import os
from scipy.io.wavfile import write
import subprocess

def note_to_freq(note):
    # 音符到频率的映射
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    octave = int(note[-1])
    note_name = note[:-1]
    
    if note_name not in notes:
        raise ValueError(f"Invalid note name: {note_name}")
    
    # A4 = 440Hz
    A4 = 440
    notes_from_A4 = notes.index(note_name) - notes.index('A') + (octave - 4) * 12
    
    return A4 * (2 ** (notes_from_A4 / 12))

def generate_piano_note(freq, duration=2.0, sample_rate=44100, decay_factor=5.0):
    """生成钢琴音色的音符"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 基频
    fundamental = np.sin(2 * np.pi * freq * t)
    
    # 添加泛音
    harmonics = [
        0.5 * np.sin(2 * np.pi * (2 * freq) * t),  # 八度
        0.3 * np.sin(2 * np.pi * (3 * freq) * t),  # 十二度
        0.2 * np.sin(2 * np.pi * (4 * freq) * t),  # 双八度
    ]
    
    # 合并所有波形
    wave = fundamental + sum(harmonics)
    
    # 添加衰减包络
    envelope = np.exp(-decay_factor * t)
    wave = wave * envelope
    
    # 归一化
    wave = wave / np.max(np.abs(wave))
    
    return wave

def save_as_mp3(wav_path, mp3_path):
    """将WAV文件转换为MP3"""
    subprocess.run([
        'ffmpeg', '-i', wav_path,
        '-codec:a', 'libmp3lame',
        '-qscale:a', '2',
        mp3_path,
        '-y'  # 覆盖已存在的文件
    ], capture_output=True)
    
    # 删除临时的WAV文件
    os.remove(wav_path)

def generate_note_file(note, output_dir='samples'):
    """生成指定音符的音频文件"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    freq = note_to_freq(note)
    wave = generate_piano_note(freq)
    
    # 首先保存为WAV
    wav_path = os.path.join(output_dir, f'temp_{note}.wav')
    mp3_path = os.path.join(output_dir, f'piano-{note}.mp3')
    
    # 保存为16位WAV
    wave = np.int16(wave * 32767)
    write(wav_path, 44100, wave)
    
    # 转换为MP3
    save_as_mp3(wav_path, mp3_path)
    print(f"Generated {mp3_path}")

def main():
    # 需要生成的音符列表
    notes = ['B4', 'D4', 'E4', 'G4', 'D5', 'E5', 'G5']
    
    for note in notes:
        if not os.path.exists(f'samples/piano-{note}.mp3'):
            generate_note_file(note)
        else:
            print(f"Skipping piano-{note}.mp3 - already exists")

if __name__ == '__main__':
    main()
