const { app, BrowserWindow } = require('electron');
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
