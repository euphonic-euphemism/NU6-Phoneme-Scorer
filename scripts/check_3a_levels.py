
import os
import subprocess
import math
import re

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_3A = os.path.join(BASE_DIR, "audio", "3A")
DIR_HF3 = os.path.join(BASE_DIR, "audio", "HF3") # Reference

def get_rms_db(filepath):
    """
    Calculates RMS dBFS using ffmpeg correctly.
    """
    # ffmpeg -i input -filter:a volumedetect -f null /dev/null
    cmd = [
        "ffmpeg",
        "-i", filepath,
        "-filter:a", "volumedetect",
        "-f", "null",
        "-"
    ]
    
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    output = result.stderr
    
    # Parse mean_volume: -25.5 dB
    match = re.search(r"mean_volume: ([\-\d\.]+) dB", output)
    if match:
        return float(match.group(1))
    return None

def analyze_folder(folder_path, name):
    if not os.path.exists(folder_path):
        print(f"Folder not found: {folder_path}")
        return None

    files = sorted([f for f in os.listdir(folder_path) if f.endswith(".wav")])
    if not files:
        print(f"No wav files in {folder_path}")
        return None

    print(f"\n--- Analyzing {name} ({len(files)} files) ---", flush=True)
    levels = []
    for f in files:
        print(f"Processing {f}...", end=" ", flush=True)
        path = os.path.join(folder_path, f)
        db = get_rms_db(path)
        if db is not None:
            levels.append(db)
            print(f"{db:.1f} dB", flush=True)
        else:
            print("Failed", flush=True)
            
    if levels:
        avg = sum(levels) / len(levels)
        print(f"Average Mean Volume: {avg:.2f} dB")
        print(f"Min: {min(levels):.2f} dB")
        print(f"Max: {max(levels):.2f} dB")
        return avg
    return None

def main():
    print("Checking audio levels...")
    
    avg_3a = analyze_folder(DIR_3A, "NU-6 List 3A (New)")
    
    # Check HF3 for reference target
    # Note: scripts/normalize_hf3_hf4.py uses TARGET_DBFS_SPEECH = -24.2 (RMS normalization usually targets RMS amplitude, not mean volume directly, but let's see what volumedetect says)
    # ffmpeg-normalize uses EBU R128 or RMS.
    # We should probably use the same target.
    
    avg_hf3 = analyze_folder(DIR_HF3, "Rose Hill HF3 (Reference)")
    
    if avg_3a and avg_hf3:
        diff = avg_3a - avg_hf3
        print(f"\nDifference (3A - HF3): {diff:.2f} dB")
        
        if abs(diff) > 1.0:
            print("Recommendation: NORMALIZE the new files.")
        else:
            print("Levels are reasonably close.")

if __name__ == "__main__":
    main()
