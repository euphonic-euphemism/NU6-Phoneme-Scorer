const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 900,
        title: "NU-6 Phoneme Scorer",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the HTML file
    win.loadFile('nu6_scoring_app.html');

    // Remove the default menu bar for a cleaner look
    win.setMenuBarVisibility(false);

    // Handle window close event
    win.on('close', (e) => {
        // Always prevent the default close event initially
        e.preventDefault();
        
        // Ask the renderer if there are unsaved changes
        win.webContents.executeJavaScript('window.hasUnsavedChanges || false')
            .then((unsaved) => {
                if (unsaved) {
                    const choice = dialog.showMessageBoxSync(win, {
                        type: 'warning',
                        buttons: ['Save and Close', 'Close Without Saving', 'Cancel'],
                        defaultId: 0,
                        cancelId: 2,
                        title: 'Unsaved Changes',
                        message: 'You have unsaved changes.',
                        detail: 'Do you want to save your changes before closing?'
                    });

                    if (choice === 0) {
                        // Save and close
                        win.webContents.executeJavaScript('window.saveBeforeClose()').then(() => {
                            // Remove the listener temporarily to allow closing
                            win.removeAllListeners('close');
                            win.close();
                        });
                    } else if (choice === 1) {
                        // Close without saving
                        win.removeAllListeners('close');
                        win.close();
                    }
                    // If choice === 2 (Cancel), do nothing and keep the window open
                } else {
                    // No unsaved changes, close normally
                    win.removeAllListeners('close');
                    win.close();
                }
            })
            .catch((err) => {
                console.error('Error checking unsaved changes:', err);
                // If there's an error checking, just close anyway
                win.removeAllListeners('close');
                win.close();
            });
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
