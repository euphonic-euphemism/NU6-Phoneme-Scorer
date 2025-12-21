NU-6 Phoneme Scorer

A desktop application for scoring NU-6 word lists using phonemic scoring. Features standard Thornton & Raffin (1978) statistical comparison tables for validating hearing aid fittings and word recognition performance.

Features

Phonemic Scoring: Detailed breakdown of errors (Initial/Medial/Final phonemes).

Dual Test Comparison: Compare "Unaided vs. Aided" or "Current Tech vs. New Tech".

Statistical Validity: Built-in critical difference tables (95% and 80% confidence intervals) based on Thornton & Raffin (1978).

Listening Effort: Subjective rating scale (0-10) for patient feedback.

Save/Open: Save patient sessions to local JSON files.

Print-Ready: Clean layout for printing results to PDF or paper.

Installation / Building

To build this app yourself from the source code:

Install Node.js: Download from nodejs.org.

Clone the Repo:

git clone [https://github.com/YOUR_USERNAME/NU6-Phoneme-Scorer.git](https://github.com/YOUR_USERNAME/NU6-Phoneme-Scorer.git)
cd NU6-Phoneme-Scorer


Install Dependencies:

npm install


Build the App:

For your current OS:

npm run build


Note: To build for all platforms (Mac/Win/Linux) from a single machine, you may need specific configurations or use GitHub Actions.

Output

Executables will appear in the dist/ folder:

Windows: NU-6 Scorer Setup 1.0.0.exe

Mac: NU-6 Scorer-1.0.0.dmg

Linux: .AppImage and .deb files

Usage

Launch the app.

Select Test A configuration (Condition, List, Level).

Score the word list phoneme-by-phoneme.

Select Test B to score the second condition.

Click the Comparison Results tab to view statistical analysis of the improvement/deficit.

License

MIT
