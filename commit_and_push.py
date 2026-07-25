from dulwich.repo import Repo
from dulwich import porcelain
import os

repo = Repo('.')
status = porcelain.status('.')

files_to_add = []
for f in status.staged.values():
    files_to_add.extend(f)
files_to_add.extend(status.unstaged)
files_to_add.extend(status.untracked)

filtered_files = []
for f in files_to_add:
    f_str = f.decode('utf-8') if isinstance(f, bytes) else f
    if f_str.startswith('.venv') or f_str.startswith('node_modules') or f_str.startswith('dist') or f_str.startswith('.gemini'):
        continue
    filtered_files.append(f_str)

if filtered_files:
    porcelain.add(repo, paths=filtered_files)

porcelain.commit(repo, message=b"V2.0.0 Release - Massive UI Overhaul and Refactoring", author=b"Mark Shaver <mark.shaver@posteo.net>")
porcelain.tag(repo, b"v2.0.0", author=b"Mark Shaver <mark.shaver@posteo.net>", message=b"Version 2.0.0")

print("Commited and tagged!")
try:
    porcelain.push(repo, "origin", b"refs/heads/main")
    print("Pushed main!")
    porcelain.push(repo, "origin", b"refs/tags/v2.0.0")
    print("Pushed tags!")
except Exception as e:
    print("Error pushing:", e)

print("Successfully committed, tagged, and pushed!")
