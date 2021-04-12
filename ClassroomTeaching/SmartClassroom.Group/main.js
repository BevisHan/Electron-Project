const path = require('path');
const fs = require('fs');
const async = require('async');
const urlencode = require('urlencode');
const { app, globalShortcut, dialog, screen, net, session, ipcMain } = require('electron');

const CWD = app.getAppPath();

const appWindowsService = require('./service/app-windows/app-windows');
const assetProxy = require('./service/request/asset-proxy');
const fileService = require('./service/file/file-service');
const toastService = require('./service/toast/toast-main');
const rootDir = require('./service/file/root-dir');

const log4js = require('log4js');
log4js.configure({
    appenders: {
        log_file: {                                     // 将log输出到文件，未来可扩展输出到日期文件，按不同等级输出日志文件，当前仅将全部log已info形式输出到指定log文件中
            type: 'file',
            filename: path.join(rootDir.getLogDir(), 'group'),
            maxLogSize: 209714520
        }
    },
    categories:{
        default: { appenders: ['log_file'], level: 'info' },
    }
});
var logger = log4js.getLogger();

var configSource;
var bounds;
const global = {
    appId: '',
    sceneId: '',
    lessonId: '',
    interactionWebAPI: '',
    token: '',
    processId: '',
    logonName: '',
    figureConfigAPI: '',
    authorizationAPI: ''
};
const appInfo = {
    hostAddress: '192.168.41.87',
    hostProtocol: 'https'
};

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

function writeConfigSource(content) {
    var configDir;
    if (CWD.endsWith('.asar')) {
        configDir = CWD.replace(/[\w\-]+\.asar$/, '');
    } else {
        configDir = CWD;
    }
    var fpath = path.join(configDir, 'config.json');
    
    try {
        var content = fs.writeFileSync(fpath, JSON.stringify(content), { encoding: 'utf-8', flag: 'w' });
    } catch {
        logger.info("更新配置文件失败");
    }
}

/**
 * @description: 解析命令行参数
 * @param {String} argList 命令行参数
 * @return {Object} 命令行参数解析结果
 */
function parseArgument(argList) {
    let argInfo = {
        appId: '',
        sceneId: '',
        lessonId: '',
    }
    argList.forEach(arg => {
        logger.info(`arg is ${arg}`);
        if (arg.startsWith('-id:')) {
            argInfo.appId = arg.substring(4);
        } else if (arg.startsWith('-mode:')) {
            let decodeMode = urlencode.decode(arg);
            decodeMode = decodeMode.substring(6);
            let modeSplits = decodeMode.split('&');
            modeSplits.forEach(mode => {
                if (mode.startsWith('sceneid=')) {
                    argInfo.sceneId = mode.substring(8);
                } else if (mode.startsWith('lessonid=')) {
                    argInfo.lessonId = mode.substring(9);
                }
            });
        }
    });
    return argInfo
}

/**
 * @description: 环境初始化
 */
function init() {
    /**
     * @description: 读取配置信息
     */
    function getRouteTable(callback) {
        if (!configSource.routeTableUrl) {
            callback('找不到服务器,请重新注册设备');
        }
        let routeTableUrl = configSource.routeTableUrl;
        let urlInfo = new URL(routeTableUrl);
        let protocol = urlInfo.protocol.substring(0, urlInfo.protocol.length - 1);
        let address = urlInfo.host;
        appInfo.hostAddress = address;
        appInfo.hostProtocol = protocol;
        // 配置平台资源请求的代理
        assetProxy.configAssetProxy({
            protocol: appInfo.hostProtocol,
            serverAddress: appInfo.hostAddress
        });

        let request = net.request({
            method: 'get',
            url: routeTableUrl
        });
        request.on('response', response => {
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let configRoute = JSON.parse(data);
                    global.interactionWebAPI = configRoute['classroomteaching_interaction'];
                    global.figureConfigAPI = configRoute['figure_config'];
                    global.authorizationAPI = configRoute['classroomteaching_authorization'];
                    callback(null);
                });
            }
        });
        request.setHeader('Content-Type', 'application/json')
        request.end();  // 发送请求
    }

    function getLogonName(callback) {
        global.logonName = configSource.logonName;
        callback(null, global.logonName);
    }

    /**
     * @description: 登录小组屏账号，默认密码与账号相同
     * @param {string} 登录账号
     */
    function logon(logonName, callback) {
        let request = net.request({
            method: 'put',
            url: `${global.authorizationAPI}DeviceLogon`
        });
        request.on('response', response => {
            if (response.statusCode == 204) {
                let cookie = response.headers['set-cookie'][0];
                cookie.split(';').forEach(cookieValue=>{
                    if (cookieValue.startsWith('TOKEN=')) {
                        global.token = cookieValue.slice(6);
                        return;
                    }
                });
                // 为请求添加token
                let ses = session.defaultSession;
                ses.webRequest.onBeforeSendHeaders((details, callback) => {
                    details.requestHeaders['cookie'] = cookie;
                    callback({
                        requestHeaders: details.requestHeaders
                    });
                });
                callback(null);
            } else {
                let errorCodeMap = {
                    1000: '设备未注册'
                };
                response.on('data', data => {
                    let result = JSON.parse(data);
                    let message = errorCodeMap[result.Code] || '启动失败';
                    callback(message);
                });
            }
        });

        let data = JSON.stringify({
            LogonName: logonName,
            Password: logonName
        });
        request.setHeader('Content-Type', 'application/json')
        request.end(data, 'utf-8');  // 发送请求
    }

    async.waterfall([getRouteTable, getLogonName, logon], (err, result) => {
        if (err) {
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Error',
                message: err || '初始化失败'
            });
            app.quit();
            process.exit(2);
        } else {
            logger.info(`set app window config. sceneid = ${global.sceneId}`);
            logger.info(`set app window config. lessonid = ${global.lessonId}`);
            appWindowsService.init(bounds, {
                sceneId: global.sceneId,
                lessonId: global.lessonId,
                redirectAPI: global.figureConfigAPI
            });
            appWindowsService.showSidebar();
        }
    });
}

