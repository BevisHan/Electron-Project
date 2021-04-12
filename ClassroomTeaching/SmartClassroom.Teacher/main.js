const path = require('path');
const fs = require('fs');
const os = require('os');
const async = require('async');

const { app, BrowserWindow, globalShortcut, Menu, dialog, screen, ipcMain, net, session } = require('electron');

const assetProxy = require('./service/request/asset-proxy');
const fileService = require('./service/file/file-service');
const toastService = require('./service/toast/toast-main');
const rootDir = require('./service/file/root-dir');
const recordService = require('./service/record/record');
const appWindowService = require('./service/app-window/app-window')

const log4js = require('log4js');
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

const appInfo = {
    hostAddress: '192.168.41.87',
    hostProtocol: 'https'
};

var bounds = null;
// 配置文件定义
var configSource;
// 全局变量
var global = {
    sceneId: '',
    lessonId: '',
    authorizationAPI: '',
    interactionAPI: '',
    casualStream: '',
    token: '',
    logonName: '',
    figureConfigAPI: '',
    lessonReportAPI: '',
    isActive: false
};

var authorizedModules = [];

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

// 环境初始化
function init() {
    let getRouteTable = function (callback) {
        if (!configSource.routeTableUrl) {
            callback('找不到服务器,请重新注册设备');
        }
        let routeTableUrl = configSource.routeTableUrl;
        let urlInfo = new URL(routeTableUrl);
        let protocol = urlInfo.protocol.substring(0, urlInfo.protocol.length - 1);;
        let address = urlInfo.host;
        appInfo.hostAddress = address;
        appInfo.hostProtocol = protocol
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
            logger.info(`get config statusCode: ${response.statusCode}`);
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let routeTable = JSON.parse(data);
                    logger.info(`get config result: ${JSON.stringify(routeTable)}`);
                    global.interactionAPI = routeTable['classroomteaching_interaction'];
                    global.casualStream = routeTable['bank_casualstream'];
                    global.figureConfigAPI = routeTable['figure_config'];
                    global.lessonReportAPI = routeTable['classroomteaching_lessonreport'];
                    global.authorizationAPI = routeTable['classroomteaching_authorization'];
                    callback(null);
                });
            }
        });
        request.setHeader('Content-Type', 'application/json')
        request.end();  // 发送请求
    };

    function checkLicense(callback) {
        let request = net.request({
            method: 'get',
            url: `${global.authorizationAPI}License`
        });
        request.on('response', response => {
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let result = JSON.parse(data);
                    if (result.IsSuccess) {
                        callback(null);
                    } else {
                        callback(result.Error);
                    }
                });
            } else {
                callback('校验许可证失败');
            }
        });
        request.setHeader('Content-Type', 'application/json')
        request.end();  // 发送请求
    }

    function getAuthorizedModules(callback) {
        let request = net.request({
            method: 'get',
            url: `${global.authorizationAPI}AuthorizedModule`
        });
        request.on('response', response => {
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let result = JSON.parse(data);
                    authorizedModules = result.sort((v1, v2) => v1.Index - v2.Index);
                    callback(null);
                });
            } else {
                callback('获取授权模块失败');
            }
        });
        request.setHeader('Content-Type', 'application/json')
        request.end();  // 发送请求
    }

    let getLogonName = function (callback) {
        global.logonName = configSource.logonName;
        callback(null, global.logonName);
    }

    let logon = function (logonName, callback) {
        // 登录教师机
        let request = net.request({
            method: 'put',
            url: `${global.authorizationAPI}DeviceLogon`
        });
        request.on('response', response => {
            if (response.statusCode == 204) {
                // 设置拦截所有请求，为所有请求上添加登录成功得到的token
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
    };

    // 查询课时信息
    let queryScene = function (callback) {
        // 查询场景
        let request = net.request({
            method: 'get',
            url: `${global.interactionAPI}TeachingLesson`
        });
        request.on('response', response => {
            logger.info(`query scene status code is ${response.statusCode}`);
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let sceneInfo = JSON.parse(data);
                    callback(null, sceneInfo);
                });
            } else {
                throw new Error('查询教学场景失败');
            }
        });
        request.setHeader('Content-Type', 'application/json');
        request.end();  // 发送请求
    }

    let initScene = function (sceneInfo, callback) {
        let teachingLessonUrl = `${global.interactionAPI}TeachingLesson`
        if (sceneInfo.HasScene) {
            global.sceneId = sceneInfo.SceneId;
            global.lessonId = sceneInfo.LessonId;
            if (sceneInfo.IsActive) {
                dialog.showMessageBox({
                    type: 'info',
                    buttons: ['放弃', '继续'],
                    title: '提示信息',
                    message: '当前有正在上课的场景，是否要继续上课'
                }).then(reuslt => {
                    if (reuslt.response == 0) {
                        // 取消当前课程
                        let cancleRequest = net.request({
                            method: 'delete',
                            url: `${teachingLessonUrl}/${global.lessonId}`
                        });
                        cancleRequest.on('response', cancelResopnse => {
                            if (cancelResopnse.statusCode == 204) {
                                global.isActive = false;
                                callback(null);
                            } else {
                                throw new Error('结束未完成课程失败');
                            }
                        })
                        cancleRequest.setHeader('Content-Type', 'application/json');
                        cancleRequest.end();
                    } else {
                        global.isActive = true;
                        callback(null);
                    }
                });
            } else {        
                global.isActive = false;
                callback(null);
            }
        } else {
            // 创建新场景
            let createRequest = net.request({
                method: 'put',
                url: teachingLessonUrl
            });
            createRequest.on('response', createResopnse => {
                if (createResopnse.statusCode == 200) {
                    createResopnse.on('data', data => {
                        let sceneInfo = JSON.parse(data);
                        global.sceneId = sceneInfo.SceneId;
                        global.lessonId = sceneInfo.LessonId;
                        global.isActive = false;
                        callback(null);
                    });
                } else {
                    throw new Error('创建场景失败');
                }
            })
            createRequest.setHeader('Content-Type', 'application/json');
            createRequest.end();
        }
    }

    async.waterfall([getRouteTable, checkLicense, getAuthorizedModules, getLogonName, logon, queryScene, initScene], function (err, result) {
        if (err) {
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Error',
                message: err || '初始化失败'
            });
            app.quit();
            process.exit(2);
        } else {            
            appWindowService.init({
                height: bounds.height,
                width: bounds.width
            }, {
                sceneId: global.sceneId,
                lessonId: global.lessonId,
                redirectAPI: global.figureConfigAPI
            });

            rootDir.set(global.lessonId);

            recordService.init({
                recordRootUrl: global.lessonReportAPI,
                uploadRootUrl: global.casualStream
            }, global.isActive);
            appWindowService.showSidebar();
        }
    });
}

