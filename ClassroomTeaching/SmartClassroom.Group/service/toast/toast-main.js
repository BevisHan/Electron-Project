const url = require('url');
const path = require('path');

const { ipcMain, screen, BrowserWindow, app } = require('electron');


const INIT_EVENT = 'toast-init';
const ACTION_EVENT = 'toast-action';
const FIRE_EVENT = 'toast-fire';
const RESIZE_EVENT = 'toast-resize';

const TEMPLATE_FILE = path.resolve(app.getAppPath(), 'ui/toast/toast.html');

const FIRE_SRC = {
    SHELL: 0X01,
    WINDOW: 0x02
};

const POSITION = {
    LFET: 0x01,
    RIGHT: 0x02
};

const LAYOUTS = {
    SIDEBAR_WIDTH: 80,
    TOOLBAR_HEIGHT: 80,
    TOAST_PADDING: 10
};


var gToastPosition = POSITION.LFET;
var gToastCallback = null;

var gToastId = 0;

var tWindow = null;
var currentToast = null;


function checkToastInstance (handle) {
    return currentToast && currentToast.id == handle.id;
}

function nextId () {
    gToastId++;
    return gToastId;
}

function computeToastPosition (tWidth, tHeight) {
    var displayer = screen.getPrimaryDisplay();
    var bounds = displayer.bounds;

    var x, y;
    y = bounds.height - LAYOUTS.TOOLBAR_HEIGHT - LAYOUTS.TOAST_PADDING - tHeight;
    if (gToastPosition == POSITION.LFET) {
        x = LAYOUTS.SIDEBAR_WIDTH + LAYOUTS.TOAST_PADDING;
    } else {
        x = bounds.width - LAYOUTS.SIDEBAR_WIDTH - LAYOUTS.TOAST_PADDING - tWidth;
    }

    return [x, y];
}

function showToast (handle) {
    if (tWindow === null){
        tWindow = new BrowserWindow({
            alwaysOnTop: true,
            center: false,
            closable: true,
            maximizable: false,
            minimizable: false,
            modal: false,
            resizable: true,
            show: false,
            frame: false,
            transparent: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                webgl: false,
                webaudio: false,
                devTools: true
            }
        });

        tWindow.setMenuBarVisibility(false);
    }

    tWindow.webContents.once('did-finish-load', () => {
        if (checkToastInstance(handle)) {
            tWindow.show();
            tWindow.webContents.send(INIT_EVENT, handle.opt);

            var timeout = handle.opt.timeout;
            if (timeout >= 0) {
                setTimeout(() => {
                    if (checkToastInstance(handle)) {
                        if (tWindow.isVisible()) {
                            tWindow.hide();
                        }
                    }
                }, timeout);
            }
        }
    });

    tWindow.once('blur', () => {
        if (tWindow.isVisible()) {
            tWindow.hide();
        }
    });

    if (!tWindow.isVisible()) {
        tWindow.setPosition(-1000, -1000);
        tWindow.setSize(0, 0);
    }

    ipcMain.once(RESIZE_EVENT, (evt, size) => {
        if (checkToastInstance(handle)) {
            tWindow.setSize(size[0], size[1]);

            var [x, y] = computeToastPosition(size[0], size[1]);
            tWindow.setPosition(x, y);
        }
    });

    ipcMain.once(ACTION_EVENT, (evt) => {
        if (checkToastInstance(handle)) {
            tWindow.hide();

            if (gToastCallback) {
                var toast = currentToast;
                currentToast = null;
                gToastCallback(toast.opt.data, toast.sender || null);
            }
        }
    });

    currentToast = handle;

    tWindow.loadURL(url.format({
        slashes: true,
        protocol: 'file',
        pathname: TEMPLATE_FILE,
        query: {
            type: handle.type,
            id: handle.id
        }
    }));
}

function createToast (type, opt, fireSrc, sender) {
    if (!opt) {
        opt = {};
    }

    opt = Object.assign({
        icon: null,
        body: '',
        header: '',
        timeout: -1
    }, opt);

    var handle = {
        type: type,
        opt: opt,
        fireSrc: fireSrc,
        sender: sender,
        id: nextId()
    };

    showToast(handle);
}

ipcMain.on(FIRE_EVENT, (evt, type, opt) => {
    return createToast(type, opt, FIRE_SRC.WINDOW, evt.sender);
});

module.exports.showToast = function (type, opt) {
    return createToast(type, opt, FIRE_SRC.SHELL, null);
};

module.exports.registerCallback = function (callback) {
    if (typeof callback != 'function') {
        throw new TypeError("callback must be function");
    }

    gToastCallback = callback;
};

module.exports.POSITION = POSITION;

module.exports.setPosition = function (position) {
    if (typeof position != 'number' || isNaN(position)) {
        throw new TypeError("invalid position");
    }

    if (gToastPosition != position) {
        gToastPosition = position;

        if (tWindow && tWindow.isVisible()) {
            var size = tWindow.getSize();
            var [x, y] = computeToastPosition(size[0], size[1]);

            tWindow.setPosition(x, y);
        }
    }
}

module.exports.disposeToasts = function () {
    currentToast = null;
    if (tWindow) {
        tWindow.close();
        tWindow = null;
    }
};

module.exports.TOAST_TYPES = {
    DEFAULT: 'success',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
};