(function ()
{
'use strict';

angular.module('Config.Tool', [
    'ngMaterial',
    'ngResource',
    'LINDGE-Service',
    'LINDGE-UI-Core',
    'LINDGE-UI-Standard',
    
    'Figure-Config-RouteTable'
])

.controller('MainCtrl', ['$scope', '$luiDialog', '$ngTableFactory', '$resource', function ($scope, $luiDialog, $ngTableFactory, $resource) {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const elementTree = require('elementtree');
    const { app } = require('electron').remote;
    const CWD = app.getAppPath();
    var myConfig = {};
    var accountName = '';
    var fpath = '';
    $scope.noRegisteredText = '未注册';
    $scope.localIP = [];
    $scope.registeredIP='';
    $scope.IsConnectedServer = false;
    $scope.serverIP='';
    $scope.inputServerIP = '';
    $scope.deviceRegisterInfo  = {Devices:[]};
    $scope.showNoScreen = false;
    $scope.selectedItem = null;
    
    var errorCodes = {
        '7001': '终端已注册',
        '7002': '终端未启用'
    };

    var table = $ngTableFactory.createTableService({
        pageSize: -1,
        dataLoadPolicy: $ngTableFactory.DATA_LOAD_POLICY.AUTO,
        dataProvider: function (params, success, fail) {
            success($scope.deviceRegisterInfo.Devices.length, $scope.deviceRegisterInfo.Devices);
        },
        dataSelectionPolicy: $ngTableFactory.SELECTION_POLICY.NONE,
        addDisplayIndex: true
    });
    $scope.table = table;

    function loadConfigSource () {
        var configDir;
        if (CWD.endsWith('.asar')) {
            configDir = CWD.replace(/[\w\-]+\.asar$/, '');
        } else {
            configDir = CWD;
        }
        fpath = path.join(configDir, 'config.json');
    
        try {
            let content = fs.readFileSync(fpath, { encoding: 'utf-8', flag: 'r+' });
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    function getIpAddress() {
        var ifaces=os.networkInterfaces();
        for (var dev in ifaces) {
          let iface = ifaces[dev];
      
          for (let i = 0; i < iface.length; i++) {
            let {family, address, internal} = iface[i];
            if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                $scope.localIP.push(address);
            }
          }
        }
    }

    function getDeviceConfig () {
        let url = 'http://'+$scope.serverIP+'/Translayer/ClassroomTeaching.Authorization/api/DeviceConfig';
        //let url = 'http://127.0.0.1:12314/Translayer/ClassroomTeaching.Authorization/api/DeviceConfig';
        var clientRes = $resource(url, null ,{
            get : { method: 'GET' },
            update: { method: "PUT" }
        });
        $scope.isLoading = true;
        clientRes.get(result => {
            result.Devices = result.Devices.filter(d => {
                return d.Type == 'TEACHER' && d.Enabled;
            });
            $scope.IsConnectedServer = true;
            if (result.IsRegisted) {
                if ($scope.registeredIP != result.RegistedInfo.RegistedIPAddress || !$scope.localIP.includes($scope.registeredIP) 
                || !result.Devices.some(d => d.Number == result.RegistedInfo.Number)) {
                    result.IsRegisted = false;
                    result.RegistedInfo = {};
                }
                result.Devices.forEach(d => {
                    if (result.RegistedInfo.Number == d.Number) {
                        $scope.registeredText = '已注册为' + d.Name;
                    }
                });
            }
            $scope.deviceRegisterInfo = result;
            if(result.Devices.length == 0){
                $scope.showNoScreen = true;
            }

            table.reload();
        }, err => {
            $luiDialog.alert('信息提示',"获取终端注册结果失败");
        })
        .$promise
        .finally(() => {
            $scope.isLoading = false;
        });
    }

    $scope.select = function (item) {
        if (!item.IsRegisted) {
            $scope.selectedItem = item;
        }
    };

    $scope.connectServer = function () {
        if ($scope.inputServerIP) {
            $scope.serverIP = $scope.inputServerIP;
            getDeviceConfig();
        } else {
            $luiDialog.alert('信息提示', '服务器IP不能为空');
        }
    };

    $scope.submit = function () {
        let url = 'http://'+$scope.serverIP+'/Translayer/ClassroomTeaching.Authorization/api/DeviceConfig';
        //let url = 'http://127.0.0.1:12314/Translayer/ClassroomTeaching.Authorization/api/DeviceConfig';
        var clientRes = $resource(url, null ,{
            get : { method: 'GET' },
            update: { method: "PUT" }
        });
        if ($scope.deviceRegisterInfo.RegistedInfo && $scope.deviceRegisterInfo.RegistedInfo.RegistedIPAddress) {
            if($scope.selectedItem) {
                $scope.isLoading = true;
                clientRes.update({
                    Number: $scope.selectedItem.Number,
                    RegistedIPAddress: $scope.deviceRegisterInfo.RegistedInfo.RegistedIPAddress
                }, result => {
                    $scope.selectedItem.IsRegisted = true;
                    accountName = result.AccountName;
                    $scope.deviceRegisterInfo.IsRegisted = true;
                    $scope.deviceRegisterInfo.RegistedInfo.Number = $scope.selectedItem.Number;
                    $scope.deviceRegisterInfo.Devices.forEach(d => {
                        if ($scope.deviceRegisterInfo.RegistedInfo.Number == d.Number) {
                            d.IsRegisted = true;
                            $scope.registeredText = '已注册为' + d.Name;
                        }
                    });
                    myConfig.ServerIP = $scope.serverIP;
                    myConfig.RegisteredIP = $scope.deviceRegisterInfo.RegistedInfo.RegistedIPAddress;
                    modifyMyConfig();
                    modifyClientConfig();
                    modifyScreenConfig();
                    modifyPhoneConfig();
                    $luiDialog.alert('信息提示', '修改成功,重启计算机后生效');
                }, err => {
                    $luiDialog.alert('信息提示', getErrorMessage(err.data.Code));
                })
                .$promise
                .finally(() => {
                    $scope.isLoading = false;
                });
            } else {
                $luiDialog.alert('信息提示', '请选择教师屏');
            }
        } else {
            $luiDialog.alert('信息提示', '本地IP不能为空');
        }
    };

    function directoryExists (fpath) {
        try {
            return fs.statSync(fpath).isDirectory();
        } catch {
            return false;
        }
    }

    function fileExists (fpath) {
        try {
            return fs.statSync(fpath).isFile();
        } catch {
            return false;
        }
    }

    function getErrorMessage (code) {
        code = String(code);
        var msg = errorCodes[code];
        return !!msg ? msg : '';
    }

    $scope.exit = function () {
        app.exit();
    };

    function modifyMyConfig() {
        let content = JSON.stringify(myConfig);
        fs.writeFileSync(fpath, content);
    }

    function modifyClientConfig() {
        let path = '../SmartClassroom.Teacher/resources/config.json';
        if (fileExists(path)) {
            let content = fs.readFileSync(path, { encoding: 'utf-8', flag: 'r+' });
            let jsonObject = JSON.parse(content);
            // 清除缓存文件夹
            if (directoryExists(jsonObject.cachePath)) {
                fs.rmdirSync(jsonObject.cachePath, { recursive: true});
            }
            jsonObject.logonName = accountName;
            jsonObject.routeTableUrl = 'http://' + $scope.serverIP + '/Translayer/Figure.Config/json/routetable';
            content = JSON.stringify(jsonObject);
            fs.writeFileSync(path, content);
        }
    }

    function modifyScreenConfig() {
        let path = '../../Services/Transceiver.Screen/App_Data/config.xml';
        if (fileExists(path)) {
            let content = fs.readFileSync(path, { encoding: 'utf-8', flag: 'r+' });
            let etree = elementTree.parse(content);
            let root = etree.getroot();
            let hostName = root.find('./Source/Hostname');
            hostName.text = accountName;
            let sourceType = root.find('./Source/SourceType');
            sourceType.text = 'SCREEN';
            let sourceCode = root.find('./Source/SourceCode');
            sourceCode.text = accountName;
            let groupTag = root.find('./Source/GroupTag');
            groupTag.text = accountName;
            let ipAddress = root.find('./Streaming/IPAddress');
            ipAddress.text = $scope.deviceRegisterInfo.RegistedInfo.RegistedIPAddress;
            let dataUrl = root.find('./Streaming/DataUrl');
            dataUrl.text = '/screen/' + accountName.toLowerCase();
            let channelServiceUri = root.find('./ChannelServiceUri');
            channelServiceUri.text = 'http://' + $scope.serverIP + ':8000/Generic/Media.ChannelMaster/api/';
            let xmlString = etree.write(path);
            fs.writeFileSync(path, xmlString);
        }
    }

    function modifyPhoneConfig() {
        let path = '../../Para5/Service/Transceiver.Phone/App_Data/config.xml';
        if (fileExists(path)) {
            let content = fs.readFileSync(path, { encoding: 'utf-8', flag: 'r+' });
            let etree = elementTree.parse(content);
            let root = etree.getroot();
            let ipAddress = root.find('./Source/IPAddress');
            ipAddress.text = $scope.deviceRegisterInfo.RegistedInfo.RegistedIPAddress;
            let upstreamAddress = root.find('./StreamRouter/UpstreamAddress');
            upstreamAddress.text = $scope.serverIP;
            let channelServiceUri = root.find('./ChannelServiceUri');
            channelServiceUri.text = 'http://' + $scope.serverIP + ':8000/Generic/Media.ChannelMaster/api/';
            let xmlString = etree.write(path);
            fs.writeFileSync(path, xmlString);
        }
    }

    function init() {
        getIpAddress();
        myConfig = loadConfigSource();
        $scope.serverIP = myConfig.ServerIP;
        $scope.registeredIP = myConfig.RegisteredIP;
        if ($scope.serverIP) {
            getDeviceConfig();
        }
    }

    init();
    
}]);

}());