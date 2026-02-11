
import os
import subprocess
import re
import sys

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, "audio", "NU-6", "NU No. 6 CNC List 3A (second half).wav")
OUTPUT_DIR = os.path.join(BASE_DIR, "audio", "3A")

# Words 26-50 from List 3A
WORDS = [
    "GUN", "JUG", "SHEEP", "FIVE", "RUSH",
    "RAT", "VOID", "WIRE", "HALF", "NOTE",
    "WHEN", "NAME", "THIN", "TELL", "BAR",
    "MOUSE", "HIRE", "CAB", "HIT", "CHAT",
    "PHONE", "SOUP", "DODGE", "SEIZE", "COOL"
]

START_INDEX = 26

# Silence detection parameters
SILENCE_THRESH = "-50dB"
MIN_SILENCE_DURATION = 0.5 # seconds
PADDING = 0.2 # seconds padding around words

def get_word_segments(input_file):
    """
    Detects silence in the audio file and returns list of (start, end) tuples for non-silent segments.
    """
    cmd = [
        "ffmpeg",
        "-i", input_file,
        "-af", f"silencedetect=noise={SILENCE_THRESH}:d={MIN_SILENCE_DURATION}",
        "-f", "null",
        "-"
    ]
    
    print("Running silence detection...", flush=True)
    # Use file redirection to avoid pipe deadlocks
    log_file = "detection_log.txt"
    with open(log_file, "w") as f:
        subprocess.run(cmd, stderr=f, stdout=f)
        
    with open(log_file, "r") as f:
        output = f.read()
    
    # Clean up
    if os.path.exists(log_file):
        os.remove(log_file)
        
    events = []
    for line in output.split("\n"):
        if "silence_start" in line:
            t = float(re.search(r"silence_start: (\d+(\.\d+)?)", line).group(1))
            events.append(("start", t))
        elif "silence_end" in line:
            t = float(re.search(r"silence_end: (\d+(\.\d+)?)", line).group(1))
            events.append(("end", t))
            
    events.sort(key=lambda x: x[1])
    
    voice_segments = []
    last_silence_end = 0.0
    
    # If first event is start at > 0.1, then 0 to start is audio
    if events and events[0][0] == "start" and events[0][1] > 0.1:
         voice_segments.append((0.0, events[0][1]))
         
    for i in range(len(events)):
        evt_type, t = events[i]
        
        if evt_type == "end":
            last_silence_end = t
            next_start = None
            for j in range(i+1, len(events)):
                if events[j][0] == "start":
                    next_start = events[j][1]
                    break
            
            if next_start:
                if next_start - last_silence_end > 0.2: 
                    voice_segments.append((last_silence_end, next_start))
    
    return voice_segments

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file not found: {INPUT_FILE}")
        return

    print(f"Input: {INPUT_FILE}", flush=True)
    segments = get_word_segments(INPUT_FILE)
    print(f"Found {len(segments)} segments.", flush=True)
    
    if len(segments) != 25:
        print(f"WARNING: Expected 25 segments, found {len(segments)}.", flush=True)
        print("Proceeding with extraction...", flush=True)
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for i, (start, end) in enumerate(segments):
        if i >= len(WORDS):
            print(f"Skipping extra segment {i+1}: {start}-{end}", flush=True)
            continue
            
        word = WORDS[i]
        title_word = word[0].upper() + word[1:].lower()
        # Calculate correct index based on START_INDEX
        idx = START_INDEX + i
        filename = f"{idx:02d}_{title_word}.wav"
        out_path = os.path.join(OUTPUT_DIR, filename)
        
        # Add padding
        s = max(0, start - PADDING)
        e = end + PADDING
        duration = e - s
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", INPUT_FILE,
            "-ss", str(s),
            "-t", str(duration),
            out_path,
            "-loglevel", "error"
        ]
        
        subprocess.run(cmd)
        print(f"  Extracted: {filename} ({s:.2f}-{e:.2f})", flush=True)
        
    print("Done.", flush=True)

if __name__ == "__main__":
    main()
