const path = require('path');
const fs = require('fs');
const os = require('os');

const { app, BrowserWindow, globalShortcut, Menu, dialog } = require('electron');


const CWD = app.getAppPath();

var mainWindow;
var configSource;

/**
 * @param {String} fpath  file path
 * @return {Boolean}
 */
function fileExists (fpath) {
    try {
        return fs.statSync(fpath).isFile();
    } catch {
        return false;
    }
}

function loadConfigSource () {
    var configDir;
    if (CWD.endsWith('.asar')) {
        configDir = CWD.replace(/[\w\-]+\.asar$/, '');
    } else {
        configDir = CWD;
    }
    var fpath = path.join(configDir, 'config.json');

    try {
        var content = fs.readFileSync(fpath, { encoding: 'utf-8', flag: 'r' });
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 1480,
        height: 960,
        fullscreen: false,
        alwaysOnTop: false,
        center: true,
        title: '教师屏客户端配置工具',
        icon: 'ui/Image/云朵.ico',
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            enableRemoteModule: true
        },
        resizable:false
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile('ui/index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}


function main () {
    configSource = loadConfigSource();

    if (!configSource) {
        process.exit(1);
    }

    app.on('ready', () => {
        Menu.setApplicationMenu(null);
        createMainWindow();

        if (configSource.debug) {
            if (mainWindow) {
                globalShortcut.register('CmdOrCtrl+D', () => {
                    mainWindow.webContents.openDevTools();
                });

                globalShortcut.register('CmdOrCtrl+Shift+R', () => {
                    mainWindow.webContents.reloadIgnoringCache();
                });

                globalShortcut.register('CmdOrCtrl+Q', () => {
                    app.quit();
                });
            }
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform != 'darwin') {
            app.quit();
        }
    });

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
    });

    process.on('uncaughtException', err => {
        dialog.showMessageBox({
            type: 'error',
            title: 'Error',
            message: err.message
        })
        .then(() => {
            if (!mainWindow || !mainWindow.isVisible()) {
                app.quit();
                process.exit(2);
            }
        });
    });
}

main();