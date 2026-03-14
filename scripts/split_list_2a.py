import os
import subprocess
import re
import sys

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, "audio", "NU-6", "NU No. 6 CNC List 2A (first half).wav")
OUTPUT_DIR = os.path.join(BASE_DIR, "audio", "2A")

# Words 1-25 from List 2A
WORDS = [
    "PICK", "ROOM", "NICE", "SAID", "FAIL",
    "SOUTH", "WHITE", "KEEP", "DEAD", "LOAF",
    "DAB", "NUMB", "JUICE", "CHIEF", "MERGE",
    "WAG", "RAIN", "WITCH", "SOAP", "YOUNG",
    "TON", "KEG", "CALM", "TOOL", "PIKE"
]

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
    
    print("Running silence detection...")
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    output = result.stderr
    
    events = []
    for line in output.split("\n"):
        if "silence_start" in line:
            match = re.search(r"silence_start: (\d+(\.\d+)?)", line)
            if match:
                events.append(("start", float(match.group(1))))
        elif "silence_end" in line:
            match = re.search(r"silence_end: (\d+(\.\d+)?)", line)
            if match:
                events.append(("end", float(match.group(1))))
            
    events.sort(key=lambda x: x[1])
    
    voice_segments = []
    last_silence_end = 0.0
    
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

    print(f"Input: {INPUT_FILE}")
    segments = get_word_segments(INPUT_FILE)
    print(f"Found {len(segments)} segments.")
    
    if len(segments) != 25:
        print(f"WARNING: Expected 25 segments, found {len(segments)}.")
        print("Proceeding with extraction...")
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for i, (start, end) in enumerate(segments):
        if i >= len(WORDS):
            print(f"Skipping extra segment {i+1}: {start}-{end}")
            continue
            
        word = WORDS[i]
        title_word = word[0].upper() + word[1:].lower()
        filename = f"{i+1:02d}_{title_word}.wav"
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
        print(f"  Extracted: {filename} ({s:.2f}-{e:.2f})")
        
    print("Done.")

if __name__ == "__main__":
    main()
