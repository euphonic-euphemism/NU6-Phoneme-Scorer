import numpy as np
import scipy.signal as signal
from scipy.io import wavfile
import subprocess
import re
import os

def generate_pink_noise(samples):
    white = np.random.randn(samples)
    X = np.fft.rfft(white)
    f = np.fft.rfftfreq(samples)
    f[0] = f[1]
    X /= np.sqrt(f)
    return np.fft.irfft(X, n=samples)

def check_volume(filepath):
    cmd = [
        "ffmpeg",
        "-i", filepath,
        "-filter:a", "volumedetect",
        "-f", "null",
        "-"
    ]
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    
    mean_match = re.search(r"mean_volume: ([\-\d\.]+) dB", result.stderr)
    max_match = re.search(r"max_volume: ([\-\d\.]+) dB", result.stderr)
    
    if mean_match and max_match:
        return float(mean_match.group(1)), float(max_match.group(1))
    return None, None

def main():
    sr = 44100
    duration = 60 # seconds
    samples = int(sr * duration)
    
    print("Generating pink noise...")
    pink = generate_pink_noise(samples)
    
    print("Filtering 4000 Hz to 12000 Hz...")
    nyq = 0.5 * sr
    low = 4000 / nyq
    high = 12000 / nyq
    sos = signal.butter(8, [low, high], btype='bandpass', output='sos')
    filtered = signal.sosfilt(sos, pink)
    
    print("Normalizing to -23 dBFS...")
    current_rms = np.sqrt(np.mean(filtered**2))
    target_rms = 10**(-23.0 / 20.0)
    
    normalized = filtered * (target_rms / current_rms)
    
    max_amp = np.max(np.abs(normalized))
    print(f"Max peak amplitude after normalization: {max_amp:.4f} (must be < 1.0)")
    if max_amp >= 1.0:
        print("WARNING: Peak amplitude exceeds 1.0. Clipping will occur.")
        
    # Convert to 16-bit PCM
    int_signal = np.int16(normalized * 32767)
    
    out_file = "pink_noise_4kHz_12kHz_cal_23dBFS.wav"
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), out_file)
    wavfile.write(out_path, sr, int_signal)
    print(f"Saved to {out_path}")
    
    print("Verifying with ffmpeg volumedetect...")
    mean_vol, max_vol = check_volume(out_path)
    print(f"ffmpeg mean_volume: {mean_vol} dB")
    print(f"ffmpeg max_volume: {max_vol} dB")

if __name__ == "__main__":
    main()
