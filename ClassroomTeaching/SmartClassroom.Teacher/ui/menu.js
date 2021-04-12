var ipcRenderer = require('electron').ipcRenderer;
(function ()
{
'use strict';

angular.module('Shell.ClassroomTeaching.SmartClassroom.Teacher.Menu', [  
    'Figure-Config-RouteTable',
    'LINDGE-Service'
])

.controller('MainCtrl', ['$scope', 'queryString', function ($scope, queryString) {
    // controller code here
    /*------------- 创建显示卡片 --------------*/
    function crateCard(config, extendParam = null) {
        return {
            code: config.Id,
            title: config.Name,
            icon: config.Icon,
            click: function () {
                ipcRenderer.send('ShowWindow', {
                    id: config.Entrance,
                    param: extendParam
                });
            }   
        };
    }

    // 关闭窗口
    $scope.close = function () {
        ipcRenderer.send('HideWindow', 'Menu');
    };

    $scope.cardInfos = [];
    function init() {
        ipcRenderer.invoke('GetAuthorizedModule').then(result => {
            if (result.length > 5) {
                result.slice(5, result.length).forEach(autorizedModule => {
                    $scope.cardInfos.push(crateCard(autorizedModule));
                });
                $scope.$apply();
            }
        });
    }
    init();
}]);

}());