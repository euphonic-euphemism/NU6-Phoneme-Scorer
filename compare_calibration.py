import numpy as np
from scipy.io import wavfile
import math

def calculate_dbfs(filepath):
    try:
        sample_rate, data = wavfile.read(filepath)
        
        # Handle stereo/mono
        if len(data.shape) > 1:
            data = data[:, 0] # Use first channel
            
        # Convert to float to avoid overflow
        data = data.astype(np.float64)
        
        # Calculate RMS
        rms = np.sqrt(np.mean(data**2))
        
        # Calculate dBFS
        # Assuming 16-bit audio, max magnitude is 32768
        # Adjust based on bit depth if needed, but relative comparison holds
        if data.dtype == np.int16:
            max_val = 32768
        elif data.dtype == np.int32:
            max_val = 2147483648
        elif data.dtype == np.uint8:
            data = data - 128
            max_val = 128
        else:
             max_val = 1.0 # Float 
             
        if rms > 0:
            dbfs = 20 * np.log10(rms / max_val)
        else:
            dbfs = -float('inf')
            
        return {
            "file": filepath,
            "rms": rms,
            "dbfs": dbfs,
            "max_val": max_val,
            "sample_rate": sample_rate
        }
    except Exception as e:
        return {"file": filepath, "error": str(e)}

files = [
    "audio/calibration/000_Master_Calibration_1kHz.wav",
    "audio/noise/HF1_MasterNoise.wav",
    "audio/HF1/01_Check.wav" 
]

results = []
for f in files:
    results.append(calculate_dbfs(f))

print(f"{'File':<50} | {'RMS':<15} | {'dBFS':<10}")
print("-" * 85)

for r in results:
    if "error" in r:
        print(f"{r['file']:<50} | Error: {r['error']}")
    else:
        print(f"{r['file']:<50} | {r['rms']:<15.4f} | {r['dbfs']:<10.2f}")

if len(results) == 2 and "dbfs" in results[0] and "dbfs" in results[1]:
    diff = abs(results[0]["dbfs"] - results[1]["dbfs"])
    print("-" * 85)
    print(f"Difference: {diff:.2f} dB")
