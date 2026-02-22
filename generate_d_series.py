import csv
import re
import json

c_lists = """
        const LIST_HF1 = [{ i: 1, w: "CHECK", p: ["tʃ", "ɛ", "k"] }, { i: 2, w: "PUSH", p: ["p", "ʊ", "ʃ"] }, { i: 3, w: "CASE", p: ["k", "eɪ", "s"] }, { i: 4, w: "SIT", p: ["s", "ɪ", "t"] }, { i: 5, w: "THUMB", p: ["θ", "ʌ", "m"] }, { i: 6, w: "SHAPE", p: ["ʃ", "eɪ", "p"] }, { i: 7, w: "YOUTH", p: ["j", "u", "θ"] }, { i: 8, w: "FACE", p: ["f", "eɪ", "s"] }, { i: 9, w: "GAS", p: ["g", "æ", "s"] }, { i: 10, w: "TEACH", p: ["t", "i", "tʃ"] }, { i: 11, w: "SAFE", p: ["s", "eɪ", "f"] }, { i: 12, w: "HISS", p: ["h", "ɪ", "s"] }, { i: 13, w: "BUS", p: ["b", "ʌ", "s"] }, { i: 14, w: "CHIEF", p: ["tʃ", "i", "f"] }, { i: 15, w: "PATH", p: ["p", "æ", "θ"] }, { i: 16, w: "VOTE", p: ["v", "oʊ", "t"] }, { i: 17, w: "RICH", p: ["r", "ɪ", "tʃ"] }, { i: 18, w: "CATCH", p: ["k", "æ", "tʃ"] }, { i: 19, w: "KEEP", p: ["k", "i", "p"] }, { i: 20, w: "FISH", p: ["f", "ɪ", "ʃ"] }, { i: 21, w: "SOUTH", p: ["s", "aʊ", "θ"] }, { i: 22, w: "CHOOSE", p: ["tʃ", "u", "z"] }, { i: 23, w: "TIP", p: ["t", "ɪ", "p"] }, { i: 24, w: "SHAKE", p: ["ʃ", "eɪ", "k"] }, { i: 25, w: "NOISE", p: ["n", "ɔɪ", "z"] }];
        const LIST_HF2 = [{ i: 1, w: "TOUCH", p: ["t", "ʌ", "tʃ"] }, { i: 2, w: "LIFE", p: ["l", "aɪ", "f"] }, { i: 3, w: "FIT", p: ["f", "ɪ", "t"] }, { i: 4, w: "SUM", p: ["s", "ʌ", "m"] }, { i: 5, w: "TOSS", p: ["t", "ɔ", "s"] }, { i: 6, w: "NECK", p: ["n", "ɛ", "k"] }, { i: 7, w: "MOUTH", p: ["m", "aʊ", "θ"] }, { i: 8, w: "DEEP", p: ["d", "i", "p"] }, { i: 9, w: "PASS", p: ["p", "æ", "s"] }, { i: 10, w: "CHOICE", p: ["tʃ", "ɔɪ", "s"] }, { i: 11, w: "NOTE", p: ["n", "oʊ", "t"] }, { i: 12, w: "BATH", p: ["b", "æ", "θ"] }, { i: 13, w: "SHIP", p: ["ʃ", "ɪ", "p"] }, { i: 14, w: "KISS", p: ["k", "ɪ", "s"] }, { i: 15, w: "REACH", p: ["r", "i", "tʃ"] }, { i: 16, w: "SHOUT", p: ["ʃ", "aʊ", "t"] }, { i: 17, w: "BEEF", p: ["b", "i", "f"] }, { i: 18, w: "PACE", p: ["p", "eɪ", "s"] }, { i: 19, w: "WISH", p: ["w", "ɪ", "ʃ"] }, { i: 20, w: "DIP", p: ["d", "ɪ", "p"] }, { i: 21, w: "TAKE", p: ["t", "eɪ", "k"] }, { i: 22, w: "SIZE", p: ["s", "aɪ", "z"] }, { i: 23, w: "MATCH", p: ["m", "æ", "tʃ"] }, { i: 24, w: "TOOTH", p: ["t", "u", "θ"] }, { i: 25, w: "BUSH", p: ["b", "ʊ", "ʃ"] }];
        const LIST_HF3 = [{ i: 1, w: "FIGHT", p: ["f", "aɪ", "t"] }, { i: 2, w: "TOUGH", p: ["t", "ʌ", "f"] }, { i: 3, w: "MOSS", p: ["m", "ɔ", "s"] }, { i: 4, w: "PITCH", p: ["p", "ɪ", "tʃ"] }, { i: 5, w: "CHESS", p: ["tʃ", "ɛ", "s"] }, { i: 6, w: "THICK", p: ["θ", "ɪ", "k"] }, { i: 7, w: "SHEET", p: ["ʃ", "i", "t"] }, { i: 8, w: "CHASE", p: ["tʃ", "eɪ", "s"] }, { i: 9, w: "PACK", p: ["p", "æ", "k"] }, { i: 10, w: "SHOCK", p: ["ʃ", "ɑ", "k"] }, { i: 11, w: "BOOTH", p: ["b", "u", "θ"] }, { i: 12, w: "VICE", p: ["v", "aɪ", "s"] }, { i: 13, w: "SIP", p: ["s", "ɪ", "p"] }, { i: 14, w: "CHIP", p: ["tʃ", "ɪ", "p"] }, { i: 15, w: "SAKE", p: ["s", "eɪ", "k"] }, { i: 16, w: "SACK", p: ["s", "æ", "k"] }, { i: 17, w: "SHOP", p: ["ʃ", "ɑ", "p"] }, { i: 18, w: "MESH", p: ["m", "ɛ", "ʃ"] }, { i: 19, w: "PEAK", p: ["p", "i", "k"] }, { i: 20, w: "SET", p: ["s", "ɛ", "t"] }, { i: 21, w: "SIGHT", p: ["s", "aɪ", "t"] }, { i: 22, w: "SHOES", p: ["ʃ", "u", "z"] }, { i: 23, w: "SICK", p: ["s", "ɪ", "k"] }, { i: 24, w: "HUSH", p: ["h", "ʌ", "ʃ"] }, { i: 25, w: "FETCH", p: ["f", "ɛ", "tʃ"] }];
        const LIST_HF4 = [{ i: 1, w: "BACK", p: ["b", "æ", "k"] }, { i: 2, w: "CHOP", p: ["tʃ", "ɑ", "p"] }, { i: 3, w: "THUD", p: ["θ", "ʌ", "d"] }, { i: 4, w: "CASH", p: ["k", "æ", "ʃ"] }, { i: 5, w: "THIEF", p: ["θ", "i", "f"] }, { i: 6, w: "DASH", p: ["d", "æ", "ʃ"] }, { i: 7, w: "SUCH", p: ["s", "ʌ", "tʃ"] }, { i: 8, w: "TIGHT", p: ["t", "aɪ", "t"] }, { i: 9, w: "POACH", p: ["p", "oʊ", "tʃ"] }, { i: 10, w: "BOTH", p: ["b", "oʊ", "θ"] }, { i: 11, w: "POSH", p: ["p", "ɑ", "ʃ"] }, { i: 12, w: "SHOOT", p: ["ʃ", "u", "t"] }, { i: 13, w: "CHAT", p: ["tʃ", "æ", "t"] }, { i: 14, w: "VASE", p: ["v", "eɪ", "s"] }, { i: 15, w: "PICK", p: ["p", "ɪ", "k"] }, { i: 16, w: "ROOF", p: ["r", "u", "f"] }, { i: 17, w: "HASH", p: ["h", "æ", "ʃ"] }, { i: 18, w: "HATCH", p: ["h", "æ", "tʃ"] }, { i: 19, w: "MUSH", p: ["m", "ʊ", "ʃ"] }, { i: 20, w: "LOSS", p: ["l", "ɔ", "s"] }, { i: 21, w: "SIDE", p: ["s", "aɪ", "d"] }, { i: 22, w: "SHACK", p: ["ʃ", "æ", "k"] }, { i: 23, w: "SOUP", p: ["s", "u", "p"] }, { i: 24, w: "SHOT", p: ["ʃ", "ɑ", "t"] }, { i: 25, w: "SEEK", p: ["s", "i", "k"] }];
"""

