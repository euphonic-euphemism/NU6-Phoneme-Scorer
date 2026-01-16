const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const packageJson = require('./package.json');

// Platform-aware GPU handling to avoid GL/VSync/GTK errors on some Linux setups.
// Behavior:
// - If `NU6_GPU=off` or `NU6_FORCE_SOFTWARE=1` is set, force software GL.
// - On X11 sessions we default to disabling hardware acceleration (avoids common driver bugs).
// - On Wayland sessions we enable the Ozone/Wayland backend for better integration.
const sessionType = process.env.XDG_SESSION_TYPE || (process.env.WAYLAND_DISPLAY ? 'wayland' : process.env.DISPLAY ? 'x11' : 'unknown');
const forceSoftware = process.env.NU6_GPU === 'off' || process.env.NU6_FORCE_SOFTWARE === '1';
const preferWayland = process.env.NU6_WAYLAND === '1';

if (forceSoftware || (process.platform === 'linux' && sessionType === 'x11')) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-gpu-compositing');
    console.log('NU6: running with software GL (hardware acceleration disabled)');
} else if (process.platform === 'linux' && (sessionType === 'wayland' || preferWayland)) {
    app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
    app.commandLine.appendSwitch('ozone-platform', 'wayland');
    console.log('NU6: using Wayland/Ozone platform for rendering');
} else {
    console.log(`NU6: sessionType=${sessionType}, default GPU settings`);
}

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
    win.loadFile(path.join(__dirname, 'nu6_scoring_app.html'));

    // Create application menu with About dialog
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(win, {
                            type: 'info',
                            title: 'About NU-6 Phoneme Scorer',
                            message: `NU-6 Phoneme Scorer`,
                            detail: `Version: ${packageJson.version}\n\n${packageJson.description}\n\nAuthor: ${packageJson.author}\nLicense: ${packageJson.license}`,
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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
