# Changelog

## [1.3.8] - 2026-02-19
### Added
- **Rose Hill HF List 4B**: Integrated the final HF list with 25 words (Back, Chop, Thud, etc.) and normalized audio.

### Fixed
- **Audio Playback Path**: Resolved an issue where audio files for specific lists were not playing due to incorrect path construction.
- **Audio Normalization**: Verified that List 4B audio levels (-23.00 dBFS) match the existing HF lists.

## [1.3.7] - 2026-02-18
### Added
- **New Test Modal**: Added a dialog when starting a new test to choose between:
    - **Same Patient**: Clears test data but preserves Patient Name, ID, DOB, and Clinic Settings.
    - **New Patient**: Clears ALL data for a fresh start.

## [1.3.6] - 2026-02-15
### Fixed
- Restored missing audio files for HF List 1 (e.g., Sit, Shape, Youth) that were accidentally deleted in v1.3.5.

## [1.3.5] - 2026-02-15
### Added
- Speech Spectrum Noise generation based on Rose Hill HF LTASS.

## [1.3.4] - 2026-02-15
### Changed
- Updated Rose Hill High Frequency Word Lists 1-4 with new words (e.g., CASE, SHOUT, CHESS, TASK, STIFF).
- Replaced audio files for all High Frequency lists with high-quality recordings.
- Corrected phonemes for "MUSH" (List 4) and "CASE" (List 1).
- Added cache-busting to audio playback to ensure new files are loaded.

## [1.3.3] - 2026-02-14
### Added
- Added BKB-SIN List Pairs 7, 8, 9, and 10 with corresponding audio and sentence data.
- Added "Speech Azimuth" and "Noise Azimuth" fields to the Test Setup UI and PDF export.

### Changed
- Hidden "Phoneme/Word" scoring toggle and "Automated Error Pattern Analysis" when BKB-SIN lists are selected to streamline the interface.

### Fixed
- Fixed a runtime error that caused a blank screen when viewing analysis results for BKB-SIN lists.

## [1.3.2] - 2026-02-11
### Fixed
- Fixed "could not play audio file" error for BKB-SIN media by including the `BKB-SIN` folder in the build artifacts.
