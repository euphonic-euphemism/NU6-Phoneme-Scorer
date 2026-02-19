
import os
import math
import wave
import struct
import sys

def calculate_dbfs(file_path):
    try:
        with wave.open(file_path, 'rb') as wav_file:
            width = wav_file.getsampwidth()
            channels = wav_file.getnchannels()
            frames = wav_file.readframes(wav_file.getnframes())
            
            # Manual RMS calculation
            # Convert bytes to integers based on width
            if width == 2: # 16-bit
                fmt = f"<{len(frames)//2}h"
                samples = struct.unpack(fmt, frames)
            elif width == 1: # 8-bit
                fmt = f"<{len(frames)}B"
                # 8-bit is unsigned 0-255, center at 128
                samples = [s - 128 for s in struct.unpack(fmt, frames)]
            elif width == 3: # 24-bit (less common, more complex to unpack)
                 # Skip for now or assume 16-bit for this app
                 return None
            else:
                 return None
            
            sum_squares = sum(s**2 for s in samples)
            rms = math.sqrt(sum_squares / len(samples))
            
            if rms == 0:
                return -float('inf')
                
            # Calculate dBFS
            # Max amplitude for N bits is 2^(N*8 - 1)
            max_amp = 2**(width*8 - 1)
            dbfs = 20 * math.log10(rms / max_amp)
            return dbfs
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def analyze_directory(directory):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    print(f"\nAnalyzing: {directory}")
    print("-" * 40)
    
    files = sorted([f for f in os.listdir(directory) if f.lower().endswith('.wav')])
    if not files:
        print("No WAV files found.")
        return

    total_dbfs = 0
    count = 0
    min_dbfs = float('inf')
    max_dbfs = -float('inf')

    for f in files:
        path = os.path.join(directory, f)
        dbfs = calculate_dbfs(path)
        if dbfs is not None:
            # print(f"{f}: {dbfs:.2f} dBFS")
            total_dbfs += dbfs
            count += 1
            if dbfs < min_dbfs: min_dbfs = dbfs
            if dbfs > max_dbfs: max_dbfs = dbfs

    if count > 0:
        avg_dbfs = total_dbfs / count
        print(f"Files: {count}")
        print(f"Average Level: {avg_dbfs:.2f} dBFS")
        print(f"Range: {min_dbfs:.2f} dBFS to {max_dbfs:.2f} dBFS")
    else:
        print("No valid audio data found.")

if __name__ == "__main__":
    analyze_directory("/home/marks/Development/nu6-phoneme-scorer/audio/HF1")
    analyze_directory("/home/marks/Development/nu6-phoneme-scorer/audio/HF4B")
