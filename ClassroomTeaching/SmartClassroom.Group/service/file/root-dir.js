const path = require('path');
const os = require('os');
const fs = require('fs');
const { app } = require('electron');
const CWD = app.getAppPath();

var root = '';

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

function createDir(dir) {
    let isExist = false;
    try {
        isExist = fs.statSync(dir).isDirectory();
    } catch {
        return false;
    }
    if (!isExist) {
        fs.mkdir(dir);
    }
}

var configContent = loadConfigSource();

/**
 * @description: 设置存储文件根目录
 * @param {String} lessonId 每节课课时标识
 */
function set(lessonId){
    root = path.join(configContent.cachePath, 'LINDGE', 'ClassroomTeaching', lessonId);
    createDir(root);
}

/**
 * @description: 获取根目录
 * @return {String} 根目录地址
 */
function get() {
    return root;
}

var logDir = path.join(configContent.cachePath, 'LINDGE', 'ClassroomTeaching', 'logs');
/**
 * @description: 获取log目录地址
 * @return {String} log目录地址
 */
function getLogDir(){
    createDir(logDir);
    return logDir;
}

module.exports.set = set;
module.exports.get = get;
module.exports.getLogDir = getLogDir;