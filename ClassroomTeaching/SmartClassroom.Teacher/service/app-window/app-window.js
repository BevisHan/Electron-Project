const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const screenCaptureService = require('../screen-capture/screen-capture');
const toastService = require('../toast/toast-main');
const rootDir = require('../file/root-dir');
const appWindowConstant = require('../app-window/window-constant');
const log4js = require('log4js');
const urlencode = require('urlencode');

log4js.configure({
    appenders: {
        log_file: {                                     // 将log输出到文件，未来可扩展输出到日期文件，按不同等级输出日志文件，当前仅将全部log已info形式输出到指定log文件中
            type: 'file',
            filename: path.join(rootDir.getLogDir(), 'teacher'),
            maxLogSize: 209714520
        }
    },
    categories:{
        default: { appenders: ['log_file'], level: 'info' },
    }
});
var logger = log4js.getLogger();

const CWD = app.getAppPath();
function loadConfigSource () {
    var configDir;
    if (CWD.endsWith('.asar')) {
        configDir = CWD.replace(/[\w\-]+\.asar$/, '');
    } else {
        configDir = CWD;
    }
    var fpath = path.join(configDir, 'window-page.json');

    try {
        var content = fs.readFileSync(fpath, { encoding: 'utf-8', flag: 'r' });
        return JSON.parse(content);
    } catch {
        return null;
    }
}

var global = {
    sceneId: '',
    lessonId: '',
    redirectAPI: ''    
};

// 窗口定义
var sidebarWindow;
var mainWindow;
var toolbarWindow;
var briefWindow;
var reviewWindow;
var windows = [];
const bound = {
    _width: 1980,
    _height: 1080
};

function calculateWorkArea(workAreaInfo) {
    function calculate(calculateMethod, workAreaValue, configValue) {
        let value;
        switch (calculateMethod) {
            case appWindowConstant.CALCULATE_METHOD.addition:
                value = workAreaValue + configValue; break;
            case appWindowConstant.CALCULATE_METHOD.center:
                value = workAreaValue / 2; break;
            case appWindowConstant.CALCULATE_METHOD.mix:
                value = workAreaValue / 2 + configValue; break;
        }

        return value;
    }
    return {
        width: workAreaInfo.isNeedCalculateWidth ? calculate(workAreaInfo.calculateWidthMethod, bound._width, workAreaInfo.width) : workAreaInfo.width,
        height: workAreaInfo.isNeedCalculateHeight ? calculate(workAreaInfo.calculateHeightMethod, bound._height, workAreaInfo.height) : workAreaInfo.height,
        x: workAreaInfo.isNeedCalculateX ? 0 + calculate(workAreaInfo.calculateXMethod, bound._width, workAreaInfo.x) : workAreaInfo.x,
        y: workAreaInfo.isNeedCalculateY ? calculate(workAreaInfo.calculateYMethod, bound._height, workAreaInfo.y) : workAreaInfo.y,
    };
}

var windowPages;
var showedPages = [];

function hideWindowByPageId(id) {
    let isError = true;
    let page = showedPages.find(w => w.id == id);
    if (page && page.window.type) {
        let window = getWindowByType(page.window.type);
        if (window) {
            let currentPage = window.currentPage || {};
            let index = showedPages.findIndex(p => p.id == currentPage.id);
            if (index >= 0) {
                showedPages.splice(index, 1);
            }
            if (window.isVisible()) {
                window.hide();
            }
            isError = false;
            if (currentPage.moduleId) {
                sidebarWindow.webContents.send('Reset', currentPage.moduleId);
            }
        }
    }
    if (isError) {
        toastService.showToast(toastService.TOAST_TYPES.ERROR, {
            icon: 'lic-remove-circle-fill',
            body: '关闭窗口失败',
            header: '错误提示',
            timeout: 4000
        });
    }
}

/**
 * @description: 设置窗口配置信息
 * @param {Int} workArea.height 工作区域高度
 * @param {Int} workArea.width 工作区域宽度
 * @param {String} config.sceneId 场景标识
 * @param {String} config.lessonId 课时标识
 * @param {String} config.redirectAPI redirectAPI路径
 */
