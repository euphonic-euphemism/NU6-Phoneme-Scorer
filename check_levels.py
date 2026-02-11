import os
from pydub import AudioSegment

def check_file(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    
    try:
        audio = AudioSegment.from_file(path)
        print(f"File: {path}")
        print(f"  dBFS: {audio.dBFS:.2f}")
        print(f"  Duration: {len(audio)}ms")
        print(f"  Channels: {audio.channels}")
        print("-" * 20)
    except Exception as e:
        print(f"Error reading {path}: {e}")

files_to_check = [
    "audio/HF1/01_Check.wav",
    "audio/HF3/01_Sick.wav",
    "audio/HF4/01_Sock.wav"
]

for f in files_to_check:
    check_file(f)
