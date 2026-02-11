import os
import shutil
import subprocess
import sys

# Configuration
APP_AUDIO_BASE = "/home/marks/Development/nu6-phoneme-scorer/audio"

# Constants
TARGET_DBFS_SPEECH = -24.2
SILENCE_THRESHOLD_DB = -50

# Paths to tools
# We use the ffmpeg-normalize installed in the local venv
FFMPEG_NORMALIZE_BIN = "./audio_env/bin/ffmpeg-normalize"
FFMPEG_BIN = "ffmpeg" # System ffmpeg

def normalize_file(src, dest, target_db):
    """
    Normalizes file using ffmpeg-normalize with RMS mode.
    """
    # ffmpeg-normalize input -o output --normalization-type rms --target-level X --force
    cmd = [
        FFMPEG_NORMALIZE_BIN,
        src,
        "-o", dest,
        "--normalization-type", "rms",
        "--target-level", str(target_db),
        "--force", # overwrite
        "--quiet"
    ]
    
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f"   ERROR normalizing {src}: {e}")
        return False
    return True

def trim_silence(src_dest_path):
    """
    Trims silence from start and end of the file in-place (technically via tmp file).
    Uses ffmpeg silenceremove + reverse method.
    """
    tmp_path = src_dest_path + ".tmp.wav"
    
    filter_chain = (
        f"silenceremove=start_periods=1:start_duration=0:start_threshold={SILENCE_THRESHOLD_DB}dB,"
        "areverse,"
        f"silenceremove=start_periods=1:start_duration=0:start_threshold={SILENCE_THRESHOLD_DB}dB,"
        "areverse"
    )

    cmd = [
        FFMPEG_BIN,
        "-y", # overwrite
        "-i", src_dest_path,
        "-af", filter_chain,
        tmp_path
    ]

    try:
        subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.move(tmp_path, src_dest_path)
    except subprocess.CalledProcessError as e:
        print(f"   ERROR trimming {src_dest_path}: {e}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def process_file(filepath, target_db):
    if not os.path.exists(filepath):
        return

    print(f"Processing: {os.path.basename(filepath)}")
    
    # 1. Normalize (overwrite in place effectively, as src==dest usage in other script implies distinct src/dest, 
    # but here we want to update the file. ffmpeg-normalize supports overwrite if -o is same?)
    # Safest to normalize to a temp file then move back, or use the tool's behavior.
    # The existing script used different src and dest folders.
    # Here files are already in place.
    
    tmp_norm = filepath + ".norm.wav"
    
    success = normalize_file(filepath, tmp_norm, target_db)
    if not success:
        return

    # 2. Trim (modifies tmp_norm in place)
    trim_silence(tmp_norm)
    
    # 3. Replace original
    shutil.move(tmp_norm, filepath)
    print(f"   -> Done")


def main():
    # Verify tools
    if not os.path.exists(FFMPEG_NORMALIZE_BIN):
        print(f"ERROR: ffmpeg-normalize not found at {FFMPEG_NORMALIZE_BIN}")
        print("Please run this from the project root where audio_env is located.")
        sys.exit(1)

    folders_to_process = ["HF3", "HF4"]
    
    for folder in folders_to_process:
        dir_path = os.path.join(APP_AUDIO_BASE, folder)
        if not os.path.exists(dir_path):
            print(f"Directory not found: {dir_path}")
            continue
            
        print(f"\n--- Processing {folder} ---")
        files = sorted([f for f in os.listdir(dir_path) if f.endswith(".wav")])
        
        for filename in files:
            filepath = os.path.join(dir_path, filename)
            process_file(filepath, TARGET_DBFS_SPEECH)

if __name__ == "__main__":
    main()
