
import os
import random
import json
import shutil

# Original constant definitions copied from nu6_scoring_app.html
LIST_HF3 = [{ 'i': 1, 'w': "SICK", 'p': ["s", "ɪ", "k"] }, { 'i': 2, 'w': "SIP", 'p': ["s", "ɪ", "p"] }, { 'i': 3, 'w': "SHOP", 'p': ["ʃ", "ɑ", "p"] }, { 'i': 4, 'w': "HUSH", 'p': ["h", "ʌ", "ʃ"] }, { 'i': 5, 'w': "PEAK", 'p': ["p", "i", "k"] }, { 'i': 6, 'w': "SHEET", 'p': ["ʃ", "i", "t"] }, { 'i': 7, 'w': "THICK", 'p': ["θ", "ɪ", "k"] }, { 'i': 8, 'w': "SIGHT", 'p': ["s", "aɪ", "t"] }, { 'i': 9, 'w': "MUCH", 'p': ["m", "ʌ", "tʃ"] }, { 'i': 10, 'w': "MOSS", 'p': ["m", "ɔ", "s"] }, { 'i': 11, 'w': "CHASE", 'p': ["tʃ", "eɪ", "s"] }, { 'i': 12, 'w': "BOOTH", 'p': ["b", "u", "θ"] }, { 'i': 13, 'w': "TOUGH", 'p': ["t", "ʌ", "f"] }, { 'i': 14, 'w': "SACK", 'p': ["s", "æ", "k"] }, { 'i': 15, 'w': "CHIP", 'p': ["tʃ", "ɪ", "p"] }, { 'i': 16, 'w': "CASH", 'p': ["k", "æ", "ʃ"] }, { 'i': 17, 'w': "FIGHT", 'p': ["f", "aɪ", "t"] }, { 'i': 18, 'w': "VICE", 'p': ["v", "aɪ", "s"] }, { 'i': 19, 'w': "PUSS", 'p': ["p", "ʊ", "s"] }, { 'i': 20, 'w': "PITCH", 'p': ["p", "ɪ", "tʃ"] }, { 'i': 21, 'w': "FETCH", 'p': ["f", "ɛ", "tʃ"] }, { 'i': 22, 'w': "SHOCK", 'p': ["ʃ", "ɑ", "k"] }, { 'i': 23, 'w': "SAKE", 'p': ["s", "eɪ", "k"] }, { 'i': 24, 'w': "MESH", 'p': ["m", "ɛ", "ʃ"] }, { 'i': 25, 'w': "SET", 'p': ["s", "ɛ", "t"] }]

LIST_HF4 = [{ 'i': 1, 'w': "SOCK", 'p': ["s", "ɑ", "k"] }, { 'i': 2, 'w': "SOUP", 'p': ["s", "u", "p"] }, { 'i': 3, 'w': "SHOT", 'p': ["ʃ", "ɑ", "t"] }, { 'i': 4, 'w': "HASH", 'p': ["h", "æ", "ʃ"] }, { 'i': 5, 'w': "PICK", 'p': ["p", "ɪ", "k"] }, { 'i': 6, 'w': "SHOOT", 'p': ["ʃ", "u", "t"] }, { 'i': 7, 'w': "THUD", 'p': ["θ", "ʌ", "d"] }, { 'i': 8, 'w': "SIDE", 'p': ["s", "aɪ", "d"] }, { 'i': 9, 'w': "SUCH", 'p': ["s", "ʌ", "tʃ"] }, { 'i': 10, 'w': "LOSS", 'p': ["l", "ɔ", "s"] }, { 'i': 11, 'w': "CHAT", 'p': ["tʃ", "æ", "t"] }, { 'i': 12, 'w': "BOTH", 'p': ["b", "oʊ", "θ"] }, { 'i': 13, 'w': "ROOF", 'p': ["r", "u", "f"] }, { 'i': 14, 'w': "BACK", 'p': ["b", "æ", "k"] }, { 'i': 15, 'w': "CHOP", 'p': ["tʃ", "ɑ", "p"] }, { 'i': 16, 'w': "DASH", 'p': ["d", "æ", "ʃ"] }, { 'i': 17, 'w': "TIGHT", 'p': ["t", "aɪ", "t"] }, { 'i': 18, 'w': "VASE", 'p': ["v", "eɪ", "s"] }, { 'i': 19, 'w': "POSH", 'p': ["p", "ɑ", "ʃ"] }, { 'i': 20, 'w': "POACH", 'p': ["p", "oʊ", "tʃ"] }, { 'i': 21, 'w': "HATCH", 'p': ["h", "æ", "tʃ"] }, { 'i': 22, 'w': "SHACK", 'p': ["ʃ", "æ", "k"] }, { 'i': 23, 'w': "SEEK", 'p': ["s", "i", "k"] }, { 'i': 24, 'w': "MUSH", 'p': ["m", "ʌ", "ʃ"] }, { 'i': 25, 'w': "SAT", 'p': ["s", "æ", "t"] }]

