
import os
import subprocess
import re
import sys

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, "audio", "NU-6", "NU No. 6 CNC List 3A (first half).wav")
OUTPUT_DIR = os.path.join(BASE_DIR, "audio", "3A")

# Words 1-25 from List 3A
WORDS = [
    "BASE", "MESS", "CAUSE", "MOP", "GOOD",
    "LUCK", "WALK", "YOUTH", "PAIN", "DATE",
    "PEARL", "SEARCH", "DITCH", "TALK", "RING",
    "GERM", "LIFE", "TEAM", "LID", "POLE",
    "RODE", "SHALL", "LATE", "CHEEK", "BEG"
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
    
    # Parse output
    # [silencedetect @ 0x...] silence_start: 10.5
    # [silencedetect @ 0x...] silence_end: 12.1 | silence_duration: 1.6
    
    silence_starts = []
    silence_ends = []
    
    for line in output.split("\n"):
        if "silence_start" in line:
            match = re.search(r"silence_start: (\d+(\.\d+)?)", line)
            if match:
                silence_starts.append(float(match.group(1)))
        elif "silence_end" in line:
            match = re.search(r"silence_end: (\d+(\.\d+)?)", line)
            if match:
                silence_ends.append(float(match.group(1)))
                
    # Logic:
    # A word is between silence_end[i] and silence_start[i+1]
    # Handle start of file: if first silence_start > 0, there is audio at start.
    # Handle end of file: ...
    
    segments = []
    
    # Check if file starts with audio (silence_start[0] > 0)
    current_time = 0.0
    
    # Combine starts and ends into a timeline of silence
    # We want the NON-SILENCE parts.
    # If first event is silence_start at T=2.0, then 0.0-2.0 is audio.
    # If first event is silence_end at T=0.5 (implies silence at start), then audio starts at 0.5.
    
    # Simpler approach:
    # Sort all events?
    # silencedetect output usually pairs them if silence exists.
    # But files might start with silence.
    
    # Let's iterate through the silence periods and define audio as "between silences".
    
    # If the file starts with silence, silence_end will appear first (or a silence_start at 0, then end).
    # If file starts with audio, the first event is silence_start > 0.
    
    # Let's assume standard behavior:
    # 1. 0.0 -> silence_start[0] : AUDIO (if silence_start[0] > 0.1)
    # 2. silence_end[0] -> silence_start[1] : AUDIO
    # ...
    # 3. silence_end[last] -> EOF : AUDIO
    
    # However, silencedetect output order helps.
    
    # Let's reconstruct the timeline.
    # We need total duration for the EOF check. Use ffprobe or parsing.
    # subprocess.run(["ffprobe", ...])
    
    # Fallback: assume segments are purely defined by gaps.
    
    # Actually, pydub logic: split_on_silence removes silence.
    # We want to keep the "loud" parts.
    
    voice_segments = []
    
    # Case: silence at start
    # silence_start: 0.000 (maybe not printed if exactly 0?)
    # silence_end: 2.5
    
    # We need to pair starts and ends carefully.
    
    # It's safer to rely on the fact that `silence_end` marks the *start* of a word (potentially),
    # and `silence_start` marks the *end* of a word.
    
    # If file starts with silence:
    #  silence_end comes first? No, silence_start: 0 -> silence_end: X
    
    # Let's just zip them if counts match. But sometimes they don't match (silence at end but no end event?).
    
    # Let's parse strictly sequentially from the log lines to be safe.
    events = []
    for line in output.split("\n"):
        if "silence_start" in line:
            t = float(re.search(r"silence_start: (\d+(\.\d+)?)", line).group(1))
            events.append(("start", t))
        elif "silence_end" in line:
            t = float(re.search(r"silence_end: (\d+(\.\d+)?)", line).group(1))
            events.append(("end", t))
            
    # Sort by time just in case
    events.sort(key=lambda x: x[1])
    
    last_silence_end = 0.0
    
    # If first event is start at > 0, then 0 to start is audio
    if events and events[0][0] == "start" and events[0][1] > 0.1:
         voice_segments.append((0.0, events[0][1]))
         
    for i in range(len(events)):
        evt_type, t = events[i]
        
        if evt_type == "end":
            last_silence_end = t
            # Look ahead for next start
            # If next is start, then [end, start] is audio
            # If this is last event, then [end, EOF] is audio?
            
            next_start = None
            for j in range(i+1, len(events)):
                if events[j][0] == "start":
                    next_start = events[j][1]
                    break
            
            if next_start:
                if next_start - last_silence_end > 0.2: # min word duration check
                    voice_segments.append((last_silence_end, next_start))
            else:
                # End of silences. Check if there is audio after.
                # We'd need file duration.
                pass 
                
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
        # Proceed with extracting what we found, up to 25
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
        
        # ffmpeg -i input -ss start -t duration output
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
