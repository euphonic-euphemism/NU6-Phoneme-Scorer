# Privacy Policy for NU-6 Word and Phoneme Scorer

**Last Updated: December 30, 2025**

### 1. The Bottom Line: Your Data is Yours

The NU-6 Word and Phoneme Scorer ("the Software") is designed with privacy as a core feature. **We do not collect, transmit, or store any of your data.** All information you enter into the software stays on your computer.

### 2. How Your Data is Stored and Protected

-   **Local Storage Only**: All patient information (names, IDs, test results, notes) is saved only on your computer using your web browser's local database (IndexedDB).
-   **Zero Cloud**: Your data is never sent to a server or cloud service. It never leaves your machine.
-   **Strong Encryption**: Before any data is saved, it is encrypted using **AES-256-GCM**, an industry-standard, secure encryption method.
-   **You Hold the Key**:
    -   Access to your data is protected by a master password that you create.
    -   This password is used to generate an encryption key via **PBKDF2**.
    -   **Your password is never stored.** If you lose your password, your data cannot be recovered, not even by us.

### 3. What We Don't Collect

To be perfectly clear, we **do not** collect, see, or have access to:
-   Your name, email, or any personal identifiers.
-   Any patient information you enter.
-   Your usage patterns or how you interact with the software.
-   Your IP address or location.

The software contains no analytics, tracking pixels, or telemetry of any kind.

### 4. Data Export: You Are in Control

The software allows you to export your data for your own purposes, such as for backups or importing into an Electronic Health Record (EHR) system.

-   **Exported Files are Not Encrypted**: When you use the "Export DB" feature, the software creates a standard, unencrypted JSON file. This is necessary so that other systems can read it.
-   **Your Responsibility**: Once you export a file, you are responsible for keeping it safe. Please ensure you handle these files in a way that complies with your security and privacy obligations (such as HIPAA).

### 5. Data Deletion

You have full control to delete your data at any time.
-   **Deleting a Single Record**: You can delete individual patient records from within the application.
-   **Deleting the Entire Database**: The "Delete DB" feature in the settings menu will permanently and irreversibly delete all patient records from your computer.

### 6. How This Helps with HIPAA Compliance

This software is designed to help you meet your HIPAA obligations by providing:
-   **Access Control**: Data is locked behind your master password.
-   **Encryption at Rest**: PHI (Protected Health Information) is encrypted where it is stored.
-   **Physical Control**: You maintain full physical and digital control over the device and the data on it.

*Note: While the software provides these technical safeguards, you are still responsible for the physical security of your computer and the confidentiality of your password.*

### 7. Contact

If you have any questions about this privacy policy, please open an issue in the [GitHub Repository](https://github.com/NU-Audiology/nu6-scorer-desktop/issues) or email the developer at [mark.shaver@posteo.net](mailto:mark.shaver@posteo.net).