(function ()
{
'use strict';

angular.module('Config.Tool', [
    'ngMaterial',
    'ngResource',
    'LINDGE-Service',
    'LINDGE-UI-Core',
    'LINDGE-UI-Standard',
    'Config.Tool.ModifyName',
    
    'Figure-Config-RouteTable'
])

.controller('MainCtrl', ['$scope', '$luiDialog', '$SDK', '$ngTableFactory', '$luiModal', '$resource', 
        function ($scope, $luiDialog, $SDK, $ngTableFactory, $luiModal, $resource) {
    const os = require('os');
    const { dialog, app } = require('electron').remote;
    var initServerIPAddress = '';
    var initServerConfig = {};
    var url = 'http://127.0.0.1/Translayer/ClassroomTeaching.Authorization/api/ServerConfig';
    $scope.serverConfig = {
        Devices:[]
    };
    $scope.serverIPAddress = [];
    $scope.showNoScreen = false;

    var serverRes = $resource(url, null ,{
        get : { method: 'GET' },
        updateServerConfig: { method: "PUT" }
    });

    var table = $ngTableFactory.createTableService({
        pageSize: -1,
        dataLoadPolicy: $ngTableFactory.DATA_LOAD_POLICY.AUTO,
        dataProvider: function (params, success, fail) {
            success($scope.serverConfig.Devices.length, $scope.serverConfig.Devices);
        },
        dataSelectionPolicy: $ngTableFactory.SELECTION_POLICY.NONE,
        addDisplayIndex: true
    });
    $scope.table = table;

    function getIpAddress() {
        var ifaces=os.networkInterfaces();
        for (var dev in ifaces) {
          let iface = ifaces[dev];
      
          for (let i = 0; i < iface.length; i++) {
            let {family, address, internal} = iface[i];
            if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                $scope.serverIPAddress.push(address);
            }
          }
        }
    }

    $scope.exit = function () {
        app.exit();
    };

    $scope.modifyName = function(row) {
        return $luiModal.open({
            controller: 'ModifyNameCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'popups/modify-name.html',
            cssClass: 'lui-dialog',
            disableParentScroll: true,
            clickOutsideToClose: false,
            layoutFeatures: $luiModal.$layout.SCREENCENTER,
            containerFixed: false,
            locals: { sourceName: row.Name}
        }).result.then(function(name) {
            row.Name = name;
        });
    };

    function getServerConfig () {
        $scope.isLoading = true;
        serverRes.get(
            result => {
                initServerIPAddress = result.ServerIPAddress;
                $scope.serverConfig = result;
                initServerConfig.ServerIPAddress = result.ServerIPAddress;
                initServerConfig.LicenseFileName = result.LicenseFileName;
                initServerConfig.WifiSSID = result.WifiSSID;
                initServerConfig.WifiPassword = result.WifiPassword;
                initServerConfig.Devices = result.Devices.map(d => {
                    return {
                        Number: d.Number,
                        Type: d.Type,
                        Name: d.Name,
                        IsRegisted: d.IsRegisted,
                        RegistedIPAddress: d.RegistedIPAddress,
                        Enabled: d.Enabled
                    }
            });
            if(result.Devices.length == 0){
                $scope.showNoScreen = true;
            }

            table.reload();
        }, err => {
            $scope.requestFail = true;
            $luiDialog.alert('信息提示', '获取服务端配置失败');
        })
        .$promise
        .finally(() => {
            $scope.isLoading = false;
        });
    }

    $scope.submit = function () {
        var compareServerConfig = {};
        compareServerConfig.ServerIPAddress = $scope.serverConfig.ServerIPAddress;
        compareServerConfig.LicenseFileName = $scope.serverConfig.LicenseFileName;
        compareServerConfig.WifiSSID = $scope.serverConfig.WifiSSID;
        compareServerConfig.WifiPassword = $scope.serverConfig.WifiPassword;
        compareServerConfig.Devices = $scope.serverConfig.Devices.map(d => {
            return {
                Number: d.Number,
                Type: d.Type,
                Name: d.Name,
                IsRegisted: d.IsRegisted,
                RegistedIPAddress: d.RegistedIPAddress,
                Enabled: d.Enabled
            }
        });
        var modifyServerConfig = $SDK.Lang.diffObject(initServerConfig, compareServerConfig);
        if (modifyServerConfig != null) {
            let deviceModifyParams = [];
            if (modifyServerConfig.Devices && modifyServerConfig.Devices.length > 0) {
                deviceModifyParams = modifyServerConfig.Devices.filter(d => initServerConfig.Devices.find(s => s.Number == d.Number).Name != d.Name ||
                initServerConfig.Devices.find(s => s.Number == d.Number).Enabled != d.Enabled);
            }
            $scope.isLoading = true;
            serverRes.updateServerConfig({
                LicenseFilePath: modifyServerConfig.LicenseFileName,
                ServerIPAddress: modifyServerConfig.ServerIPAddress,
                WifiSSID: modifyServerConfig.WifiSSID,
                WifiPassword: modifyServerConfig.WifiPassword,
                DeviceModifyParams: deviceModifyParams
            }, result => {
                if (initServerIPAddress == $scope.serverConfig.ServerIPAddress) {
                    $luiDialog.alert('信息提示', '修改成功');
                } else {
                    $luiDialog.alert('信息提示', '修改成功,请稍后重启电脑');
                }
                $scope.serverConfig.Devices.forEach(d => {
                    if (deviceModifyParams.some(m => m.Number == d.Number) && !deviceModifyParams.find(m => m.Number == d.Number).Enabled) {
                        d.IsRegisted = false;
                    }
                });
                initServerConfig.ServerIPAddress = $scope.serverConfig.ServerIPAddress;
                initServerConfig.LicenseFileName = $scope.serverConfig.LicenseFileName;
                initServerConfig.WifiSSID = $scope.serverConfig.WifiSSID;
                initServerConfig.WifiPassword = $scope.serverConfig.WifiPassword;
                initServerConfig.Devices = $scope.serverConfig.Devices.map(d => {
                    return {
                        Number: d.Number,
                        Type: d.Type,
                        Name: d.Name,
                        IsRegisted: d.IsRegisted,
                        RegistedIPAddress: d.RegistedIPAddress,
                        Enabled: d.Enabled
                    }});
            }, err => {
                $luiDialog.alert('信息提示', '修改服务端配置失败');
            })
            .$promise
            .finally(() => {
                $scope.isLoading = false;
            });
        } else {
            $luiDialog.alert('信息提示', '您没有任何改动');
        }
    };

    $scope.browseFile = function () {
        dialog.showOpenDialog({
            title: "请选择许可证文件"
        }).then(result => {
            if (!result.canceled) {
                $scope.serverConfig.LicenseFileName = result.filePaths[0];
                $scope.$apply();
            }
        });
    };

    function init() {
        getIpAddress();
        getServerConfig();
    }

    init();
    
}]);

}());