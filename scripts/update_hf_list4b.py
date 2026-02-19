
import pandas as pd
import json

file_path = "/home/marks/Development/nu6-phoneme-scorer/Rose Hil HF Word Lists 1B to 4B.xlsx"

try:
    xls = pd.ExcelFile(file_path)
    
    print(f"Available sheets: {xls.sheet_names}")
    
    sheet_name = "Sheet1"
    
    print(f"Reading sheet: {sheet_name}")
    df = pd.read_excel(xls, sheet_name=sheet_name, header=None) # Read without header to see raw
    
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_rows', 100)
    print(f"Shape: {df.shape}")
    
    # Search for "List 4B"
    print("\nSearching for 'List 4B'...")
    # Convert all to string and search
    mask = df.astype(str).apply(lambda x: x.str.contains('List 4B', case=False, na=False)).any(axis=1)
    results = df[mask]
    print(results)
    
    # Also print the tail
    print("\n--- Tail ---")
    print(df.tail(20))
    
    # Stop here to inspect
    exit()
    
    # Expected columns: 'Word', 'P1', 'P2', 'P3'
    # And maybe 'Carrier Phrase'??
    
    formatted_data = []
    
    # Iterate through rows and format
    # structure: { i: 1, word: "YEARN", phonemes: ["Y", "ER", "N"], carrier: "Say the word" }
    
    for index, row in df.iterrows():
        word = str(row.iloc[0]).strip().upper() # Adjust index based on column position
        p1 = str(row.iloc[1]).strip()
        p2 = str(row.iloc[2]).strip()
        p3 = str(row.iloc[3]).strip()
        
        phonemes = [p for p in [p1, p2, p3] if p and p != 'nan']
        
        entry = {
            "i": index + 1,
            "word": word,
            "phonemes": phonemes,
            "carrier": "Say the word"
        }
        formatted_data.append(entry)

    print(json.dumps(formatted_data, indent=4))

except Exception as e:
    print(f"Error: {e}")
