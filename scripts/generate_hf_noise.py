import os
import numpy as np
import scipy.io.wavfile as wav
import scipy.signal as signal
import glob

def compute_average_spectrum(file_paths):
    psd_sum = None
    count = 0
    fs = None
    
    for fp in file_paths:
        try:
            rate, data = wav.read(fp)
            if fs is None: fs = rate
            if rate != fs: continue # Skip mix-matched sample rates
            
            # Normalize to -1.0 to 1.0
            if data.dtype == np.int16:
                data = data.astype(np.float32) / 32768.0
            elif data.dtype == np.int32:
                data = data.astype(np.float32) / 2147483648.0
                
            # Compute PSD
            f, Pxx = signal.welch(data, fs, nperseg=1024)
            
            if psd_sum is None:
                psd_sum = np.zeros_like(Pxx)
            
            if len(Pxx) == len(psd_sum):
                psd_sum += Pxx
                count += 1
        except Exception as e:
            print(f"Error processing {fp}: {e}")
            
    return fs, psd_sum / count if count > 0 else None

def generate_noise_from_spectrum(target_psd, fs, duration_sec=30):
    n_samples = int(fs * duration_sec)
    
    # Generate white noise
    white_noise = np.random.normal(0, 1, n_samples)
    
    # Filter white noise to match target PSD
    # We'll use an FIR filter design method based on frequency sampling
    # Target magnitude response is sqrt(PSD)
    target_mag = np.sqrt(target_psd)
    
    # Create valid frequency points for firwin2 (0.0 to 1.0 where 1.0 is Nyquist)
    freqs = np.linspace(0, 1, len(target_mag))
    
    # Design filter (arbitrary number of taps, e.g., 513)
    taps = signal.firwin2(1025, freqs, target_mag)
    
    # Apply filter
    shaped_noise = signal.lfilter(taps, 1.0, white_noise)
    
    return shaped_noise

def normalize_audio(data, target_rms_db=-23.0):
    current_rms = np.sqrt(np.mean(data**2))
    target_rms = 10 ** (target_rms_db / 20)
    gain = target_rms / current_rms
    return data * gain

def save_wav(filename, rate, data):
    # Clip to -1.0 to 1.0
    data = np.clip(data, -1.0, 1.0)
    # Convert to int16
    data_int16 = (data * 32767).astype(np.int16)
    wav.write(filename, rate, data_int16)

def main():
    # 1. Find all HF list files
    hf_files = glob.glob("audio/HF*/*.wav")
    print(f"Found {len(hf_files)} HF audio files.")
    
    if not hf_files:
        print("No HF files found!")
        return

    # 2. Compute Spectrum
    print("Computing average spectrum...")
    fs, avg_psd = compute_average_spectrum(hf_files)
    
    if avg_psd is None:
        print("Failed to compute spectrum.")
        return
        
    # 3. Generate Noise
    print("Generating noise...")
    noise = generate_noise_from_spectrum(avg_psd, fs, duration_sec=60) # 60 seconds loop
    
    # 4. Normalize
    print("Normalizing to -23.0 dB RMS...")
    noise = normalize_audio(noise, -23.0)
    
    # 5. Save
    output_path = "audio/Rose_Hill_Noise.wav"
    save_wav(output_path, fs, noise)
    print(f"Saved generated noise to {output_path}")

if __name__ == "__main__":
    main()
