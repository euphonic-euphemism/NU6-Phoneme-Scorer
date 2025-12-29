NU-6 Word and Phoneme Scorer

A standalone, secure, web-based application for scoring NU-6 word lists in clinical audiology settings. This tool offers granular phoneme scoring, whole-word scoring, and statistical comparison between two test conditions using gold-standard simulation data.

Features

Standardized Lists

Includes NU-6 Lists 1A, 2A, 3A, and 4A with full phonemic breakdowns and IPA notation.

Advanced Scoring Modes

Granular Phoneme Scoring: Mark individual phonemes as correct or incorrect. Automatically identifies error patterns by phoneme class (Fricatives, Nasals, Vowels, etc.).

Whole Word Scoring: Rapid scoring via "Correct" or "Incorrect" toggles for standard Word Recognition Score (WRS) calculation.

Statistical Veracity

Monte Carlo Simulation Models: Replaces the legacy Thornton & Raffin (1978) mathematical approximations with more accurate critical difference tables derived via Pairwise Monte Carlo simulations.

Comprehensive Lookup Tables: In-app access to 80% and 95% Confidence Interval tables for all supported list lengths (N=10, 25, 50 words; N=30, 75, 150 phonemes).

Significance Detection: Real-time calculation of whether the difference between two test conditions (e.g., Aided vs. Unaided) is statistically significant.

Security & Privacy

Local Encryption: All patient data is stored locally in the browser's IndexedDB, protected by AES-GCM 256-bit encryption.

Zero-Knowledge Architecture: Decryption keys are derived from user passwords using PBKDF2; data never leaves the local machine.

Clinical Workflow Tools

Comparison Mode: Evaluate "Condition A" against "Condition B" side-by-side.

Comparative Ease of Listening Scale: Quantify subjective patient feedback on a 0-10 scale when objective scores are within critical limits.

Longitudinal History: Track a patient’s performance over time with automated trend graphing.

Reporting & Integration

Professional PDF Export: Generate formatted clinical reports including clinic branding, patient demographics, and automated statistical interpretations.

Data Portability: Export local databases to JSON or FHIR Bundle format for potential EHR integration.

Installation & Usage

Web Version

Simply open nu6_scoring_app.html in any modern web browser (Chrome, Edge, Firefox, Safari). The app is entirely self-contained and functions offline once loaded.

Desktop App (Linux/Debian)

To build the desktop application using Electron:

Install Dependencies:

npm install


Run Locally:

npm start


Build Installer:

npm run dist


Tech Stack

React: UI logic and state management.

Tailwind CSS: Modern, responsive styling.

Web Crypto API: PBKDF2 key derivation and AES-GCM encryption.

IndexedDB: Persistent, secure local storage.

Chart.js: Historical trend analysis and visualization.

jsPDF: Professional document generation.

License

ISC