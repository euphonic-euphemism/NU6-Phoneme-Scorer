
import os
import subprocess
import re

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDERS = ["3A", "4A"]
TARGET_MEAN_DB = -23.0
TOLERANCE_DB = 0.5

def get_mean_volume(filepath):
    cmd = [
        "ffmpeg",
        "-i", filepath,
        "-filter:a", "volumedetect",
        "-f", "null",
        "-"
    ]
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    match = re.search(r"mean_volume: ([\-\d\.]+) dB", result.stderr)
    if match:
        return float(match.group(1))
    return None

def apply_gain(filepath, gain_db):
    tmp_path = filepath + ".tmp.wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-i", filepath,
        "-filter:a", f"volume={gain_db}dB",
        tmp_path,
        "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True)
    os.replace(tmp_path, filepath)

def main():
    print(f"Normalizing to {TARGET_MEAN_DB} dB mean volume...")
    
    for folder in FOLDERS:
        input_dir = os.path.join(BASE_DIR, "audio", folder)
        if not os.path.exists(input_dir):
            print(f"Skipping {folder}: Not found")
            continue
            
        print(f"\n--- Processing {folder} ---")
        files = sorted([f for f in os.listdir(input_dir) if f.lower().endswith(".wav")])
        
        for f in files:
            filepath = os.path.join(input_dir, f)
            current_vol = get_mean_volume(filepath)
            
            if current_vol is None:
                print(f"Skipping {f}: Could not measure volume")
                continue
                
            diff = TARGET_MEAN_DB - current_vol
            
            if abs(diff) > TOLERANCE_DB:
                print(f"Normalizing {f}: {current_vol:.1f} dB -> Target (Gain: {diff:+.1f} dB)")
                try:
                    apply_gain(filepath, diff)
                except Exception as e:
                    print(f"  Error normalizing {f}: {e}")
            else:
                # print(f"Skipping {f}: {current_vol:.1f} dB (OK)")
                pass

    print("\nBatch Normalization complete.")

if __name__ == "__main__":
    main()
