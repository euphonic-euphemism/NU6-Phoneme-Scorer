import os
import shutil
from pydub import AudioSegment

# Configuration
# Mapping of Source Directory -> Target Directory
# (relative to this script's location)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")

FORM_MAPPING = {
    "Form_1": "HF1",
    "Form_2": "HF2",
    "Form_3": "HF3",
    "Form_4": "HF4"
}

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

def process_folder(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output folder: {output_dir}")

    # Process Speech Files
    if not os.path.exists(input_dir):
        print(f"Skipping missing input folder: {input_dir}")
        return

    files = sorted([f for f in os.listdir(input_dir) if f.endswith(".wav")])
    for filename in files:
        # Filter Logic - we want numbered files and Intro
        # Skip noise files if they are in there (usually they are separate)
        if "MasterNoise" in filename or "Calibration" in filename:
            continue
            
        is_valid_file = False
        if filename.startswith("00_Intro"):
            is_valid_file = True
        else:
            # check if starts with number
            parts = filename.split('_')
            if len(parts) > 0 and parts[0].isdigit():
                is_valid_file = True
        
        if not is_valid_file:
            print(f"Skipping non-speech file: {filename}")
            continue

        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        print(f"Processing: {filename} -> {os.path.basename(output_dir)}")
        try:
            audio = AudioSegment.from_file(input_path)
            
            # 1. Trim Silence FIRST
            # We want the active speech to be at the target level.
            # Trimming does not change the amplitude of samples, just duration.
            trimmed_audio = trim_silence(audio)

            # 2. Normalize trimmed audio
            # Now RMS calculation is based mostly on speech energy.
            normalized_audio = match_target_amplitude(trimmed_audio, TARGET_DBFS)
            
            normalized_audio.export(output_path, format="wav")
            # print(f"   Saved: {output_path}")
            
        except Exception as e:
            print(f"   Error processing {filename}: {e}")

def main():
    print("Starting normalization of Rose Hill HF Forms...")
    
    for src_name, dst_name in FORM_MAPPING.items():
        src_path = os.path.join(AUDIO_DIR, src_name)
        dst_path = os.path.join(AUDIO_DIR, dst_name)
        
        print(f"\nProcessing {src_name} -> {dst_name}")
        process_folder(src_path, dst_path)
        
    print("\nNormalization complete.")

if __name__ == "__main__":
    main()
