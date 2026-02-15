import json

# Existing HF Lists (from previous known state or hardcoded for comparison)
# I will use empty lists for "Old" and rely on the script to output the "New" list fully so I can diff manually if needed, 
# or better yet, I will update this script to load the "Old" lists from what I know is in the code.

# Current Code State (Approximate)
HF1 = ["CHECK", "PUSH", "SPACE", "SIT", "THUMB", "SHAPE", "YOUTH", "FACE", "GAS", "TEACH", "SAFE", "HISS", "BUS", "CHIEF", "PATH", "VOTE", "RICH", "CATCH", "KEEP", "FISH", "SOUTH", "CHOOSE", "TIP", "SHAKE", "NOISE"]
HF2 = ["TOUCH", "LIFE", "FIT", "SUM", "SHOES", "NECK", "MOUTH", "DEEP", "PASS", "CHOICE", "NOTE", "BATH", "SHIP", "KISS", "REACH", "SHOUT", "BEEF", "CASE", "WISH", "DIP", "TAKE", "SIZE", "MATCH", "TOOTH", "BUSH"]
HF3 = ["FIGHT", "TOUGH", "MOSS", "PITCH", "CHESS", "THICK", "SHEET", "CHASE", "CASH", "SHOCK", "BOOTH", "VICE", "SIP", "CHIP", "SAKE", "SACK", "SHOP", "MESH", "PEAK", "SET", "SIGHT", "TASK", "SICK", "HUSH", "FETCH"]
HF4 = ["BACK", "CHOP", "THUD", "SAT", "STIFF", "DASH", "SUCH", "TIGHT", "POACH", "BOTH", "POSH", "SHOOT", "CHAT", "VASE", "PICK", "ROOF", "HASH", "HATCH", "MUSH", "LOSS", "SIDE", "SHACK", "SOUP", "SHOT", "SEEK"]

old_lists = {
    "1": HF1,
    "2": HF2,
    "3": HF3,
    "4": HF4
}

new_lists = {
    "1": [],
    "2": [],
    "3": [],
    "4": []
}

# Parse dump file
current_list = None
with open("hf_excel_dump.txt", "r") as f:
    for line in f:
        line = line.strip()
        if not line: continue
        parts = line.split()
        if len(parts) < 2: continue
        
        # Check for list headers
        if "List 1B" in line: current_list = "1"; continue
        if "List 2B" in line: current_list = "2"; continue
        if "List 3B" in line: current_list = "3"; continue
        if "List 4B" in line: current_list = "4"; continue
        
        if parts[-1] == "NaN": continue
        
        word = parts[-1].upper()
        if not word.isalpha(): continue 
        if word == "LIST": continue
        if "B" in parts and len(parts) == 3 and parts[1] == "List": continue 

        if current_list:
            new_lists[current_list].append(word)

# Compare
for i in ["1", "2", "3", "4"]:
    print(f"\n--- Comparing List {i} vs {i}B ---")
    old = old_lists[i]
    new = new_lists[i]
    
    new = [w for w in new if w not in ["LIST", "1B", "2B", "3B", "4B"]]
    
    diffs = []
    # Compare length
    if len(new) != len(old):
        print(f"Length mismatch: Old={len(old)}, New={len(new)}")

    for idx, (o, n) in enumerate(zip(old, new)):
        if o != n:
            diffs.append(f"Item {idx+1}: {o} -> {n}")
            
    if diffs:
        print("Differences found:")
        for d in diffs:
            print(d)
    else:
        print("No differences found. Exact match.")
