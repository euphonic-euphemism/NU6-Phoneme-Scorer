import os
import numpy as np
import scipy.io.wavfile as wav

CAL_TONE_PATH = "audio/calibration/000_Master_Calibration_1kHz.wav"
CAL_NOISE_PATH = "audio/calibration/Global_HF_MasterNoise.wav"

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
    print("Comparing Calibration Levels...")
    
    tone_data = read_wav(CAL_TONE_PATH)
    noise_data = read_wav(CAL_NOISE_PATH)
    
    if tone_data is None:
        print(f"Missing Tone File: {CAL_TONE_PATH}")
    else:
        tone_db = calculate_dbfs(tone_data)
        print(f"Calibration Tone Level:  {tone_db:.2f} dBFS")
        
    if noise_data is None:
        print(f"Missing Noise File: {CAL_NOISE_PATH}")
    else:
        noise_db = calculate_dbfs(noise_data)
        print(f"Calibration Noise Level: {noise_db:.2f} dBFS")
        
    if tone_data is not None and noise_data is not None:
        diff = abs(tone_db - noise_db)
        print(f"\nDifference: {diff:.2f} dB")
        if diff < 0.1:
            print(">> MATCHED")
        else:
            print(">> MISMATCH")

if __name__ == "__main__":
    main()
