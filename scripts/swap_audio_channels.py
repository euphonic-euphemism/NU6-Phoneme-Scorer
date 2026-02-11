import os
import subprocess

def swap_channels():
    base_dir = "/home/marks/Development/nu6-phoneme-scorer/BKB-SIN"
    scripts_dir = "/home/marks/Development/nu6-phoneme-scorer/scripts"
    
    # Process Tracks 03 to 20
    for i in range(3, 21):
        track_name = f"Track {i:02d}.wav"
        input_path = os.path.join(base_dir, track_name)
        temp_path = os.path.join(base_dir, f"temp_{track_name}")
        
        if not os.path.exists(input_path):
            print(f"Skipping {track_name}: File not found.")
            continue
            
        print(f"Processing {track_name}...")
        
        # ffmpeg command to swap channels: -af "pan=stereo|c0=c1|c1=c0"
        # c0=c1 maps original right (c1) to left (c0)
        # c1=c0 maps original left (c0) to right (c1)
        cmd = [
            "ffmpeg",
            "-y", # Overwrite output files without asking
            "-i", input_path,
            "-af", "pan=stereo|c0=c1|c1=c0",
            temp_path
        ]
        
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            # If successful, replace original with temp
            os.replace(temp_path, input_path)
            print(f"Successfully swapped channels for {track_name}")
        except subprocess.CalledProcessError as e:
            print(f"Error processing {track_name}: {e.stderr.decode()}")
            if os.path.exists(temp_path):
                os.remove(temp_path)

if __name__ == "__main__":
    swap_channels()
