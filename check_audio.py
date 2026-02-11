import os
import wave

AUDIO_PATH = "audio/HF1/01_Check.wav"

try:
    if not os.path.exists(AUDIO_PATH):
        print(f"File not found: {AUDIO_PATH}")
    else:
        with wave.open(AUDIO_PATH, 'rb') as wav_file:
            print(f"File: {AUDIO_PATH}")
            print(f"Channels: {wav_file.getnchannels()}")
            print(f"Sample Width: {wav_file.getsampwidth()}")
            print(f"Frame Rate: {wav_file.getframerate()}")
            print(f"Frames: {wav_file.getnframes()}")
            print("WAV file appears valid and readable.")
except Exception as e:
    print(f"Error reading WAV: {e}")
