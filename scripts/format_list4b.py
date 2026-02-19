
import pandas as pd
import json
import os

file_path = "/home/marks/Development/nu6-phoneme-scorer/Rose Hil HF Word Lists 1B to 4B.xlsx"
audio_source_dir = "/home/marks/Development/nu6-phoneme-scorer/Rose_Hill_Clinical_WAVs_List_4B"
audio_target_dir = "/home/marks/Development/nu6-phoneme-scorer/audio/HF4B"

try:
    # 1. READ EXCEL DATA
    xls = pd.ExcelFile(file_path)
    sheet_name = "Sheet1"
    df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
    
    # Search for "List 4B" to find start row
    start_row = -1
    for index, row in df.iterrows():
        if str(row[0]).strip() == "List 4B":
            start_row = index
            break
            
    if start_row == -1:
        print("Error: 'List 4B' not found in Excel file.")
        exit()

    print(f"List 4B starts at row {start_row}")
    
    # Extract words starting from row after "List 4B"
    # Assuming contiguous list until empty row or end
    formatted_data = []
    
    current_row = start_row + 1
    item_index = 1
    
    print("--- EXTRACTED DATA ---")
    while current_row < len(df):
        word = str(df.iloc[current_row, 0]).strip().upper()
        if word == "NAN" or word == "":
            break
            
        # Get phonemes (columns 1, 2, 3) if they exist
        p1 = str(df.iloc[current_row, 1]).strip() if df.shape[1] > 1 else ""
        p2 = str(df.iloc[current_row, 2]).strip() if df.shape[1] > 2 else ""
        p3 = str(df.iloc[current_row, 3]).strip() if df.shape[1] > 3 else ""
        
        phonemes = [p for p in [p1, p2, p3] if p and p != 'nan' and p != 'None']
        
        # Determine strict phoneme mapping based on word if excel is missing them?
        # For now, rely on Excel. If excel is missing them, we might need manual fix.
        if not phonemes:
             # Basic fallback or just leave empty for now to see what we get
             pass

        entry = {
            "i": item_index,
            "w": word,
            "p": phonemes
        }
        formatted_data.append(entry)
        item_index += 1
        current_row += 1

    print(json.dumps(formatted_data, indent=4))
    
    # 2. GENERATE AUDIO RENAME COMMANDS
    print("\n--- AUDIO RENAME COMMANDS ---")
    print(f"mkdir -p {audio_target_dir}")
    
    # Map item number to word from excel
    word_map = {item['i']: item['w'] for item in formatted_data}
    
    for filename in sorted(os.listdir(audio_source_dir)):
        if not filename.endswith(".wav"): continue
        
        # Expected format: "01 back.wav" or "01_back.wav"
        # Try to extract number
        try:
            parts = filename.replace('_', ' ').split(' ')
            num_str = parts[0]
            number = int(num_str)
            
            if number in word_map:
                word = word_map[number]
                # Capitalize word for filename: List4B_Word.wav
                new_filename = f"List4B_{word.capitalize()}.wav"
                
                src_path = os.path.join(audio_source_dir, filename)
                dst_path = os.path.join(audio_target_dir, new_filename)
                
                # Print as bash commands
                print(f"cp \"{src_path}\" \"{dst_path}\"")
                
            else:
                print(f"# Warning: No word found for number {number} in {filename}")
        except ValueError:
            print(f"# Warning: Could not parse number from {filename}")

except Exception as e:
    print(f"Error: {e}")
