import re

with open("d_series_output_fixed.txt", "r") as f:
    lines = f.readlines()
    hf1 = lines[0].strip()
    hf2 = lines[1].strip()
    hf3 = lines[2].strip()
    hf4 = lines[3].strip()

with open("nu6_scoring_app.html", "r") as f:
    html = f.read()

html = re.sub(r'const LIST_HF1 = \[.*?\];', hf1, html, flags=re.DOTALL)
html = re.sub(r'const LIST_HF2 = \[.*?\];', hf2, html, flags=re.DOTALL)
html = re.sub(r'const LIST_HF3 = \[.*?\];', hf3, html, flags=re.DOTALL)
html = re.sub(r'const LIST_HF4 = \[.*?\];', hf4, html, flags=re.DOTALL)

with open("nu6_scoring_app.html", "w") as f:
    f.write(html)
print("Patched nu6_scoring_app.html")