word_to_p = {}
matches = re.finditer(r'w:\s*"([^"]+)",\s*p:\s*\[([^\]]+)\]', c_lists)
for m in matches:
    word = m.group(1).upper()
    p_str = m.group(2)
    p_arr = [p.strip().strip('"').strip("'") for p in p_str.split(',')]
    word_to_p[word] = p_arr

new_lists = {
    "1D": [], "2D": [], "3D": [], "4D": []
}

with open("Rose_Hill_HF_Word_Lists_D_Series.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        list_name = row["List"]
        word = row["Word"].upper()
        if word not in word_to_p:
            print(f"ERROR: Missing phonemes for {word}")
        else:
            new_lists[list_name].append({
                "w": word,
                "p": word_to_p[word]
            })

hf1_str = "        const LIST_HF1 = [" + ", ".join([f'{{ i: {i+1}, w: "{w["w"]}", p: {json.dumps(w["p"])} }}' for i, w in enumerate(new_lists["1D"])]) + "];"
hf2_str = "        const LIST_HF2 = [" + ", ".join([f'{{ i: {i+1}, w: "{w["w"]}", p: {json.dumps(w["p"])} }}' for i, w in enumerate(new_lists["2D"])]) + "];"
hf3_str = "        const LIST_HF3 = [" + ", ".join([f'{{ i: {i+1}, w: "{w["w"]}", p: {json.dumps(w["p"])} }}' for i, w in enumerate(new_lists["3D"])]) + "];"
hf4_str = "        const LIST_HF4 = [" + ", ".join([f'{{ i: {i+1}, w: "{w["w"]}", p: {json.dumps(w["p"])} }}' for i, w in enumerate(new_lists["4D"])]) + "];"

for l_name, l_content in new_lists.items():
    if len(l_content) != 25:
        print(f"ERROR: List {l_name} has {len(l_content)} items")

with open("d_series_output.txt", "w") as f:
    f.write(hf1_str + "\n" + hf2_str + "\n" + hf3_str + "\n" + hf4_str + "\n")

print("Done generating output. Check d_series_output.txt")
