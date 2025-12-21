const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 960,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
        },
        // icon: path.join(__dirname, 'icon.png') // Uncomment if you add an icon
    });

    // Load the index.html of the app.
    // Ensure your HTML file is named 'nu6_scoring_app.html' and is in the same directory.
    mainWindow.loadFile('nu6_scoring_app.html');

    // Remove the default menu bar for a cleaner "app-like" look
    // You can comment this out if you want the standard File/Edit/View menu
    Menu.setApplicationMenu(null);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
