import soundfile as sf
import numpy as np
import os

def calculate_dbfs(data):
    """Calculates RMS and Peak dBFS of a numpy array."""
    if len(data) == 0:
        return -np.inf, -np.inf
    
    peak = np.max(np.abs(data))
    if peak == 0:
        peak_db = -np.inf
    else:
        peak_db = 20 * np.log10(peak)
        
    rms = np.sqrt(np.mean(data**2))
    if rms == 0:
        rms_db = -np.inf
    else:
        rms_db = 20 * np.log10(rms)
        
    return rms_db, peak_db

def analyze_file(filepath):
    print(f"Analyzing: {filepath}")
    if not os.path.exists(filepath):
        print("  File not found!")
        return

    try:
        data, samplerate = sf.read(filepath)
        print(f"  Sample Rate: {samplerate}, Channels: {data.ndim}")

        if data.ndim == 1:
            # Mono
            rms, peak = calculate_dbfs(data)
            print(f"  Mono - RMS: {rms:.2f} dBFS, Peak: {peak:.2f} dBFS")
        else:
            # Stereo / Multi-channel
            for i in range(data.shape[1]):
                channel_data = data[:, i]
                
                # Check if channel is silent/empty
                if np.max(np.abs(channel_data)) == 0:
                     print(f"  Channel {i+1}: Silent")
                     continue

                rms, peak = calculate_dbfs(channel_data)
                print(f"  Channel {i+1} - RMS: {rms:.2f} dBFS, Peak: {peak:.2f} dBFS")
                
                # Calculate Headroom
                headroom = 0 - peak
                print(f"    Headroom: {headroom:.2f} dB")

    except Exception as e:
        print(f"  Error analyzing file: {e}")
    print("-" * 30)

files_to_analyze = [
    "BKB-SIN/21 - Speech Spectrum Noise.flac",
    "BKB-SIN/Track 03.wav",
    "BKB-SIN/Track 04.wav"
]

print("Starting Audio Analysis...")
print("-" * 30)
for f in files_to_analyze:
    analyze_file(f)
