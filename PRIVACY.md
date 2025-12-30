Privacy Policy for NU-6 Word and Phoneme Scorer

Last Updated: December 29, 2025

1. Introduction

The NU-6 Word and Phoneme Scorer ("the Software") is a local-first application designed for audiologists and clinicians to score and track speech recognition tests. This Privacy Policy describes how data is handled within the application, specifically regarding local storage, encryption, and data export.

2. Data Storage & Encryption

The Software operates on a "Local-First" and "Zero-Knowledge" basis.

Local Storage: All patient data (Names, Patient IDs, Test Results, and Clinical Notes) is stored strictly on the local hard drive of the computer running the Software, using the browser's IndexedDB technology.

Encryption at Rest: All sensitive patient data is encrypted before it is saved to the disk using AES-256-GCM (Advanced Encryption Standard).

Password Protection & Key Derivation: Access to the database requires a master password set by the user. The Software uses PBKDF2 (Password-Based Key Derivation Function 2) to derive the encryption key from this password. The Software does not store this password. If the password is lost, the data is mathematically unrecoverable.

No Cloud Transmission: The Software does not connect to any external cloud database (such as Firebase, AWS, or Google Cloud). No patient data is ever transmitted to the developer or any third party.

3. Data Export & Interoperability

The Software includes features to export data for clinical interoperability (e.g., FHIR JSON Bundle, Database Backup).

Exported Files are Unencrypted: When you explicitly choose to export data (e.g., "Export DB"), the Software generates a standard, unencrypted JSON file so it can be read by other Electronic Health Record (EHR) systems.

User Responsibility: Once a file is exported from the secure environment of the Software, it is no longer encrypted by the application. It is the sole responsibility of the user to ensure these exported files are stored, transmitted, or disposed of in a HIPAA-compliant manner.

4. HIPAA Compliance

The Software provides the technical tools to assist clinicians in maintaining HIPAA compliance:

Physical Control: PHI (Protected Health Information) remains contained within the user's secure internal network or device.

Encryption: Data is encrypted at rest, providing a layer of security against unauthorized access to the physical device.

Access Control: The application requires authentication via the user-defined master password to view or decrypt patient records.

Note: While the Software provides the tools for compliance, the user is responsible for the physical security of the device and the management of their encryption password.

5. Analytics & Telemetry

The Software does not contain tracking pixels, analytics scripts, or telemetry that reports usage or data back to the developer. It functions entirely as a standalone client-side tool.

6. Contact

If you have questions about this privacy policy or the source code, please open an issue in the GitHub Repository or email me at mark.shaver@posteo.net