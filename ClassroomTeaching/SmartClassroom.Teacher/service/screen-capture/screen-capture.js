const path = require('path');
const uuid = require('uuid');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

const { app, ipcMain } = require('electron');

const rootDir = require('../file/root-dir');

const toolPath = path.join(path.dirname(app.getPath('exe')), 'tool', 'screen-capture', 'ScreenCaptureTool.exe');
var markCaptureArea = {
    top: 0,
    left: 0,
    width: 1980,
    height: 1080
};
var recordCaptureArea = {
    top: 0,
    left: 0,
    width: 1980,
    height: 1080
};
/**
 * @description: 屏幕捕获初始配置
 * @param {Int} markConfig.top
 * @param {Int} markConfig.left
 * @param {Int} markConfig.width
 * @param {Int} markConfig.height
 * @param {object} recordConfig 同markConfig
 */
function init(markConfig, recordConfig) {
    markCaptureArea = markConfig;
    recordCaptureArea = recordConfig;
}

function captureScreen(path, captureArea) {
    let promise = new Promise((resolve, reject) => {
        execFile(toolPath, ['-b', `[${captureArea.left}, ${captureArea.top}, ${captureArea.width}, ${captureArea.height}]`, '-o', path])
            .then(result => {
                resolve({
                    picturePath: result.stdout.substr(0, result.stdout.length - 2)
                });
            }, err => {
                reject(err);
            });
    });
    return promise;
}

ipcMain.handle('CaptureMark', (event) => {
    let exportDir = path.join(rootDir.get(), 'Mark');
    let picturePath = path.join(exportDir, uuid.v1());
    let promise = captureScreen(picturePath, markCaptureArea);
    return promise;
});

function captureRecord(){
    let exportDir = path.join(rootDir.get(), 'Record');
    // 截取当前屏幕图片文件，作为参数传给标注页面
    let picturePath = path.join(exportDir, uuid.v1());
    let promise = captureScreen(picturePath, recordCaptureArea);
    return promise;
}

module.exports.init = init;
module.exports.captureRecord = captureRecord;