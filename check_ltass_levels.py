import os
import numpy as np
import scipy.io.wavfile as wav
from glob import glob

BASE_DIR = "audio"
LISTS = ["HF1", "HF2", "HF3", "HF4"]
TARGET = -23.0

def read_wav(path):
    try:
        sr, data = wav.read(path)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return None
    
    # Normalize to -1.0 to 1.0 float
    if data.dtype == np.int16: data = data / 32768.0
    elif data.dtype == np.int32: data = data / 2147483648.0
    elif data.dtype == np.uint8: data = (data - 128) / 128.0
    
    # Convert stereo to mono
    if len(data.shape) > 1: data = np.mean(data, axis=1)
    
    return data

def calculate_dbfs(data):
    rms = np.sqrt(np.mean(data**2))
    if rms == 0: return -np.inf
    return 20 * np.log10(rms)

def main():
    print("Checking LTASS Levels (Average RMS of all files)...")
    
    all_db_values = []
    total_files = 0
    
    for list_name in LISTS:
        list_dir = os.path.join(BASE_DIR, list_name)
        if not os.path.exists(list_dir): continue
        
        files = sorted(glob(os.path.join(list_dir, "*.wav")))
        for f in files:
            # Filter for words (digits) and exclude intro/noise
            fname = os.path.basename(f)
            if fname[0].isdigit() and not fname.startswith("00_Intro"):
                data = read_wav(f)
                if data is not None:
                    db = calculate_dbfs(data)
                    all_db_values.append(db)
                    total_files += 1

    if not all_db_values:
        print("No valid audio files found.")
        return

    # Calculate Average RMS (energy average, not simple arithmetic mean of dB)
    # 1. Convert dB to linear amplitude (RMS)
    # 2. Average linear values ? No, better to average power.
    # Power = 10^(dB/10)
    
    # Actually, "LTASS level" usually refers to the RMS of the concatenated signal.
    # Which is equivalent to the root mean square of all samples.
    # Since we don't have all samples loaded, we can assume equal duration or just average the dB for a rough check,
    # OR better: average the power if we assume roughly equal length. 
    # Let's simple average the dBFS first as that's how normalization works per file.
    # A "Strict" LTASS would be the RMS of the concatenation. 
    # Since `prepare_assets.py` normalizes EACH file to -23.0, the average should be EXACTLY -23.0 unless there's drift.
    
    avg_db = np.mean(all_db_values)
    min_db = np.min(all_db_values)
    max_db = np.max(all_db_values)
    
    print(f"\nTotal Words Analyzed: {total_files}")
    print(f"Target Level:       {TARGET:.2f} dBFS")
    print(f"Average Level:      {avg_db:.2f} dBFS")
    print(f"Min Level:          {min_db:.2f} dBFS")
    print(f"Max Level:          {max_db:.2f} dBFS")
    
    if abs(avg_db - TARGET) < 0.1:
        print(">> MATCHED (Average is within 0.1 dB)")
    else:
        print(">> MISMATCH (Average deviates)")

if __name__ == "__main__":
    main()
