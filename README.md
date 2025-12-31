# NU-6 Word and Phoneme Scorer

A standalone, secure, web-based application for scoring NU-6 word lists in clinical audiology settings. This tool offers granular phoneme scoring, whole-word scoring, and statistical comparison between two test conditions using gold-standard simulation data.

## Features

- **Standardized Lists**: Includes NU-6 Lists 1A, 2A, 3A, and 4A with full phonemic breakdowns and IPA notation.
- **Advanced Scoring Modes**: Granular phoneme scoring, whole-word scoring, and error pattern analysis.
- **Statistical Veracity**: Monte Carlo simulation models for accurate critical difference tables.
- **Significance Detection**: Real-time calculation of statistical significance between two test conditions.
- **Security & Privacy**: All patient data is stored locally with AES-GCM 256-bit encryption.
- **Clinical Workflow Tools**: Comparison mode, comparative ease of listening scale, and longitudinal history tracking.
- **Reporting & Integration**: Professional PDF export and data portability with JSON.

## Installation & Usage

### Web Version

Simply open `nu6_scoring_app.html` in any modern web browser (Chrome, Edge, Firefox, Safari). The app is entirely self-contained and functions offline once loaded.

### Desktop App

Desktop applications for Windows, macOS, and Linux are available via the [GitHub Releases](https://github.com/NU-Audiology/nu6-scorer-desktop/releases) page.

---

## For Developers

This section provides instructions for setting up the development environment, running the application locally, and building the distribution packages.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually included with Node.js)

### Project Structure

```
/
├── .github/              # GitHub Actions workflows for CI/CD
├── build/                # Icons and build resources
├── scripts/              # Helper scripts (e.g., database checks)
├── main.js               # Electron main process
├── nu6_scoring_app.html  # The single-page HTML application
├── package.json          # Project metadata and dependencies
└── README.md             # This file
```

### Setup and Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NU-Audiology/nu6-scorer-desktop.git
    cd nu6-scorer-desktop
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application in development mode:**
    This will start the Electron application with hot-reloading enabled.
    ```bash
    npm start
    ```

### Building for Production

The application uses `electron-builder` to create distributable packages for Windows, macOS, and Linux.

-   **Build for your current OS:**
    ```bash
    npm run dist
    ```

-   **Build for a specific OS:**
    -   Windows (NSIS installer): `npm run dist -- --win`
    -   macOS (DMG): `npm run dist -- --mac`
    -   Linux (Debian package & AppImage): `npm run dist -- --linux`

    The generated installers and packages will be located in the `dist/` directory.

### Code Style and Conventions

-   The application is built as a single, large React component within a single HTML file (`nu6_scoring_app.html`).
-   All JavaScript, including React and application logic, is transpiled in the browser by Babel.
-   Styling is done with Tailwind CSS.
-   Please maintain the existing code style and conventions when contributing.