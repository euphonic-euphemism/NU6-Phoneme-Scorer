with open("CHANGELOG.md", "r") as f:
    content = f.read()

new_entry = """## [1.4.1] - 2026-02-22
### Changed
- Updated Rose Hill HF lists from the C-series to the newly normalized D-series.
- Fixed an audio file indexing mismatch where list arrays diverged from chronological .wav files.

"""

content = content.replace("# Changelog\n\n", "# Changelog\n\n" + new_entry)
with open("CHANGELOG.md", "w") as f:
    f.write(content)
