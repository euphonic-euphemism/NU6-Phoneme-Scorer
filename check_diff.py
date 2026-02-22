import csv
import re
import ast

html_path = '/home/marks/Development/nu6-phoneme-scorer/nu6_scoring_app.html'
csv_path = '/home/marks/Development/nu6-phoneme-scorer/Rose_Hill_HF_Word_Lists_C_Series.csv'

with open(html_path, 'r') as f:
    html = f.read()

lists = {}
for i in range(1, 5):
    match = re.search(r'const LIST_HF' + str(i) + r' = (\[.*?\]);', html)
    if match:
        arr_str = match.group(1)
        arr_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)(\s*:)', r'\1"\2"\3', arr_str)
        lists[i] = ast.literal_eval(arr_str)

csv_lists = {1: {}, 2: {}, 3: {}, 4: {}}
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        list_num = int(row['List'][0])
        csv_lists[list_num][int(row['Number'])] = row['Word'].upper()

for list_num in range(1, 5):
    old_list = lists[list_num]
    for item in old_list:
        idx = item['i']
        old_w = item['w']
        if idx in csv_lists[list_num]:
            new_w = csv_lists[list_num][idx]
            if old_w != new_w:
                print(f"List HF{list_num} Item {idx}: {old_w} -> {new_w} (old phonemes: {item['p']})")
