import os
import shutil
import subprocess
import sys

# Configuration
SRC_BASE = "/home/marks/Development/Rose Hill HF Word Lists"
APP_AUDIO_BASE = "/home/marks/Development/nu6-phoneme-scorer/audio"

# Constants
TARGET_DBFS_SPEECH = -24.2
TARGET_DBFS_TONE = -23.0
SILENCE_THRESHOLD_DB = -50

# Paths to tools
# We use the ffmpeg-normalize installed in the local venv
FFMPEG_NORMALIZE_BIN = "./audio_env/bin/ffmpeg-normalize"
FFMPEG_BIN = "ffmpeg" # System ffmpeg

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"Created directory: {path}")

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
        # print(f"   [NORM] {os.path.basename(dest)} -> {target_db} dB")
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
    
    # Filter explanation:
    # 1. silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB  (Trim Start)
    # 2. areverse (Reverse audio)
    # 3. silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB  (Trim End, which is now Start)
    # 4. areverse (Restore normal order)
    
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
        # print(f"   [TRIM] {os.path.basename(src_dest_path)}")
    except subprocess.CalledProcessError as e:
        print(f"   ERROR trimming {src_dest_path}: {e}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def process_pipeline(src, dest, target_db, do_trim=False):
    if not os.path.exists(src):
        return

    print(f"Processing: {os.path.basename(src)}")
    
    # 1. Normalize
    success = normalize_file(src, dest, target_db)
    if not success:
        return

    # 2. Trim (if needed) - Modifies dest in-place
    if do_trim:
        trim_silence(dest)
        print(f"   -> Reference: {target_db} dB | Trimmed: Yes")
    else:
        print(f"   -> Reference: {target_db} dB | Trimmed: No")


def main():
    # Verify tools
    if not os.path.exists(FFMPEG_NORMALIZE_BIN):
        print(f"ERROR: ffmpeg-normalize not found at {FFMPEG_NORMALIZE_BIN}")
        print("Please run: ./audio_env/bin/pip install ffmpeg-normalize")
        sys.exit(1)

    # Define Destination Directories
    dest_calibration = os.path.join(APP_AUDIO_BASE, "calibration")
    dest_noise = os.path.join(APP_AUDIO_BASE, "noise")
    dest_hf1 = os.path.join(APP_AUDIO_BASE, "HF1")
    dest_hf2 = os.path.join(APP_AUDIO_BASE, "HF2")

    for d in [dest_calibration, dest_noise, dest_hf1, dest_hf2]:
        ensure_dir(d)

    # ---------------------------
    # 1. CALIBRATION (Tone)
    # ---------------------------
    cal_src = os.path.join(SRC_BASE, "000_Master_Calibration_1kHz.wav")
    cal_dest = os.path.join(dest_calibration, "000_Master_Calibration_1kHz.wav")
    print(f"\n--- Calibration ---")
    process_pipeline(cal_src, cal_dest, TARGET_DBFS_TONE, do_trim=False)

    # ---------------------------
    # 2. FORM 1 (Speech & Noise)
    # ---------------------------
    print(f"\n--- Form 1 ---")
    src_form1 = os.path.join(SRC_BASE, "Form_1")
    
    if os.path.exists(src_form1):
        files = sorted([f for f in os.listdir(src_form1) if f.endswith(".wav")])
        for filename in files:
            if "MasterNoise" in filename or "SpeechCorrelated" in filename:
                continue
            
            is_speech = False
            if filename.startswith("00_Intro"):
                is_speech = True
            else:
                prefix = filename.split('_')[0]
                if prefix.isdigit() and 1 <= int(prefix) <= 25:
                    is_speech = True
            
            if is_speech:
                src = os.path.join(src_form1, filename)
                dest = os.path.join(dest_hf1, filename)
                process_pipeline(src, dest, TARGET_DBFS_SPEECH, do_trim=True)

    noise_src_f1 = os.path.join(src_form1, "Form_1_Python_MasterNoise.wav")
    noise_dest_f1 = os.path.join(dest_noise, "HF1_MasterNoise.wav")
    process_pipeline(noise_src_f1, noise_dest_f1, TARGET_DBFS_TONE, do_trim=False)

    # ---------------------------
    # 3. FORM 2 (Speech & Noise)
    # ---------------------------
    print(f"\n--- Form 2 ---")
    src_form2 = os.path.join(SRC_BASE, "Form_2")

    if os.path.exists(src_form2):
        files = sorted([f for f in os.listdir(src_form2) if f.endswith(".wav")])
        for filename in files:
            if "MasterNoise" in filename or "SpeechCorrelated" in filename:
                continue
            
            is_speech = False
            if filename.startswith("00_Intro"):
                is_speech = True
            else:
                prefix = filename.split('_')[0]
                if prefix.isdigit() and 1 <= int(prefix) <= 25:
                    is_speech = True
            
            if is_speech:
                src = os.path.join(src_form2, filename)
                dest = os.path.join(dest_hf2, filename)
                process_pipeline(src, dest, TARGET_DBFS_SPEECH, do_trim=True)

    noise_src_f2 = os.path.join(src_form2, "Form_2_Python_MasterNoise.wav")
    noise_dest_f2 = os.path.join(dest_noise, "HF2_MasterNoise.wav")
    process_pipeline(noise_src_f2, noise_dest_f2, TARGET_DBFS_TONE, do_trim=False)

if __name__ == "__main__":
    main()
