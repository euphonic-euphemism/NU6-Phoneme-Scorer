
import os
import subprocess
import re
import math

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, "BKB-SIN")
TARGET_MEAN_DB = -23.0
TOLERANCE_DB = 0.5

def get_mean_volume(filepath):
    """
    Calculates RMS dBFS using ffmpeg volumedetect filter
    """
    cmd = [
        "ffmpeg",
        "-i", filepath,
        "-filter:a", "volumedetect",
        "-f", "null",
        "-"
    ]
    # Redirect stderr to pipe to capture output
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    
    # Parse mean_volume from output
    # [Parsed_volumedetect_0 @ ...] mean_volume: -26.4 dB
    match = re.search(r"mean_volume: ([\-\d\.]+) dB", result.stderr)
    if match:
        return float(match.group(1))
    return None

def apply_gain(filepath, gain_db):
    """
    Applies gain to the file using ffmpeg volume filter.
    Overwrites the original file via a temporary file.
    """
    tmp_path = filepath + ".tmp.wav"
    # Ensure extension matches or convert to wav if needed. Original files are differnet formats?
    # BKB-SIN has .wav and .flac
    # We should preserve format.
    
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".flac":
         tmp_path = filepath + ".tmp.flac"
    
    cmd = [
        "ffmpeg",
        "-y",
        "-i", filepath,
        "-filter:a", f"volume={gain_db}dB",
        tmp_path,
        "-loglevel", "error"
    ]
    
    # Run ffmpeg
    subprocess.run(cmd, check=True)
    
    # Replace original
    os.replace(tmp_path, filepath)

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Error: Directory not found: {INPUT_DIR}")
        return

    print(f"Normalizing BKB-SIN audio in {INPUT_DIR} to {TARGET_MEAN_DB} dB mean volume...")
    
    # List all audio files
    files = sorted([f for f in os.listdir(INPUT_DIR) if f.lower().endswith((".wav", ".flac", ".mp3"))])
    
    if not files:
        print("No audio files found.")
        return

    for f in files:
        filepath = os.path.join(INPUT_DIR, f)
        current_vol = get_mean_volume(filepath)
        
        if current_vol is None:
            print(f"Skipping {f}: Could not measure volume")
            continue
            
        diff = TARGET_MEAN_DB - current_vol
        
        # Check against tolerance
        if abs(diff) > TOLERANCE_DB:
            print(f"Normalizing {f}: {current_vol:.1f} dB -> Target {TARGET_MEAN_DB} dB (Gain: {diff:+.1f} dB)")
            try:
                apply_gain(filepath, diff)
            except Exception as e:
                print(f"  Error normalizing {f}: {e}")
        else:
            print(f"Skipping {f}: {current_vol:.1f} dB (within tolerance)")

    print("Normalization complete.")

if __name__ == "__main__":
    main()
