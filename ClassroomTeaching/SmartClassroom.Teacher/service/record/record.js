const fs = require('fs');
const constants = require('constants');
const async = require('async');
const urlencode = require('urlencode');

const captureService = require('../screen-capture/screen-capture');

const { ipcMain, net } = require('electron');
const executeResult = {
    success: 'success',
    fail: 'fail',
    redo: 'redo'
};

var global = {
    recordRootUrl: '',
    uploadRootUrl: '',
    isNeedRecord: false
};

function executeQueue(recordInfo) {
    if (!recordInfo.lessonId){
        throw Error('lessonId is invalid');
    }
    if (!recordInfo.action) {
        throw Error('action is invalid');
    }
    
    let waterfall = [];
    let handle = '';     
    if (!recordInfo.handle && (global.isNeedRecord || recordInfo.isForceRecord) && recordInfo.picture) {
        function getRandomSeed(length) {
            if (length <= 0) {
                return '';
            }
            let randomSeed = '';
            for (var index = 0; index < length; index++) {
                randomSeed += Math.floor(Math.random() * 16).toString(16);
            }
            return randomSeed;
        }
        // 获取handle
        waterfall.push((callback) => {
            let request = net.request({
                method: 'put',
                url: `${global.uploadRootUrl}stream?encrypted=false&handle=&root=`
            });
            request.on('response', response => {
                if (response.statusCode == 200) {
                    response.on('data', data => {
                        handle = JSON.parse(data).Handle;
                        callback(null);
                    });
                } else {
                    callback('get handle fail');
                }
            });
            request.on('error', () => {
                callback('get handle fail');
            });
            request.end();
        });
        
        // 读取文件总大小
        let openFlags = constants.O_RDONLY | constants.O_SYNC;
        let fd;
        try {
            fd = fs.openSync(recordInfo.picture, openFlags);
        } catch {
            throw new Error('file not exist');
        }
        let totalSize = fs.fstatSync(fd).size;
        // 上传文件
        let blockSize = 1024 * 1024;
        let buffer = Buffer.alloc(blockSize);
        let totalBytes = 0;
        let stepBytes = 0;
        do {
            waterfall.push((callback) => {
                let bytesRead = fs.readSync(fd, buffer, 0, buffer.length, totalBytes);
                let data = Buffer.from(buffer.slice(0, bytesRead));
                let request = net.request({
                    method: 'post',
                    url: `${global.uploadRootUrl}upload?seed_=${getRandomSeed(4)}`
                });
                request.on('response', response => {
                    if (response.statusCode == 204) {
                        totalBytes += bytesRead;
                        callback(null);
                    } else {
                        callback('upload picture fail');
                    }
                });
                request.on('error', (err) => {
                    callback('upload picture fail');
                });
                request.setHeader('Content-Type', 'application/octet-stream');
                request.setHeader('handle', handle);
                request.end(data);
            });
            stepBytes += buffer.length;
        } while (stepBytes < totalSize);
        // 关闭handle
        waterfall.push((callback) => {
            let request = net.request({
                method: 'delete',
                url: `${global.uploadRootUrl}stream?handle=${urlencode.encode(handle)}`
            });
            request.on('response', response => {
                if (response.statusCode == 200) {
                    recordInfo.handle = handle;
                    callback(null);
                } else {
                    callback('close handle fail');
                }
            });
            request.on('error', () => {
                callback('close handle fail');
            });
            request.end();
        });
    }

    waterfall.push((callback) => {
        if (global.isNeedRecord || recordInfo.isForceRecord) {
            let request = net.request({
                method: 'put',
                url: `${global.recordRootUrl}LessonRecord/${recordInfo.lessonId}`
            });
            request.on('response', response => {
                if (response.statusCode == 204) {
                    callback(null);
                } else {
                    callback('add record fail');
                }
            });
            request.on('error', () => {
                callback('add record fail');
            });
    
            let param = {
                Action: recordInfo.action,
                Picture: recordInfo.handle,
                Content: recordInfo.content
            };
            request.setHeader('Content-Type', 'application/json');
            request.end(JSON.stringify(param), 'utf-8');
        } else {
            callback(null);
        }
    });

    let promise = new Promise((resolve, reject) => {
        async.waterfall(waterfall, (err) => {
            let result = executeResult.fail;
            if (err) {
                result = executeResult.redo;
            } else {
                result = executeResult.success;
            }
            resolve(result);
        });
    });
    return promise;
}

var queue = [];
var isWorking = false;

function startQueue() {
    if (isWorking || queue.length == 0)
        return;
    
    isWorking = true;
    let recordInfo = queue[0];
    recordInfo.redoLimit = typeof (recordInfo.redoLimit) === 'number' ? recordInfo.redoLimit : 3;
    executeQueue(recordInfo).then(result => {
        switch (result) {
            case executeResult.fail:
            case executeResult.success:
                queue.shift();
                break;
            case executeResult.redo:
                recordInfo.redoLimit--;
                if (recordInfo.redoLimit <= 0) {
                    queue.shift();
                }
                break;
        }
    }).finally(() => {
        isWorking = false;
        startQueue();
    });
}

ipcMain.handle('AddRecord', (event, arg) => {
    let picturePath = '';
    let promise;
    if (arg.needCapture) {
        promise = new Promise((resolve, reject) => {
            captureService.captureRecord().then(result => {
                picturePath = result.picturePath;
                resolve();
            }, err => {
                reject(`add record fail.${err}`, );
            });
        }).finally(() => {  
            arg.picture = picturePath;
            queue.push(arg);
            startQueue();
        });
    } else {
        promise = new Promise();
        queue.push(arg);
        startQueue();
    }
    
    return promise;
});

/**
 * @description: 初始化
 * @param {String} rootUrl.recordRootUrl 课堂报告url
 * @param {String} rootUrl.uploadRootUrl 上传文件Url
 * @param {String} isNeedRecord 是否需要记录
 */
function init(rootUrl, isNeedRecord = false) {
    if (!rootUrl.recordRootUrl) {
        throw new Error('record root url is invalid');
    }
    if (!rootUrl.uploadRootUrl) {
        throw new Error('upload root url is invalid');
    }
    global.recordRootUrl = rootUrl.recordRootUrl;
    global.uploadRootUrl = rootUrl.uploadRootUrl;
    global.isNeedRecord = isNeedRecord;
}

function setIsActive(isNeedRecord = false) {
    global.isNeedRecord = isNeedRecord;
}
module.exports.init = init;
module.exports.setIsActive = setIsActive;