/**
 * 全局toast回调
 *
 * @param {String}        data
 * @param {WebContents?}  sender
 */
function onToastReaction(data, sender) {
    // body...
}

function main () {
    const gotTheLock = app.requestSingleInstanceLock();
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
        // 获取屏幕大小
        bounds = screen.getPrimaryDisplay().bounds;
        // 环境初始化，包含：教师登录，获取当前课时,启动侧边栏
        logger.info('start init');
        init();

        // 配置文件服务
        fileService.configFileServiceHandle(configSource.fileService);

        // 配置toast服务
        toastService.registerCallback(onToastReaction);

        if (configSource.debug) {
            globalShortcut.register('CmdOrCtrl+D', () => {
                appWindowService.openFocusedWindowDevTools();           
            });

            globalShortcut.register('CmdOrCtrl+Shift+R', () => {
                appWindowService.reloadFocusedWindow();
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
        toastService.disposeToasts();
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

    /*------------------ 进程交互接口 -----------------------*/
    function changeLesson() {
        // 查询课时
        let request = net.request({
            method: 'get',
            url: `${global.interactionAPI}TeachingLesson`
        });
        request.on('response', response => {
            if (response.statusCode == 200) {
                response.on('data', data => {
                    let sceneInfo = JSON.parse(data);
                    global.sceneId = sceneInfo.SceneId;
                    global.lessonId = sceneInfo.LessonId;
                    global.isActive = sceneInfo.IsActive;
                    recordService.setIsActive(global.isActive);
                    appWindowService.lessonChange(global.lessonId);
                    rootDir.set(global.lessonId);
                });
            } else {
                throw new Error('query lesson fail');
            }
        });
        request.setHeader('Content-Type', 'application/json');
        request.end();  // 发送请求
    }
    // 上课
    ipcMain.on('BeginLesson',(event) => {
        // 取消当前课程活动
        let cancleRequest = net.request({
            method: 'delete',
            url: `${global.interactionAPI}TeachingLesson/${global.lessonId}`
        });
        cancleRequest.on('response', cancelResopnse => {
            if (cancelResopnse.statusCode != 204) {
                throw new Error('结束未完成课程失败');
            }
        })
        cancleRequest.setHeader('Content-Type', 'application/json');
        cancleRequest.end();
        // 更新课时
        changeLesson();
    });
    // 下课
    ipcMain.on('EndLesson', (event) => {
        changeLesson();
    });
    // 返回当前登录用户token
    ipcMain.handle('GetToken', (event) => {
        return new Promise((resolve, reject) => {
            resolve(global.token);
        });
    });
    // 401未授权时，显示错误窗口
    var isShowErrorWindow = false;
    ipcMain.on('Unauthorized', (event, id) => {
        if (isShowErrorWindow) {
            return;
        }
        appWindowService.showWindow(id);
    });
    var isAuthorizing = false;
    ipcMain.on('Authorize', () => {
        if (isAuthorizing) {
            return;
        }
        isAuthorizing = true;
        // 登录教师机
        let request = net.request({
            method: 'put',
            url: `${global.authorizationAPI}DeviceLogon`
        });
        request.on('response', response => {
            isAuthorizing = false;
            if (response.statusCode == 204) {
                // 设置拦截所有请求，为所有请求上添加登录成功得到的token
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
                appWindowService.onlyShowSidebar();
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

    ipcMain.handle('GetAuthorizedModule', () => {
        return new Promise((resolve, reject) => {
            resolve(authorizedModules);
        })
    });
}

main();
