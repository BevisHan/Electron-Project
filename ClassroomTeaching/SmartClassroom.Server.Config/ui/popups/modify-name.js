(function ()
{

'use strict';

angular.module('Config.Tool.ModifyName', [
    'ngMaterial',
    'LINDGE-Service',
    'LINDGE-UI-Core',
    'LINDGE-UI-Standard'
])


.controller('ModifyNameCtrl', ['$scope', 'mdPanelRef',
function ($scope, panelRef) { 
    $scope.name = panelRef.config.locals.sourceName;

    $scope.cancel = function () {
        panelRef.$cancel();
    };

    $scope.confirm = function () {
        panelRef.$resolve($scope.name);
    };

}]);

}());