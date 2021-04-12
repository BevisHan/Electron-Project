var exec = require('child_process').exec;
var os = require('os');

var platform = os.platform().toLowerCase();

function getKeyValue(notation) {
    var parts = notation.split('=');
    for (var i = 0; i < parts.length; i++) {
        parts[i] = parts[i].trim();
    }

    return parts;
}

function createDriverInfo() {
    return {
        filesystem: '',         // 磁盘描述信息
        blocks: 0,              // 磁盘空间总大小
        used: 0,                // 磁盘已使用空间大小
        available: 0,           // 磁盘可用空间大小
        capacity: 0,            // 磁盘可使用空间比率(0~1)
        mounted: '',            // 磁盘分区，即根路径
        serialNumber: ''        // 磁盘序列号
    };
}

function getDiskInfoWin32(callback) {
    function output2DriverInfo(output) {
        var driverInfo = createDriverInfo();
        driverInfo.filesystem = output['Description'];
        driverInfo.mounted = output['Caption'];
        driverInfo.serialNumber = output['VolumeSerialNumber'];

        var size = parseInt(output['Size']);
        var free = parseInt(output['FreeSpace']);
        var used = size - free;
        var percent = used / size;

        driverInfo.blocks = size;
        driverInfo.used = used;
        driverInfo.available = free;
        driverInfo.capacity = percent;

        return driverInfo;
    }

    var command = 'wmic logicaldisk get Caption,FreeSpace,Size,VolumeSerialNumber,Description  /format:list';
    exec(command, (err, stdout, stderr) => {
        if (err) {
            callback(err, null);
            return;
        }

        var outputLines = stdout.split('\r\r\n');

        var drivers = [];
        var newOutput = null;

        for (let line of outputLines) {
            line = line.trim();
            if (!!line) {
                if (newOutput === null) {
                    newOutput = {};
                }

                let [key, value] = getKeyValue(line);
                newOutput[key] = value;
            } else {
                if (newOutput) {
                    drivers.push(output2DriverInfo(newOutput));
                    newOutput = null;
                }
            }
        }

        callback(null, drivers);
    });
}

function getDrivers(callback) {
    if (!callback) {
        throw new Error('callback is null');
    }

    if (typeof callback != 'function') {
        throw new TypeError('callback must be function');
    }

    switch (platform) {
        case 'win32':
            getDiskInfoWin32(callback);
            break;
        default:
            throw new Error(`current platform is not supported: ${platform}`);
    }
}

module.exports.getDrivers = getDrivers;