function init(workArea, config) {
    windowPages = loadConfigSource();
    if (!windowPages) {
        toastService.showToast(toastService.TOAST_TYPES.ERROR, {
            icon: 'lic-remove-circle-fill',
            body: '读取窗口初始化配置文件失败',
            header: '错误提示',
            timeout: 4000
        });
        process.exit(2);
    }
    bound._height = workArea.height;
    bound._width = workArea.width;

    screenCaptureService.init({
        top: appWindowConstant.CAPTURE_SCREEN_AREA.top,
        left: appWindowConstant.CAPTURE_SCREEN_AREA.left,
        width: bound._width + appWindowConstant.CAPTURE_SCREEN_AREA.width,
        height: bound._height + appWindowConstant.CAPTURE_SCREEN_AREA.height
    }, {
        top: appWindowConstant.CAPTURE_SCREEN_AREA.top,
        left: 0,
        width: bound._width,
        height: bound._height
    });

    global.sceneId = config.sceneId;
    global.lessonId = config.lessonId;
    global.redirectAPI = `${config.redirectAPI}Redirect?entrance=`;

    function createWindow(workAreaInfo, title = '', skipTaskbar = false, isTransparent = false) {
        let workArea = calculateWorkArea(workAreaInfo);
        return new BrowserWindow({
            width: workArea.width,
            height: workArea.height,
            x: workArea.x,
            y: workArea.y,
            fullscreen: false,
            alwaysOnTop: false,
            center: false,
            minimizable: false,
            maximizable: false,
            backgroundColor: isTransparent ? null : '#000000',
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false
            },
            frame: false,
            show: false,
            resizable: false,
            skipTaskbar: skipTaskbar,
            title: title,
            transparent: isTransparent,
            hasShadow: false
        });
    }
    sidebarWindow = createWindow(appWindowConstant.WINDOW_WORK_AREA.SIDEBAR_UNFOLD, '侧边栏', false, false);
    mainWindow = createWindow(appWindowConstant.WINDOW_WORK_AREA.MAIN_FULL_SCREEN, '主窗口', true, false);
    toolbarWindow = createWindow(appWindowConstant.WINDOW_WORK_AREA.TOOLBAR, '工具窗口', true, true);
    briefWindow = createWindow(appWindowConstant.WINDOW_WORK_AREA.BRIEF_CONTENT, '简报窗口', true, true);
    reviewWindow = createWindow(appWindowConstant.WINDOW_WORK_AREA.REVIEW_FULL_SCREEN, '讲评窗口', true, false);
    windows = [sidebarWindow, mainWindow, toolbarWindow, briefWindow, reviewWindow];

    windows.forEach(w => {
        w.on('closed', () => {
            w = null;
        });
        // 禁止关闭侧边栏以外的窗口
        if (w != sidebarWindow) {
            w.on('close', (event) => {
                event.preventDefault();
            });
        }
        w.on('hide', () => {
            w.loadURL('about:blank');
            w.currentPage = null;
        });
        w.on('focus', () => {
            w.setAlwaysOnTop(true, 'screen-saver');
        });
    });
    sidebarWindow.on('close', () => {
        let allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach(w => {
            if (w.closable) {
                w.destroy();
            }
        });
    });
     toolbarWindow.on('blur', () => {
         let currentPage = toolbarWindow.currentPage;
         if (currentPage && currentPage.moduleId) {
             sidebarWindow.webContents.send('Reset', currentPage.moduleId);
         }
         if (currentPage && currentPage.id && showedPages.some(p => p.id == currentPage.id)) {
             hideWindowByPageId(currentPage.id);
         }
     });
    function sidebarAlwaysOnTop() {
        sidebarWindow.setAlwaysOnTop(true, 'screen-saver');
        setTimeout(() => {
            sidebarAlwaysOnTop();
        }, 2000);
    }
    sidebarAlwaysOnTop();
}

function close() {
    windows.forEach(w => {
        w.destroy();
    });
}

/**
 * 获取当前拥有焦点的窗口
 *
 * @return {BrowserWindow}
 */
function getFocusedWindow() {
    for (let w of windows) {
        if (w.isVisible() && w.isFocused()) {
            return w;
        }
    }

    return null;
}

function openFocusedWindowDevTools() {
    let window = getFocusedWindow();
    if (window) {
        window.webContents.openDevTools();
    }
}

function reloadFocusedWindow(){
    let window = getFocusedWindow();
    if (window) {
        window.webContents.reloadIgnoringCache();
    }
}

function getWindowByType(type) {
    let window;
    switch (type) {
        case appWindowConstant.WINDOW_TYPES.brief:
            window = briefWindow; break;
        case appWindowConstant.WINDOW_TYPES.main:
            window = mainWindow; break;
        case appWindowConstant.WINDOW_TYPES.review:
            window = reviewWindow; break;
        case appWindowConstant.WINDOW_TYPES.sidebar:
            window = sidebarWindow; break;
        case appWindowConstant.WINDOW_TYPES.toolbar:
            window = toolbarWindow; break;
    }
    return window;
}

function getWindowWorkArea(type, size = null) {
    let key = size ? `${type}_${size}` : type;
    let workAreaInfo = appWindowConstant.WINDOW_WORK_AREA[key];
    let workArea = calculateWorkArea(workAreaInfo);
    return workArea;
}

