import os
import shutil
from pydub import AudioSegment

# Configuration
INPUT_FOLDER = "/home/marks/Development/Rose Hill HF Word Lists/Form_1"
NOISE_FILE_NAME = "Form_1_Python_MasterNoise.wav"
OUTPUT_FOLDER = "App_Assets_Normalized"
TARGET_DBFS = -23.0

def match_target_amplitude(sound, target_dBFS):
    change_in_dBFS = target_dBFS - sound.dBFS
    return sound.apply_gain(change_in_dBFS)

def trim_silence(sound, silence_threshold=-50.0, chunk_size=10):
    # Detect leading silence
    trim_start = 0
    while trim_start < len(sound) and sound[trim_start:trim_start+chunk_size].dBFS < silence_threshold:
        trim_start += chunk_size

    # Detect trailing silence
    trim_end = len(sound)
    while trim_end > trim_start and sound[trim_end-chunk_size:trim_end].dBFS < silence_threshold:
        trim_end -= chunk_size
        
    return sound[trim_start:trim_end]

def main():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output folder: {OUTPUT_FOLDER}")

    # 1. Process Noise File
    noise_path = os.path.join(INPUT_FOLDER, NOISE_FILE_NAME)
    if os.path.exists(noise_path):
        print(f"Processing Noise: {NOISE_FILE_NAME}")
        try:
            noise = AudioSegment.from_file(noise_path)
            # Normalize only
            normalized_noise = match_target_amplitude(noise, TARGET_DBFS)
            
            out_path = os.path.join(OUTPUT_FOLDER, NOISE_FILE_NAME)
            normalized_noise.export(out_path, format="wav")
            print(f"   Saved: {out_path}")
        except Exception as e:
            print(f"   Error processing noise: {e}")
    else:
        print(f"WARNING: Noise file not found at {noise_path}")

    # 1b. Process Calibration Tone
    cal_file_name = "000_Master_Calibration_1kHz.wav"
    # Assuming it's in the root of Rose Hill folder, which is one level up from INPUT_FOLDER (Form_1)
    # OR simply defined by user as "in the root folder".
    # Based on find_by_name: /home/marks/Development/Rose Hill HF Word Lists/000_Master_Calibration_1kHz.wav
    cal_path = "/home/marks/Development/Rose Hill HF Word Lists/000_Master_Calibration_1kHz.wav"
    
    if os.path.exists(cal_path):
        print(f"Processing Calibration: {cal_file_name}")
        try:
            cal_audio = AudioSegment.from_file(cal_path)
            # Normalize only (Do NOT trim)
            normalized_cal = match_target_amplitude(cal_audio, TARGET_DBFS)
            
            out_path = os.path.join(OUTPUT_FOLDER, cal_file_name)
            normalized_cal.export(out_path, format="wav")
            print(f"   Saved: {out_path}")
        except Exception as e:
            print(f"   Error processing calibration: {e}")
    else:
        print(f"WARNING: Calibration file not found at {cal_path}")

    # 2. Process Speech Files
    files = sorted([f for f in os.listdir(INPUT_FOLDER) if f.endswith(".wav")])
    for filename in files:
        # Filter Logic
        if filename == NOISE_FILE_NAME:
            continue # Already handled
        if "Final" in filename or "Master" in filename or "Stereo" in filename:
            continue
        if not (filename[0].isdigit() or filename.startswith("00_Intro")):
            continue
        
        # Check for numeric start 01-25 or 00
        # A simple digit check is likely enough based on prompt, but let's be safe
        is_valid_start = False
        if filename.startswith("00_Intro"):
            is_valid_start = True
        else:
            # check if starts with number
            prefix = filename.split('_')[0]
            if prefix.isdigit() and 1 <= int(prefix) <= 25:
                is_valid_start = True
        
        if not is_valid_start:
            print(f"Skipping filter-out: {filename}")
            continue

        filepath = os.path.join(INPUT_FOLDER, filename)
        print(f"Processing Speech: {filename}")
        try:
            audio = AudioSegment.from_file(filepath)
            
            # Normalize
            normalized_audio = match_target_amplitude(audio, TARGET_DBFS)
            
            # Trim Silence
            trimmed_audio = trim_silence(normalized_audio)
            
            out_path = os.path.join(OUTPUT_FOLDER, filename)
            trimmed_audio.export(out_path, format="wav")
            print(f"   Saved: {out_path}")
            
        except Exception as e:
            print(f"   Error processing {filename}: {e}")

if __name__ == "__main__":
    main()
