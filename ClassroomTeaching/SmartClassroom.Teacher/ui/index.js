const ipcRenderer = require('electron').ipcRenderer;
(function ()
{
'use strict';

angular.module('Shell.ClassroomTeaching.SmartClassroom.Teacher', [
    'ngResource',    
    'Figure-Config-RouteTable',
    'LINDGE-Service',
    'Shell.ClassroomTeaching.SmartClassroom.DateTimeFormat'
])

.service('lessonService', ['$resource', 'path', 'routeTable', function ($resource, path, routeTable) {
    var serviceRoot = routeTable['classroomteaching_interaction'];
    var lessonActivityRes = $resource(path.combine(serviceRoot, 'LessonActivity/:id'), { id: '@id' });
    this.getLessonActivity = lessonActivityRes.get.bind(lessonActivityRes);
}])

.service('markService', ['$resource', 'path', 'routeTable', function ($resource, path, routeTable) {
    var serviceRoot = routeTable['classroomteaching_interaction'];

    var markRes = $resource(path.combine(serviceRoot, 'Mark/:id'), { id: '@id' }, {
        start: { method: 'PUT' },
        stop: { method: 'DELETE' }
    });
    this.start = markRes.start.bind(markRes);
    this.stop = markRes.stop.bind(markRes);
}])

.controller('MainCtrl', ['$scope', '$log', '$interval', 'queryString', 'dateTime', 'lessonService', 'markService',
function ($scope, $log, $interval, queryString, dateTime, lessonService, markService) {
    // controller code here
    $scope.isLoading = false;
    $scope.isFold = false;

    var lessonId = queryString.get('lessonid');
    var behaviorId;
    var tabArray;

    $scope.currentTab = null;
    /*------------------------ 创建侧边栏tab ---------------------------*/
    function setSelectedTab(id = null) {
        $scope.prepareTabs.forEach(tab => {
            if (id && tab.code == id) {
                tab.isSelected = true;
            } else {
                tab.isSelected = false;
            }
        });
        $scope.activityTabs.forEach(tab => {
            if (id && tab.code == id) {
                tab.isSelected = true;
            } else {
                tab.isSelected = false;
            }
        });
    }

    function setCurrentTab(id) {
        $scope.currentTab = id;
        setSelectedTab(id);
    }

    function clearCurrentTab(id) {
        $scope.currentTab = id == $scope.currentTab ? null : $scope.currentTab;
        setSelectedTab($scope.currentTab);
    }

    function createTab(code, title, icon) {
        return {
            code: code,
            title: title,
            icon: icon,
            isExecuting: false,
            isSelected: false,
            click: function () { }
        };
    }
    
    function getActivity() {
        lessonService.getLessonActivity({
            id: lessonId
        }, result => {
            let codes = [];
            if (result.IsGroupDiscussing) {
                codes.push('group_discuss');
            }
            if (result.IsInteracting) {
                codes.push('interaction');
            }
            if (result.IsMarking) {
                codes.push('mark');
            }
            if (result.IsScreening) {
                codes.push('screen');
            }
            if (result.IsTeaching) {
                codes.push('power');
            }
            if (result.IsGrouping) {
                codes.push('menu');
            }
            
            $scope.prepareTabs.forEach(tab => {
                if (codes.includes(tab.code)) {
                    tab.isExecuting = true;
                } else {
                    tab.isExecuting = false;
                }
            });
            $scope.activityTabs.forEach(tab => {
                if (codes.includes(tab.code)) {
                    tab.isExecuting = true;
                } else {
                    tab.isExecuting = false;
                }
            });
        });
    }

    function endMark(callback) {
        if (behaviorId) {
            ipcRenderer.invoke('AddRecord', {
                lessonId: lessonId,
                action: 'STOP_MARK',
                content: '教师板书',
                needCapture: true
            }).finally(() => {
                markService.stop({
                    id: behaviorId
                }, () => {
                    behaviorId = '';
                    callback();
                }, err => {
                    $log.error(err);
                });
            });
        } else {
            callback();
        }
    }

    function showWindow(entrance, extendParam) {
        ipcRenderer.send('ShowWindow', {
            id: entrance,
            param: extendParam
        });
    }

    function createSidebarTab(config, extendParam = null) {
        let tab = createTab(config.Id, config.Name, config.Icon);
        tab.click = function (isForceReload = false) {            
            if ($scope.currentTab == this.code && !isForceReload) {
                return ;
            }
            endMark(() => {
                setCurrentTab(this.code);
                getActivity();
                showWindow(config.Entrance, extendParam);
            });
        };
        return tab;
    }
    $scope.prepareTabs = [
        createSidebarTab({ Id: 'power', Name: '启动', Icon: 'lic-power', Entrance: 'ClassroomTeaching.Portal' }),
        createSidebarTab({ Id: 'student', Name: '学生列表', Icon: 'lic-group-two', Entrance: 'ClassroomTeaching.Students.Detail' }, { relationtype: 'student' })
    ];

    function createMarkTab(config) {
        let markTab = createTab(config.Id, config.Name, config.Icon);
        markTab.click = function (isForceReload = false) {
            if ($scope.currentTab == this.code && !isForceReload) {
                return ;
            }
            let promise = ipcRenderer.invoke('CaptureMark');
            promise.then(captureResult => {
                markService.start({
                    id: lessonId
                }, result => {
                    behaviorId = result.BehaviorId;
                    setCurrentTab(this.code);
                    getActivity();
                    let extendParam = {
                        actionid: behaviorId,
                        image: captureResult.picturePath
                    };
                    if (isForceReload) {
                        showWindow(config.Entrance, extendParam);  
                    } else {
                        ipcRenderer.invoke('AddRecord', {
                            lessonId: lessonId,
                            action: 'START_MARK',
                            content: '教师板书',
                            needCapture: true
                        }).finally(() => {
                            showWindow(config.Entrance, extendParam);    
                        });
                    }
                                   
                }, err => {
                    $log.error(err);
                });
            }, err => {
                $log.error(err);
            });
        };
        return markTab;
    }
    function createMenuTab() {
        let menu = createTab('menu', '更多操做', 'lic-ellipsis');
        menu.click = function () {
            endMark(() => {
                setCurrentTab(this.code);
                getActivity();
                showWindow('Menu');
            });
        };
        return menu;
    }

    $scope.activityTabs = [];
    function init() {
        ipcRenderer.invoke('GetAuthorizedModule').then(result => {
            function convertTab(authorizedModule) {
                let tab = null;
                switch (authorizedModule.Id) {
                    case 'mark':
                        tab = createMarkTab(authorizedModule);
                        break;
                    case 'file':
                        tab = createSidebarTab(authorizedModule, { issupportopen: true });
                        break;
                    case 'interaction':
                        tab = createSidebarTab(authorizedModule, { relationtype: 'practice' });
                        break;
                    default:
                        tab = createSidebarTab(authorizedModule);
                        break;
                }
                return tab;
            }
            if (result.length > 6) {
                // 取前五个，再添加一个更多菜单按钮
                result.slice(0, 5).forEach(authorziedModule => {
                    $scope.activityTabs.push(convertTab(authorziedModule));
                });
                $scope.activityTabs.push(createMenuTab());
            } else {
                result.forEach(authorizedModule => {
                    $scope.activityTabs.push(convertTab(authorizedModule));
                });
            }
            tabArray = [...$scope.prepareTabs, ...$scope.activityTabs];
        });

        getActivity();
    }
    init();
    /*---------------------------- 当前显示时间 --------------------------*/
    $scope.now = dateTime.getNow();
    var timeInterval = $interval(() => {
        $scope.now = dateTime.getNow();
    }, 1000);

    /*------------------------- 按钮操做 ----------------------------*/
    // 收起侧边栏
    $scope.foldSidebar = function () {
        ipcRenderer.send("FoldSidebar");
        $scope.isFold = true;      
    };
    // 展开侧边栏
    $scope.unfoldSidebar = function () {
        ipcRenderer.send('UnfoldSidebar');
        $scope.isFold = false;
        getActivity();
        let tab = tabArray.find(t => t.code == $scope.currentTab);
        if (tab) {
            tab.click(true);
        }   
    };
    // 显示桌面
    $scope.showDesktop = function(){
        endMark(() => {
            ipcRenderer.send('ShowDesktop');
            clearCurrentTab($scope.currentTab);
            getActivity();
        });
    };
    
    $scope.$on('$destroy', () => {
        if (timeInterval) {
            $interval.cancel(timeInterval);
            timeInterval = null;
        }
    });

    // 菜单窗口消失时，取消更多操做按钮的选中状态
    ipcRenderer.on('Reset', (event, id) => {
        clearCurrentTab(id);
    });
    ipcRenderer.on('ChangeLesson', (event, id) => {
        lessonId = id;
    });
}]);

}());