function showWindow(id, extendParam = null, isForceReload = false) {
    if (showedPages.some(p => p.id == id) && !isForceReload) {
        return;
    }

    let isError = true;
    let page = windowPages.find(w => w.id == id);
    let window = getWindowByType(page.window.type);
    let workArea = getWindowWorkArea(page.window.type, page.window.size);
    if (window && workArea) {
        if (page.isCloseOther) {
            hideOtherWindows(['UnfoldSidebar', id]);
        } else {
            showedPages.push(page);
        }
        
        isError = false;
        let currentPage = window.currentPage || {};
        if (currentPage.moduleId && currentPage.moduleId != page.moduleId) {
            sidebarWindow.webContents.send('Reset', currentPage.moduleId);
        }           
        let index = showedPages.findIndex(p => p.id == currentPage.id);
        if (index >= 0) {
            showedPages.splice(index, 1);
        }
        let urlParam = {
            classroomid: global.sceneId,
            lessonid: global.lessonId
        };
        if (extendParam) {
            Object.assign(urlParam, extendParam);
        };
        if (currentPage.loadPath == page.loadPath && !isForceReload) {
            window.setBounds(workArea);
            window.show();
        } else {
            let promise;
            let loadPath = page.loadPath;
            switch (page.loadType) {
                case appWindowConstant.WINDOW_LOAD_TYPES.file:
                    promise = window.loadFile(loadPath, {
                        query: urlParam
                    });
                    break;
                case appWindowConstant.WINDOW_LOAD_TYPES.url:
                    let url = `${global.redirectAPI}${loadPath}?`;
                    let urlParamEntries = Object.entries(urlParam);
                    urlParamEntries.forEach((value, index) => {
                        urlParamEntries[index] = value.join('=');
                    });
                    var encodeUrlParams = urlencode.encode(urlParamEntries.join('&'));
                    url += encodeUrlParams;
                    promise = window.loadURL(url);
                    break;
            }
            promise.then(() => {
                window.setBounds(workArea);
                window.show();
            });
        }
        window.currentPage = page;
    }
    
    if (isError) {
        toastService.showToast(toastService.TOAST_TYPES.ERROR, {
            icon: 'lic-remove-circle-fill',
            body: '跳转失败',
            header: '错误提示',
            timeout: 4000
        });
    }
}

function hideOtherWindows(ids) {
    let pageIds = [];
    if (Array.isArray(ids)) {
        pageIds = Array.from(new Set(ids));
    } else {
        pageIds.push(ids);
    }
    let waitShowWindows = [];
    showedPages = [];
    pageIds.forEach(pageId => {
        let page = windowPages.find(w => w.id == pageId);
        let window = getWindowByType(page.window.type);
        waitShowWindows.push(window);
        showedPages.push(page);
    });
    windows.forEach(window => {
        if (!waitShowWindows.includes(window)) {
            window.hide();
        }
    });
}

function onlyShowSidebar() {
    hideOtherWindows('UnfoldSidebar');
}

function showSidebar() {
    showWindow('UnfoldSidebar');
}

function lessonChange(lessonId) {
    global.lessonId = lessonId;
    sidebarWindow.webContents.send('ChangeLesson', lessonId);
}

ipcMain.on('ShowWindow', (event, arg) => {
    let id = arg.id;
    let param = arg.param;
    let isForceReload = arg.isForceReload;
    showWindow(id, param, isForceReload);
});

ipcMain.on('HideWindow', (event, id) => {
    hideWindowByPageId(id);
});

ipcMain.on('FoldSidebar', () => {
    onlyShowSidebar();
    let workArea = getWindowWorkArea(appWindowConstant.WINDOW_TYPES.sidebar, appWindowConstant.WINDOW_SIZES.siderbar.fold);
    sidebarWindow.setBounds(workArea);
});
ipcMain.on('UnfoldSidebar', () => {
    let workArea = getWindowWorkArea(appWindowConstant.WINDOW_TYPES.sidebar, appWindowConstant.WINDOW_SIZES.siderbar.unfold);
    sidebarWindow.setBounds(workArea);
});
ipcMain.on('ShowDesktop', () => {
    onlyShowSidebar();
});
ipcMain.on('NotifyTimerOver', (event, arg) => {
    mainWindow.webContents.send('NotifyTimerOver', arg);
})

module.exports.init = init;
module.exports.close = close;
module.exports.showSidebar = showSidebar;
module.exports.openFocusedWindowDevTools = openFocusedWindowDevTools;
module.exports.reloadFocusedWindow = reloadFocusedWindow;
module.exports.lessonChange = lessonChange;
module.exports.showWindow = showWindow;
module.exports.onlyShowSidebar = onlyShowSidebar;