/**
 * @description: 全局toast回调
 * @param {String}        data
 * @param {WebContents?}  sender
 */
function onToastReaction(data, sender) {
    // body...
}

function main () {
    const gotTheLock = app.requestSingleInstanceLock();
    logger.info(`requestSingleInstanceLock is ${gotTheLock}`);
    if (!gotTheLock) {
        app.quit();
    }
    
    configSource = loadConfigSource();
    if (configSource.cachePath) {
        fs.mkdirSync(configSource.cachePath, {
            recursive: true
        });
        app.setPath('userData', configSource.cachePath);
    } else {
        configSource.cachePath = app.getPath('userData');
        writeConfigSource(configSource);
    }
    if(configSource.routeTableUrl){
        let myURL = new URL(configSource.routeTableUrl);
        app.commandLine.appendSwitch('ignore-connections-limit', myURL.host);  
    }
    app.on('ready', () => {
        if (!configSource) {
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Error',
                message: '读取配置文件失败'
            });
            process.exit(1);
        }

        // 创建应用窗口
        bounds = screen.getPrimaryDisplay().bounds;
        // 解析命令行参数
        let argInfo = parseArgument(process.argv);
        global.processId = process.pid;
        global.appId = argInfo.appId;
        global.sceneId = argInfo.sceneId;
        global.lessonId = argInfo.lessonId;
        // 初始化
        init();

        // 配置文件服务
        fileService.configFileServiceHandle(configSource.fileService);

        // 配置toast服务
        toastService.registerCallback(onToastReaction);

        if (configSource.debug) {
            globalShortcut.register('CmdOrCtrl+D', () => {
                appWindowsService.openFocusedWindowDevTools();
            });
            globalShortcut.register('CmdOrCtrl+Shift+R', () => {
                appWindowsService.reloadFocusedWindow();
            });

            globalShortcut.register('CmdOrCtrl+Q', () => {
                app.quit();
            });
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
            app.quit();
            process.exit(2);
        });
    });

    // 返回当前登录用户token
    ipcMain.handle('GetToken', (event) => {
        return new Promise((resolve, reject) => {
            resolve(global.token);
        });
    });

    var isShowErrorWindow = false;
    // 401未授权时，显示错误窗口
    ipcMain.on('Unauthorized', (event, id) => {
        if (isShowErrorWindow) {
            return;
        }
        appWindowsService.showWindow(id);
    });

    var isAuthorizing = false;
    ipcMain.on('Authorize', () => {
        if (isAuthorizing) {
            return;
        }
        isAuthorizing = true;
        let request = net.request({
            method: 'put',
            url: `${global.authorizationAPI}DeviceLogon`
        });
        request.on('response', response => {
            isAuthorizing = false;
            if (response.statusCode == 204) {
                // 为请求添加token
                let cookie = response.headers['set-cookie'][0];
                cookie.split(';').forEach(cookieValue=>{
                    if (cookieValue.startsWith('TOKEN=')) {
                        global.token = cookieValue.slice(6);
                        return;
                    }
                });
                let ses = session.defaultSession;
                ses.webRequest.onBeforeSendHeaders((details, callback) => {
                    details.requestHeaders['cookie'] = cookie;
                    callback({
                        requestHeaders: details.requestHeaders
                    });
                });
                isShowErrorWindow = false;
                appWindowsService.onlyShowSidebar();
            } else {
                throw new Error('启动失败');
            }
        });

        let data = JSON.stringify({
            LogonName: global.logonName,
            Password: global.logonName
        });
        request.setHeader('Content-Type', 'application/json')
        request.end(data, 'utf-8');  // 发送请求
    });
}

main();