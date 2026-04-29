import os
import glob
import numpy as np
import scipy.io.wavfile as wav
import matplotlib.pyplot as plt
from scipy.signal import welch

DIR_3A = "audio/3A"
DIR_3D = "Rose_Hill_Clinical_WAVs_List_3D"

OCTAVE_TICKS = [125, 250, 500, 1000, 2000, 4000, 8000]
OCTAVE_LABELS = ['125', '250', '500', '1k', '2k', '4k', '8k']

def read_wav(path):
    sr, data = wav.read(path)
    if data.dtype == np.int16: data = data / 32768.0
    elif data.dtype == np.int32: data = data / 2147483648.0
    elif data.dtype == np.uint8: data = (data - 128) / 128.0
    if len(data.shape) > 1: data = np.mean(data, axis=1)
    return sr, data.astype(np.float32)

def isolate_target_word(data, sr):
    window = int(0.05 * sr)
    abs_data = np.abs(data)
    env = np.convolve(abs_data, np.ones(window)/window, mode='same')
    thresh = 0.1 * np.max(env)
    is_speech = env > thresh
    
    edges = np.diff(is_speech.astype(int))
    starts = np.where(edges == 1)[0]
    ends = np.where(edges == -1)[0]
    
    if is_speech[0]: starts = np.insert(starts, 0, 0)
    if is_speech[-1]: ends = np.append(ends, len(is_speech)-1)
    
    min_len = int(0.1 * sr)
    valid_starts, valid_ends = [], []
    for s, e in zip(starts, ends):
        if e - s > min_len:
            valid_starts.append(s)
            valid_ends.append(e)
            
    if len(valid_starts) > 1:
        word_start = valid_starts[-1]
        word_end = valid_ends[-1]
        word_start = max(0, word_start - int(0.05*sr))
        word_end = min(len(data), word_end + int(0.05*sr))
        return data[word_start:word_end]
    else:
        return data[len(data)//2:]

def get_mean_psd(file_list, remove_carrier=False, as_db=False):
    all_psds = []
    freqs = None
    
    for f in file_list:
        sr, data = read_wav(f)
        if remove_carrier:
             data = isolate_target_word(data, sr)
             
        rms = np.std(data)
        if rms > 0:
            data = data[np.abs(data) > 0.01 * np.max(np.abs(data))]
            
        if len(data) < 1024: continue
        
        f_arr, pxx = welch(data, sr, nperseg=2048)
        if freqs is None:
            freqs = f_arr
        all_psds.append(pxx)
        
    if not all_psds:
        return freqs, None
        
    mean_psd = np.mean(all_psds, axis=0)
    if as_db:
        return freqs, 10 * np.log10(mean_psd + 1e-12)
    return freqs, mean_psd

def smooth(y, box_pts):
    box = np.ones(box_pts)/box_pts
    return np.convolve(y, box, mode='same')

def make_plot(f_3a_full, p_3a_full, f_3d, p_3d, f_3a_word, p_3a_word, f_3d_word, p_3d_word, is_db=False):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    ylabel = "Power Spectral Density (dB/Hz)" if is_db else "Power Spectral Density (Linear)"
    
    # Plot 1
    ax1.plot(f_3a_full, p_3a_full, label='NU-6 List 3A (Full)', color='blue', alpha=0.8)
    ax1.plot(f_3d, p_3d, label='Rose Hill HF 3D', color='orange', alpha=0.8)
    ax1.set_xscale('log')
    ax1.set_xlim([100, 10000])
    if is_db: ax1.set_ylim([-100, -20])
    ax1.set_xticks(OCTAVE_TICKS)
    ax1.set_xticklabels(OCTAVE_LABELS)
    ax1.set_title("Spectral Density\n(With Carrier Phrase for NU-6)")
    ax1.set_xlabel("Frequency (Hz)")
    ax1.set_ylabel(ylabel)
    ax1.legend()
    ax1.grid(True, which="both", ls="-", alpha=0.2)
    
    # Plot 2
    ax2.plot(f_3a_word, p_3a_word, label='NU-6 List 3A (Target Word Only)', color='blue', alpha=0.8)
    ax2.plot(f_3d_word, p_3d_word, label='Rose Hill HF 3D', color='orange', alpha=0.8)
    ax2.set_xscale('log')
    ax2.set_xlim([100, 10000])
    if is_db: ax2.set_ylim([-100, -20])
    ax2.set_xticks(OCTAVE_TICKS)
    ax2.set_xticklabels(OCTAVE_LABELS)
    ax2.set_title("Spectral Density\n(Without Carrier Phrase for NU-6)")
    ax2.set_xlabel("Frequency (Hz)")
    ax2.set_ylabel(ylabel)
    ax2.legend()
    ax2.grid(True, which="both", ls="-", alpha=0.2)
    
    plt.tight_layout()
    
    filename = "spectral_density_comparison.png" if is_db else "spectral_density_linear.png"
    plt.savefig(filename, dpi=300)
    print(f"Saved plot to {filename}")
    plt.close()

def main():
    files_3a = glob.glob(os.path.join(DIR_3A, "*.wav"))
    files_3d = glob.glob(os.path.join(DIR_3D, "*.wav"))
    
    print(f"Generating Logistic (dB) and Linear plots...")
    
    # Generate DB data
    f_3a_f_db, p_3a_f_db = get_mean_psd(files_3a, remove_carrier=False, as_db=True)
    f_3d_db, p_3d_db = get_mean_psd(files_3d, remove_carrier=False, as_db=True)
    f_3a_w_db, p_3a_w_db = get_mean_psd(files_3a, remove_carrier=True, as_db=True)
    f_3d_w_db, p_3d_w_db = get_mean_psd(files_3d, remove_carrier=False, as_db=True)
    
    make_plot(f_3a_f_db, smooth(p_3a_f_db, 15), 
              f_3d_db, smooth(p_3d_db, 15), 
              f_3a_w_db, smooth(p_3a_w_db, 15), 
              f_3d_w_db, smooth(p_3d_w_db, 15), is_db=True)
              
    # Generate Linear data
    f_3a_f_lin, p_3a_f_lin = get_mean_psd(files_3a, remove_carrier=False, as_db=False)
    f_3d_lin, p_3d_lin = get_mean_psd(files_3d, remove_carrier=False, as_db=False)
    f_3a_w_lin, p_3a_w_lin = get_mean_psd(files_3a, remove_carrier=True, as_db=False)
    f_3d_w_lin, p_3d_w_lin = get_mean_psd(files_3d, remove_carrier=False, as_db=False)
    
    make_plot(f_3a_f_lin, smooth(p_3a_f_lin, 15), 
              f_3d_lin, smooth(p_3d_lin, 15), 
              f_3a_w_lin, smooth(p_3a_w_lin, 15), 
              f_3d_w_lin, smooth(p_3d_w_lin, 15), is_db=False)

if __name__ == "__main__":
    main()
