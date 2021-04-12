const { ipcMain } = require('electron');

const diskinfo = require('./diskinfo');
const download = require('./file-download');
const path = require('path');
const rootDir = require('./root-dir');


function configFileService(fileConfig) {
    ipcMain.handle('get-diskinfo', evt => {
        return new Promise((resolve, reject) => {
            diskinfo.getDrivers((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    ipcMain.handle('download-file', (evt, options) => {
        var downloadOptions = {
            id: options.id,
            url: options.url,
            localPath: path.join(rootDir.get(), 'MaterialDisplay', options.id + options.extension),
            path: path.join(rootDir.get(), 'MaterialDisplay')
        };
        return download.downloadFile(downloadOptions);
    });

    ipcMain.handle('download-message-file', (evt, options) => {
        var downloadOptions = {
            id: options.id,
            url: options.url,
            localPath: path.join(rootDir.get(), 'MessageDisplay', options.id + options.extension),
            path: path.join(rootDir.get(), 'MessageDisplay')
        };
        return download.downloadFile(downloadOptions);
    });

    ipcMain.handle('query-downloadinfo', (evt, options) => {
        return download.getDownloadState(options);
    });
}

module.exports.configFileServiceHandle = configFileService;