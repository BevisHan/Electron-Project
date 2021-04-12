const fs = require('fs');
const { shell, net } = require('electron');
var tasks = {};
var openState = {};

function addPromise(id, promise) {
    tasks[id].promise = promise;
}

function addProgress(id, progress) {
    tasks[id].progress += progress;
}

function addState(id, state) {
    tasks[id] = {
        state: state,
        progress: 0,
        promise: null
    };
}

function removeTask(id) {
    delete tasks[id];
}

function fileExists (fpath) {
    try {
        return fs.statSync(fpath).isFile();
    } catch {
        return false;
    }
}

function directoryExists (fpath) {
    try {
        return fs.statSync(fpath).isDirectory();
    } catch {
        return false;
    }
}

function getDownloadState(ids){
    var task = {};
    for(var item in tasks) {
        if(ids.includes(item)) {
            task[item] = {
                state: tasks[item].state,
                progress: tasks[item].progress
            };
        }
    }
    return task;
}

function downloadFile(options) {
    if (!directoryExists(options.path)){
        fs.mkdirSync(options.path, { recursive: true });
    }
    let taskInfo = tasks[options.id];
    let completed = false;
    if (taskInfo && taskInfo.state == 'DOWNLOADING') {
        return taskInfo.promise;
    } else {
        if (fileExists(options.localPath)) {
            addState(options.id, 'DOWNLOADED');
            if(!openState[options.id] && options.isAutoOpen){
                openState[options.id] = true;
                shell.openPath(options.localPath).then(err => {
                    if(err){
                        shell.openPath(options.path)
                    }
                });
                openState[options.id] = false;
            }
            return new Promise((resolve, reject) => {
                resolve();
            });
        } else {
            var promise = new Promise((resolve, reject) => {
                var req = net.request(options.url);
                addState(options.id, 'DOWNLOADING');

                req.on('response', rsp => {
                    var writeStream = fs.createWriteStream(options.localPath);
                    writeStream.on('finish', evt => {
                        completed = true;
                    });
                    writeStream.on('close', evt => {
                        if(completed){
                            addState(options.id, 'DOWNLOADED');
                            if(!openState[options.id] && options.isAutoOpen){
                                openState[options.id] = true;
                                shell.openPath(options.localPath).then(err => {
                                    if(err){
                                        shell.openPath(options.path)
                                    }
                                });
                                openState[options.id] = false;
                            }
                            resolve();
                        }
                    });

                    rsp.on('data', data => {
                        addProgress(options.id, data.length);
                    });

                    writeStream.on('error', err => {
                        fs.unlinkSync(options.localPath);
                        removeTask(options.id);
                        reject(err);
                    });

                    rsp.pipe(writeStream);
                });
        
                req.on('error', err => {
                    fs.unlinkSync(options.localPath);
                    removeTask(options.id);
                    reject(err);
                });

                req.end();
            });
            addPromise(options.id, promise);
            return promise;
        }
    }
}

module.exports.downloadFile = downloadFile;
module.exports.getDownloadState = getDownloadState;