# Base paths
BASE_DIR = "/home/marks/Development/nu6-phoneme-scorer"
AUDIO_DIR = os.path.join(BASE_DIR, "audio")

def get_audio_filename(index, word):
    # Matches format "01_Sick.wav" (Title case)
    return f"{str(index).zfill(2)}_{word.title()}.wav"

def randomize_list(original_list, folder_name):
    print(f"\n--- Randomizing {folder_name} ---")
    
    # 1. Create a deep copy to shuffle so we don't mess up original references
    shuffled_items = [item.copy() for item in original_list]
    random.shuffle(shuffled_items)
    
    # 2. Assign new sequential indices (i: 1..25)
    for new_index, item in enumerate(shuffled_items, start=1):
        item['i'] = new_index
        
    folder_path = os.path.join(AUDIO_DIR, folder_name)
    if not os.path.exists(folder_path):
        print(f"Error: Folder {folder_path} does not exist.")
        return []

    # 3. Rename files safely
    # Mapping: Original Word -> New Index
    # We rely on 'w' field to track the word.
    
    # Step 3a: Rename all to temp names to avoid collisions
    # Current filename -> Temp filename
    # Current filename is determined by finding the file that matches the word in the folder
    # Because original index might not match exactly if files were manually changed, 
    # lets find file by word suffix.
    
    existing_files = os.listdir(folder_path)
    word_to_file_map = {}
    
    for filename in existing_files:
        if not filename.endswith(".wav"): continue
        # Filename format: "01_Sick.wav"
        # Extract word part: "Sick"
        parts = filename.split('_')
        if len(parts) < 2: continue
        word_part = parts[1].replace('.wav', '').upper()
        word_to_file_map[word_part] = filename

    # Verify all words in list exist in folder
    missing_files = []
    for item in original_list:
        if item['w'] not in word_to_file_map:
            missing_files.append(item['w'])
            
    if missing_files:
        print(f"Error: Could not find audio files for words: {missing_files}")
        return []

    print("Renaming to temporary filenames...")
    temp_map = {} # Word -> TempPath
    for word, filename in word_to_file_map.items():
        old_path = os.path.join(folder_path, filename)
        temp_name = f"temp_{word}_{random.randint(1000,9999)}.wav"
        temp_path = os.path.join(folder_path, temp_name)
        shutil.move(old_path, temp_path)
        temp_map[word] = temp_path

    print("Renaming to new indexed filenames...")
    for item in shuffled_items:
        word = item['w']
        new_index = item['i']
        new_filename = get_audio_filename(new_index, word)
        new_path = os.path.join(folder_path, new_filename)
        
        if word in temp_map:
            shutil.move(temp_map[word], new_path)
        else:
            print(f"Warning: Temp file for {word} not found!")

    return shuffled_items

def main():
    random.seed(42) # Optional: set seed for reproducible "random" if needed, but probably better truly random. 
    # Actually, let's NOT set a seed so it's different every time we run it if we wanted.
    # But for this task, random is good.
    
    new_hf3 = randomize_list(LIST_HF3, "HF3")
    new_hf4 = randomize_list(LIST_HF4, "HF4")

    print("\n\n=== NEW JAVASCRIPT ARRAYS ===")
    print("Copy and replace these lines in nu6_scoring_app.html:")
    print("-" * 80)
    print(f"        const LIST_HF3 = {json.dumps(new_hf3, ensure_ascii=False)};")
    print(f"        const LIST_HF4 = {json.dumps(new_hf4, ensure_ascii=False)};")
    print("-" * 80)

if __name__ == "__main__":
    main()
