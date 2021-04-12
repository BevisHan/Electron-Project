var ipcRenderer = require('electron').ipcRenderer;
(function ()
{
'use strict';

angular.module('Shell.ClassroomTeaching.SmartClassroom.Group', [
    'ngResource',    
    'Figure-Config-RouteTable',
    'LINDGE-Service',
    'Figure-Config-ConfigSection',
    'Shell.ClassroomTeaching.SmartClassroom.DateTimeFormat'
])

.service('lessonService', ['$resource', 'path', 'routeTable', function ($resource, path, routeTable) {
    var serviceRoot = routeTable['classroomteaching_interaction'];

    var groupActivityeRes = $resource(path.combine(serviceRoot, 'GroupActivity/:id'), { id: '@id' }, {
        getLessonActivity: { method: 'GET' },
        getGroupActivity: { method: 'POST' }
    });

    this.getLessonActivity = groupActivityeRes.getLessonActivity.bind(groupActivityeRes);
    this.getGroupActivity = groupActivityeRes.getGroupActivity.bind(groupActivityeRes);
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

.service('groupDiscussService', ['$resource', 'path', 'routeTable', function ($resource, path, routeTable) {
    var serviceRoot = routeTable['classroomteaching_discussion'];

    var groupDiscuss = $resource(path.combine(serviceRoot, 'GroupDiscuss/:id/:receptor'), { id: '@id', receptor: '@receptor' });
    this.join = groupDiscuss.get.bind(groupDiscuss);
}])

.controller('MainCtrl', ['$scope', '$log', '$interval', 'queryString', 'lessonService', 'markService', 'groupDiscussService', 'discussTypes', 'dateTime',
function ($scope, $log, $interval, queryString, lessonService, markService, groupDiscussService, discussTypes, dateTime) {
    // controller code here
    $scope.isLoading = false;
    $scope.isFold = false;

    var lessonId = queryString.get('lessonid');
    var sceneId = queryString.get('sceneid');
    var behaviorId;
    var tabArray;

    $scope.currentTab = null;
    var isReceiveScreenProjection = false;
    var isReceiveBroadcast = false;

    function setScreenState() {
        let screenTab = $scope.activityTabs.find(tab => tab.code == 'screen');
        if (isReceiveScreenProjection || isReceiveBroadcast) {
            screenTab.isExecuting = true;
        } else {
            screenTab.isExecuting = false;
        }
    }

    /*------------------------ 创建侧边栏tab ---------------------------*/
    function setSelectedTab(id = null) {
        $scope.activityTabs.forEach(tab => {
            if (id && tab.code == id) {
                tab.isSelected = true;
            } else {
                tab.isSelected = false;
            }
        });
        if (id && $scope.groupDiscuss.code == id) {
            $scope.groupDiscuss.isSelected = true;
        } else {
            $scope.groupDiscuss.isSelected = false;
        }
    }

    function setCurrentTab(id) {
        $scope.currentTab = id;
        setSelectedTab(id);
    }

    function clearCurrentTab(id) {
        $scope.currentTab = id == $scope.currentTab ? null : $scope.currentTab;
        setSelectedTab($scope.currentTab);
    }
    
    function getLessonActivity() {
        lessonService.getLessonActivity({
            id: lessonId
        }, result => {
            let codes = [];
            if (result.IsMarking) {
                codes.push('mark');
            }

            if (result.IsReceiveScreenProjection) {
                codes.push('screen');
                isReceiveScreenProjection = true;
            } else {
                isReceiveScreenProjection = false;
            }
            setScreenState();
            
            $scope.activityTabs.forEach(tab => {
                if (codes.includes(tab.code)) {
                    tab.isExecuting = true;
                } else {
                    tab.isExecuting = false;
                }
            });
        });
    }

    function createTab(code, title, icon) {
        return {
            code: code,
            title: title,
            icon: icon,
            isExecuting: false,
            isSelected: false,
            isShow: true,
            click: function () { }
        };
    }

    function endMark(callback) {
        if (behaviorId) {
            markService.stop({
                id: behaviorId
            }, () => {
                behaviorId = '';
                callback();
            }, err => {
                $log.error(err);
            });
        } else {
            callback();
        }
    }

    function showMain(entrance, extendParam, isForceReload = false) {
        ipcRenderer.send('ShowWindow', {
            id: entrance,
            param: extendParam,
            isForceReload: isForceReload
        });
    }

    function hideWindow(entrance) {
        ipcRenderer.send('HideWindow', entrance);
    }

    function createSidebarTab(code, title, icon, entrance, extendParam) {
        let tab = createTab(code, title, icon);
        tab.click = function (isForceReload = false) {
            if ($scope.currentTab == this.code && !isForceReload) {
                return ;
            }
            endMark(() => {
                setCurrentTab(this.code);
                getLessonActivity();
                showMain(entrance, extendParam);
            });
        };
        return tab;
    }

    let markTab = createTab('mark', '标注', 'lic-pen');
    markTab.click = function (isForceReload = false) {
        if ($scope.currentTab == this.code && !isForceReload) {
            return ;
        }
        let promise = ipcRenderer.invoke('CaptureMark', lessonId);
        promise.then(captureResult => {
            markService.start({
                id: lessonId
            }, result => {
                behaviorId = result.BehaviorId;
                setCurrentTab(this.code);
                getLessonActivity();
                let extendParam = {
                    actionid: behaviorId,
                    image: captureResult.picturePath
                };
                showMain('ClassroomTeaching.Notation', extendParam);
            }, err => {
                $log.error(err);
            });
        });
    };

    var discussInfo = {
        entrance: '',
        size: '',
        id: ''
    };
    $scope.groupDiscuss = createTab('group_discuss', '分组讨论', 'lic-chat');
    $scope.groupDiscuss.click = function (isForceReload = false) {
        if ($scope.currentTab == this.code && !isForceReload) {
            return ;
        }
        endMark(() => {
            setCurrentTab(this.code);
            getLessonActivity();
            showMain(discussInfo.entrance, { id: discussInfo.id,  state: 'controlled'}, true);
        });
    };

    $scope.activityTabs = [
        markTab,
        createSidebarTab('file', '浏览文件', 'lic-folder', 'ClassroomTeaching.Material', { issupportopen: false }),
        createSidebarTab('screen', '投屏', 'lic-screen-mirror', 'ClassroomTeaching.Screen.GroupScreen.Controlbar', null),
    ];

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
    tabArray = [...$scope.activityTabs, $scope.groupDiscuss];
    // 展开侧边栏
    $scope.unfoldSidebar = function(){
        ipcRenderer.send('UnfoldSidebar');
        $scope.isFold = false;
        getLessonActivity();
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
            getLessonActivity();
        });
    };
    ipcRenderer.on('Reset', (event, id) => {
        clearCurrentTab(id);
    });

    getLessonActivity();

    var discussionId = '';
    var isJoining = false;
    var isShowBroadcast = false;
    function getGroupActivity() {
        lessonService.getGroupActivity(null,
            result => {
                if (result.SceneInfo.SceneId != sceneId || result.SceneInfo.LessonId != lessonId) {
                    sceneId = result.SceneInfo.SceneId;
                    lessonId = result.SceneInfo.LessonId;
                    ipcRenderer.send('Restar', {
                        sceneId: result.SceneInfo.SceneId,
                        lessonId: result.SceneInfo.LessonId
                    });
                    return;
                }          

                if ($scope.discussState != result.DiscussionInfo.State) {
                    $scope.discussState = result.DiscussionInfo.State;
                    if ($scope.discussState == 'UNSTART' && $scope.currentTab == 'group_discuss') {
                        ipcRenderer.send('ShowDesktop');
                        setCurrentTab(null);
                    }
                    ipcRenderer.send('ChangeDisucssState', result.DiscussionInfo.State);
                }

                if (result.IsDiscussing) {
                    $scope.groupDiscuss.isExecuting = true;
                    if (!isJoining && result.DiscussionInfo.DiscussionId && discussionId != result.DiscussionInfo.DiscussionId) {
                        isJoining = true;
                        groupDiscussService.join({
                            id: lessonId,
                            receptor: result.DiscussionInfo.DiscussionId
                        }, joinResult => {       
                            discussionId = result.DiscussionInfo.DiscussionId;
                            let discussType = discussTypes.find(type => type.Code.toUpperCase() == joinResult.Type.toUpperCase());
                            discussInfo.entrance = discussType.Entrance;
                            discussInfo.size = discussType.Size;
                            discussInfo.id = joinResult.DiscussboardId;
                            setCurrentTab($scope.currentTab);
                            if ($scope.isFold) {
                                $scope.unfoldSidebar();
                            }
                            $scope.groupDiscuss.click(true);
                        }, err => {
                            $log.error(err);
                        }).$promise
                        .finally(() => {
                            isJoining = false;
                        });
                    }
                } else {
                    $scope.groupDiscuss.isExecuting = false;
                    Object.keys(discussInfo).forEach(key => {
                        discussInfo[key] = '';
                    });
                    $scope.discussState = '';
                }
                
                if (result.IsReceiveBroadcast && !isJoining) {
                    isReceiveBroadcast = true;
                    isShowBroadcast = true;
                    showMain('ClassroomTeaching.Screen.Broadcast', { channelid: result.BroadcastChannelId });
                } else {
                    isReceiveBroadcast = false;
                    if(isShowBroadcast){
                        hideWindow('ClassroomTeaching.Screen.Broadcast');
                        isShowBroadcast = false;    
                    }
                }
                setScreenState();
            }, err => {
                $log.error(err);
            }
        ).$promise
        .finally(() => {
            setTimeout(() => {
                getGroupActivity();
            }, 3000);
        });
    }

    getGroupActivity();
    
    $scope.$on('$destroy', () => {
        if (timeInterval) {
            $interval.cancel(timeInterval);
            timeInterval = null;
        }
    });
}]);

}());