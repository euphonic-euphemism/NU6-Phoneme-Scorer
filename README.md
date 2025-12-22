NU-6 Phoneme Scorer

A standalone, web-based (and Electron-wrappable) application for scoring NU-6 word lists in a clinical audiology setting. This tool offers granular phoneme scoring, whole-word scoring, and statistical comparison between two test conditions.

Features

Standard Lists: Includes NU-6 Lists 1A, 2A, 3A, and 4A with phonemic breakdown.

Scoring Modes:

Phoneme Scoring: Click individual phonemes (IPA symbols) to mark correct/incorrect.

Whole Word Scoring: Simple Correct/Incorrect buttons for standard WRS calculation.

Comparison Mode:

Run two tests side-by-side (e.g., "Unaided" vs "New Tech").

Automatic calculation of difference scores.

Statistical Significance: Uses the Thornton & Raffin (1978) model to determine if score differences are critical based on the number of items (N) and confidence level (95% or 80%).

Smart Testing:

10-Word Quick Test: Automatically prompts to stop after 10 words. If stopped, stats adjust to N=10.

Full Lists: Supports standard 25 (half-list) and 50 (full-list) word scoring.

Reporting:

Save results to JSON.

Print / Save as PDF with patient demographics and clinical notes.

Offline Capable: Single-file HTML architecture with embedded React logic.

Installation & Usage

Web Version

Simply open nu6_scoring_app.html in any modern web browser (Chrome, Edge, Firefox, Safari). No installation required.

Desktop App (Linux/Debian)

To build the desktop application using Electron:

Install Dependencies:

npm install


Run Locally:

npm start


Build .deb Package:

npm run dist


The output file will be located in the dist/ directory.

Configuration

The application uses standard NU-6 ordering by default but includes specific custom orderings for Lists 1A (2nd half), 2A, 3A, and 4A based on clinical PDF references.

Tech Stack

React: UI Logic (UMD build, no compile step required for dev).

Tailwind CSS: Styling.

Electron: Desktop wrapper for Linux deployment.

Electron Builder: For packaging .deb installers.

License

ISC
