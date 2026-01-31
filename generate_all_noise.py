import os
import numpy as np
import scipy.io.wavfile as wav
from glob import glob

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
NOISE_OUTPUT_DIR = os.path.join(AUDIO_DIR, "noise")

LISTS = ["HF1", "HF2", "HF3", "HF4"]
TARGET_SPEECH_DBFS = -23.0 # Matches our normalization target
SILENCE_THRESH_DB = -50.0

def read_wav(path):
    try:
        sr, data = wav.read(path)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return 0, np.array([])
    
    # Normalize to -1.0 to 1.0 float
    if data.dtype == np.int16: data = data / 32768.0
    elif data.dtype == np.int32: data = data / 2147483648.0
    elif data.dtype == np.uint8: data = (data - 128) / 128.0
    
    # Convert stereo to mono
    if len(data.shape) > 1: data = np.mean(data, axis=1)
    
    return sr, data.astype(np.float32)

def write_wav(path, sr, data):
    # Clip to avoid wrapping
    final_data = np.clip(data, -1.0, 1.0)
    wav.write(path, sr, (final_data * 32767).astype(np.int16))

def trim_silence(data, threshold_db):
    rms = np.sqrt(np.mean(data**2))
    if rms == 0: return data
    curr_db = 20 * np.log10(rms)
    if curr_db < threshold_db: return np.array([])

    abs_data = np.abs(data)
    thresh = 10**(threshold_db/20)
    mask = abs_data > thresh
    indices = np.where(mask)[0]
    if len(indices) == 0: return data
    return data[indices[0]:indices[-1]]

def set_rms(data, target_db):
    rms = np.sqrt(np.mean(data**2))
    if rms == 0: return data
    current_db = 20 * np.log10(rms)
    gain = 10**((target_db - current_db) / 20)
    return data * gain

def generate_ssn(file_list):
    print(f"  > Generating Master Noise from {len(file_list)} target words...")
    all_audio = []
    sr_ref = 44100
    
    for f in file_list:
        sr, audio = read_wav(f)
        if sr == 0: continue
        sr_ref = sr
        # Trim silence to ensure steady-state spectral density
        trimmed = trim_silence(audio, SILENCE_THRESH_DB)
        if len(trimmed) > 0:
            all_audio.append(trimmed)

    if not all_audio:
        print("    No audio data found!")
        return None, sr_ref

    concat_speech = np.concatenate(all_audio)
    
    # FFT
    fft_speech = np.fft.rfft(concat_speech)
    
    # Randomize Phases
    phases = np.exp(2j * np.pi * np.random.rand(len(fft_speech)))
    noise_fft = np.abs(fft_speech) * phases
    
    # Inverse FFT
    ssn = np.fft.irfft(noise_fft)
    
    return ssn, sr_ref

def main():
    if not os.path.exists(NOISE_OUTPUT_DIR):
        os.makedirs(NOISE_OUTPUT_DIR)

    for list_name in LISTS:
        list_dir = os.path.join(AUDIO_DIR, list_name)
        if not os.path.exists(list_dir):
            print(f"Directory not found: {list_dir}")
            continue
            
        print(f"\nProcessing {list_name}...")
        
        # Get all wav files in the list directory
        # We assume files are already normalized and trimmed from previous step
        wav_files = sorted(glob(os.path.join(list_dir, "*.wav")))
        
        # Filter for words (usually start with digits)
        word_files = []
        for f in wav_files:
            fname = os.path.basename(f)
            # Simple check: starts with digit or is intro
            # Actually, standardizing on words only is best for speech spectrum
            if fname[0].isdigit() and not fname.startswith("00_Intro"):
                word_files.append(f)
        
        if not word_files:
            print(f"  No word files found in {list_dir}")
            continue
            
        # Generate SSN
        noise_data, sr = generate_ssn(word_files)
        
        if noise_data is not None:
             # Normalize noise to match target speech level
            noise_norm = set_rms(noise_data, TARGET_SPEECH_DBFS)
            
            output_filename = f"{list_name}_MasterNoise.wav"
            output_path = os.path.join(NOISE_OUTPUT_DIR, output_filename)
            
            write_wav(output_path, sr, noise_norm)
            print(f"  Saved: {output_path}")

    # --- Global Noise Generation ---
    print("\nGenerating Global HF Master Noise (from all 100 words)...")
    all_global_words = []
    
    for list_name in LISTS:
        list_dir = os.path.join(AUDIO_DIR, list_name)
        if not os.path.exists(list_dir): continue
        wav_files = sorted(glob(os.path.join(list_dir, "*.wav")))
        for f in wav_files:
            fname = os.path.basename(f)
            if fname[0].isdigit() and not fname.startswith("00_Intro"):
                all_global_words.append(f)
    
    if all_global_words:
        global_noise_data, sr = generate_ssn(all_global_words)
        if global_noise_data is not None:
            # Normalize
            global_noise_norm = set_rms(global_noise_data, TARGET_SPEECH_DBFS)
            
            # Ensure calibration dir exists
            cal_dir = os.path.join(AUDIO_DIR, "calibration")
            if not os.path.exists(cal_dir):
                os.makedirs(cal_dir)
                
            output_path = os.path.join(cal_dir, "Global_HF_MasterNoise.wav")
            write_wav(output_path, sr, global_noise_norm)
            print(f"  Saved Global Calibration Noise: {output_path}")

    print("\nAll noise files generated.")

if __name__ == "__main__":
    main()
