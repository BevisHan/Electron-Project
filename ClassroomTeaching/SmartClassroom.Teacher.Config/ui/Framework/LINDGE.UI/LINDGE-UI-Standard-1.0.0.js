(function () {
'use strict';
angular.module('LINDGE-UI-Standard', ['LINDGE-Service', 'LINDGE-UI-Core', 'LINDGE.UI-Standard.Control.AppNavigationFramework', 'LINDGE.UI-Standard.Control.AppNavigatorBar', 'LINDGE.UI-Standard.Control.Topbar', 'LINDGE.UI-Standard.Control.AudioPlayer', 'LINDGE.UI-Standard.Control.BreadCrumb', 'LINDGE.UI-Standard.Control.Button', 'LINDGE.UI-Standard.Control.ContextMenu', 'LINDGE.UI-Standard.Control.DatePicker', 'LINDGE.UI-Standard.Control.Dialog', 'LINDGE.UI-Standard.Control.FileDropper', 'LINDGE.UI-Standard.Control.FloatToobar', 'LINDGE.UI-Standard.Control.Form', 'LINDGE.UI-Standard.Control.Message', 'LINDGE.UI-Standard.Control.NumberFlipper', 'LINDGE.UI-Standard.Control.Pagination', 'LINDGE.UI-Standard.Control.Popover', 'LINDGE.UI-Standard.Control.RichTextEdit', 'LINDGE.UI-Standard.Control.Search', 'LINDGE.UI-Standard.Control.SpinBox', 'LINDGE.UI-Standard.Control.SwitchList', 'LINDGE.UI-Standard.Control.NgTable', 'LINDGE.UI-Standard.Control.Tabs', 'LINDGE.UI-Standard.Control.TreeView', 'LINDGE.UI-Standard.Control.FiletaskList', 'LINDGE.UI-Standard.Control.Uploader', 'LINDGE.UI-Standard.Control.VideoPlayer', 'LINDGE.UI-Standard.Control.VideoService', 'LINDGE.UI-Standard.Control.Waiting']);
angular.module('LINDGE.UI-Standard.Control.AppNavigationFramework', [])

.controller('$luiNavframeAppCtrl', ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
    this.sidebar = null;
    this.body = null;

    $scope.sidebarCollapsed = false;
    $scope.showCollapseBtn = false;

    var sidebarCollapseCls = 'sidebar-collapsed';
    var containerElm = $element;

    this.registerSidebar = function (ctrl) {
        if (ctrl) {
            this.sidebar = ctrl;
            this.addSidebarCls();
        }
    };

    this.registerBody = function (ctrl) {
        if (ctrl) {
            this.body = ctrl;
        }
    };

    this.hasSidebar = function () {
        return !!this.sidebar;
    };

    this.toggleSidebarCollapse = function () {
        $scope.sidebarCollapsed = !$scope.sidebarCollapsed;
        if ($scope.sidebarCollapsed) {
            containerElm.addClass(sidebarCollapseCls);
        } else {
            containerElm.removeClass(sidebarCollapseCls);
        }
    };

    this.showSidebarCollapseBtn = function () {
        if (this.hasSidebar()) {
            $scope.showCollapseBtn = true;
        }
    };

    this.addSidebarCls = function () {
        containerElm.addClass('lui-navframe-app-2-col');
    };
}])

.directive('luiNavframeApp', ['$rootScope', '$templateCache', '$compile', function ($rootScope, $templateCache, $compile) {
    return {
        priority: 1,
        scope: {},
        controller: '$luiNavframeAppCtrl',
        restrict: 'EA',
        // templateUrl: 'lui-tpl/AppNavigationFramework/navigation-framework-app.tmpl.html',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs, ctrl) {
            iElm.addClass('lui-navframe-app');

            var toggleBtnTpl = $templateCache.get('lui-tpl/AppNavigationFramework/navigation-collapse-btn.tmpl.html');
            if (toggleBtnTpl) {
                var btnElm = $compile(toggleBtnTpl)(scope);
                iElm.append(btnElm);
            }

            scope.toggleCollapse = function () {
                ctrl.toggleSidebarCollapse();
                setTimeout(function () {
                    $rootScope.$emit('lui-navframe-sidepanel-toggle');
                }, 220);
            };
        }
    };
}])

.directive('luiNavframeAppsidebar', [function(){
    return {
        priority: 1,
        scope: {
            header: '@'
        },
        // controller: function($scope, $element, $attrs, $transclude) {},
        require: '^luiNavframeApp',
        restrict: 'EA',
        templateUrl: 'lui-tpl/AppNavigationFramework/navigation-framework-sidebar.tmpl.html',
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs, appCtrl) {
            if (appCtrl) {
                appCtrl.registerSidebar(iElm);

                if (iAttrs.hasOwnProperty('collapsable')) {
                    appCtrl.showSidebarCollapseBtn();
                }
            }
        }
    };
}])

.directive('luiNavframeAppbody', [function(){
    return {
        priority: 1,
        scope: false,
        // controller: function($scope, $element, $attrs, $transclude) {},
        require: '^luiNavframeApp',
        restrict: 'EA',
        // template: '<div class="lui-navframe-appbody" ng-transclude></div>',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs, appCtrl) {
            iElm.addClass('lui-navframe-appbody');

            if (appCtrl) {
                appCtrl.registerBody(iElm);
            }
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.AppNavigatorBar', ['Figure-Config-RouteTable', 'ngResource'])

.service('$userApplicationService', ['$resource', 'path', 'routeTable', function ($resource, path, routeTable) {
    var serviceUrl = routeTable['user_appmodule'];

    var applicationRes = $resource(path.combine(serviceUrl, 'SelfApplication/:id'), { id: '@id' }, {
        pin: { method: 'PUT', isArray: false },
        unpin: { method: 'DELETE', isArray: false }
    });

    this.getApplications = applicationRes.query.bind(applicationRes);
    this.pinApplication = applicationRes.pin.bind(applicationRes);
    this.unpinApplication = applicationRes.unpin.bind(applicationRes);
}])

.directive('appNavigatorBar', ['$userApplicationService', '$log', '$luiHref', '$luiDragAction', '$document', function ($userApplicationService, $log, $luiHref, DragAction, $document) {
    /**
     * test location equality by host and pathname
     * @param  {Location}  location1
     * @param  {Location}  location2
     * @return {Boolean}
     */
    function isSameLocation(location1, location2) {
        return location1.host.toLowerCase() == location2.host.toLowerCase() &&
            location1.pathname.toLowerCase() == location2.pathname.toLowerCase();
    }

    var PANEL_COLUMN_CLS = ['app-col-1', 'app-col-2', 'app-col-3'];

    return {
        priority: 1,
        scope: {},
        // controller: function(scope, $element, $attrs, $transclude) {},
        restrict: 'E',
        templateUrl: 'lui-tpl/AppNavigatorBar/app-navigator-bar.tmpl.html',
        replace: true,
        link: function(scope, iElm, iAttrs) {
            var columnCount = 1;
            scope.appColumns = [];
            scope.pinnedApps = [];
            scope.recentAccessApps = [];

            scope.showAppPanel = false;
            scope.appFilter = '';
            scope.hasFilteredApps = true;

            var appPanelShowHandles = [];
            var categories = [];

            /**
             * compuate number of columns for display
             *
             * number_of_category < 3                          ->  1 column
             * number_of_category >= 9                         ->  3 column
             * number_of_app < 15                              ->  1 column
             * number_of_app < 25 || number_of_category == 2   ->  2 column
             * number_of_app >= 25                             ->  3 column
             * 
             * @param  {Array} categories
             * @return {Number}
             */
            function computeColumnCount(categories) {
                var categoryCount = categories.length;

                if (categoryCount < 3) {
                    return 1;
                } else if (categoryCount >= 9) {
                    return 3;
                } else {
                    var appCount = categories.reduce(function (sum, category) {
                        return sum + category.Apps.length;
                    }, 0);

                    if (appCount < 15) {
                        return 1;
                    } else if (appCount < 25 || categoryCount == 2) {
                        return 2;
                    } else {
                        return 3;
                    }
                }
            }

            function filterApps(categories, filterKey, columns) {
                var result = new Array(columns);
                for (var i = 0; i < columns; i++) {
                    result[i] = [];
                }

                var index = 0;
                categories.forEach(function (category) {
                    var filteredApps;
                    if (category.DisplayName.indexOf(filterKey) >= 0) {
                        filteredApps = category.Apps;
                    } else {
                        filteredApps = category.Apps.filter(function (app) {
                            return app.DisplayName.indexOf(filterKey) >= 0;
                        });
                    }

                    if (filteredApps.length > 0) {
                        var colIdx = index % columns;
                        result[colIdx].push({
                            DisplayName: category.DisplayName,
                            Apps: filteredApps
                        });

                        index++;
                    }
                });

                return result;
            }

            function filterPinnedApps(categories) {
                var urlResolver = document.createElement('a');
                var currentLocation = window.location;

                var result = [];
                categories.forEach(function (category, index) {
                    category.Apps.forEach(function (app) {
                        if (app.IsCollected) {
                            result.push(app);

                            urlResolver.href = app.Url;
                            app.$active = isSameLocation(currentLocation, urlResolver);
                        }
                    });
                });

                return result;
            }

            function updatePanelCls(columnCount) {
                var cls = PANEL_COLUMN_CLS[columnCount - 1];
                var panel = angular.element(iElm[0].querySelector('.app-panel'));
                if (panel) {
                    panel.addClass(cls);
                }
            }

            function loadApplications() {
                $userApplicationService.getApplications(null, function (appInfo) {
                    categories = appInfo;
                    columnCount = computeColumnCount(categories);
                    updatePanelCls(columnCount);
                    scope.appColumns = filterApps(categories, '', columnCount);
                    scope.pinnedApps = filterPinnedApps(categories);
                }, function () {
                    $log.error('加载用户应用失败，请和管理员联系');
                });
            }

            scope.togglePinndedState = function (app) {
                if (app.IsCollected) {
                    $userApplicationService.unpinApplication({ id: app.AppId }, function () {
                        app.IsCollected = false;
                        var idx = scope.pinnedApps.indexOf(app);
                        if (idx >= 0) {
                            scope.pinnedApps.splice(idx, 1);
                        }
                    }, function () {
                        $log.error('取消收藏应用 ' + app.DisplayName + '[' + app.AppId + ']失败，请和管理员联系');
                    });
                } else {
                    $userApplicationService.pinApplication({ id: app.AppId }, null, function () {
                        app.IsCollected = true;
                        scope.pinnedApps.length = 0;
                        Array.prototype.push.apply(scope.pinnedApps, filterPinnedApps(categories));
                    }, function () {
                        $log.error('收藏应用 ' + app.DisplayName + '[' + app.AppId + ']失败，请和管理员联系');
                    });
                }
            };

            scope.toggleAppPanel = function () {
                scope.showAppPanel = !scope.showAppPanel;
                if (scope.showAppPanel) {
                    for (var i = 0; i < appPanelShowHandles.length; i++) {
                        appPanelShowHandles[i]();
                    }
                }
            };

            scope.filterApps = function () {
                scope.appColumns = filterApps(categories, scope.appFilter, columnCount);
                scope.hasFilteredApps = scope.appColumns.some(function (arr) { return arr.length > 0; });
            };

            iElm.bind('click', function (evt) {
                evt.stopPropagation();
            });

            angular.element(document.body).bind('click', function () {
                if (scope.showAppPanel) {
                    scope.toggleAppPanel();
                    scope.$apply();
                }
            });

            function setupCategoryListScroll() {
                var categoryList = iElm[0].querySelector('.app-panel .app-category-list');
                var categoryListWrapper = categoryList.querySelector('.app-category-list-wrapper');

                function updateScrollState() {
                    var height = categoryList.getBoundingClientRect().height;
                    var wrapperHeight = categoryListWrapper.getBoundingClientRect().height;

                    categoryListWrapper.style.position = (wrapperHeight > height) ? 'relative' : 'static';
                }

                function updateScrollElement(delta) {
                    if (isNaN(delta)) {
                        return;
                    }

                    var height = categoryList.getBoundingClientRect().height;
                    var wrapperHeight = categoryListWrapper.getBoundingClientRect().height;

                    if (wrapperHeight > height) {
                        var top = parseFloat(window.getComputedStyle(categoryListWrapper)['top']);
                        var newTop = top - delta;
                        var minTop = height - wrapperHeight;
                        newTop = Math.min(Math.max(newTop, minTop), 0);
                        categoryListWrapper.style.top = newTop + 'px';
                    }
                }

                // normal scroll
                angular.element(categoryList).bind('wheel', function (evt) {
                    evt = evt.originalEvent || evt;
                    updateScrollElement(Number(evt.deltaY || evt.wheelDeltaY));
                });

                // mobile swip
                var dragAction = new DragAction();

                angular.element(categoryList).bind('touchstart', function (evt) {
                    if (!dragAction.isActive()) {
                        dragAction.active(evt, dragAction.ACTION_TYPES.touch);
                    }
                });

                $document.bind('touchmove', function (evt) {
                    if (dragAction.isActive()) {
                        evt.stopPropagation();

                        var offsets = dragAction.offset(evt);
                        updateScrollElement(-offsets[1] * 5);
                    }
                });

                $document.bind('touchend', function (evt) {
                    if (dragAction.isActive()) {
                        dragAction.deactive(evt);
                    }
                });


                // window size watcher
                window.addEventListener('resize', function () {
                    updateScrollState();
                });

                appPanelShowHandles.push(updateScrollState);

                updateScrollState();
            }

            setupCategoryListScroll();
            loadApplications();
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Topbar', ['LINDGE.UI-Core.Service.UserInfo', 'Figure-Config-RouteTable', 'ngResource'])

.controller('topbarCtrl', ['$scope', '$timeout', '$window', '$document', '$rootScope', 'systemConfig', 'userInfo', 'USER_INFO_CONSTANTS', 'localStorageService',
    function($scope, $timeout, $window, $document, $rootScope, systemConfig, userInfo, USERINFO_CONSTS, localStorage) {
        if ($scope.isCheckLogon == 'true') {
            if (userInfo.token == null || userInfo.token === undefined || userInfo.token === '') {
                $window.location = systemConfig.logonUrl;
                return;
            }
        }

        $scope.showMessage = false;
        $scope.showUserOperation = false;
        $scope.messages = [];
        $scope.messageCount = 0;

        function updateUserInfo() {
            $scope.apps = userInfo.apps;
            $scope.avatarId = userInfo.photo;
            $scope.userName = userInfo.displayname || '未登录';

            $scope.units = userInfo.units;
            $scope.currentUnit = userInfo.localunit;
        }

        $scope.$on(USERINFO_CONSTS.updateEvt, function() {
            updateUserInfo();
        });

        window.addEventListener('storage', function(evt) {
            var userInfoKey = localStorage.deriveKey(USERINFO_CONSTS.info);
            if (evt.key == userInfoKey) {
                updateUserInfo();
                $scope.$apply();
            }
        });

        $scope.update = function() {
            updateUserInfo();
        };

        // system configs
        $scope.name = $scope.displayName || systemConfig.name;
        $scope.showLogo = true;
        if (typeof(systemConfig.logo) == 'string' && systemConfig.logo.length > 0) {
            $scope.logoPath = systemConfig.logo;
        } else {
            $scope.showLogo = false;
        }

        $scope.update();

        /*目前没有消息服务支持, 暂时禁用*/
        /*
        $timeout(function ()
        {
            topbarMessage.get(function (messageCollection)
            {
                if (messageCollection.length !== undefined && messageCollection.length > 0)
                {
                    $scope.messages = messageCollection;
                    $scope.messageCount = $scope.messages.length;
                }
            });
        }, 2000);
        */
       
        this.actions = [];

        this.registerAction = function (action) {
            this.actions.push(action);
        };
       
        this.setupSearching = function (callback) {
            $scope.$searchKey = '';

            $scope.$activeSearch = function (evt) {
                if ($scope.$searchKey) {
                    if (evt instanceof window.MouseEvent ||
                        (evt instanceof window.KeyboardEvent && evt.keyCode == 13)) {
                        $rootScope.$broadcast('lui-system-search', $scope.$searchKey);

                        if (angular.isFunction(callback)) {
                            callback();
                        }
                    }
                }
            };
        };
    }
])

.directive('topbarAction', [function () {
    return {
        priority: 1,
        scope: {
            href: '@',
            ngClick: '&',
            ngDisabled: '&',
            newTab: '='
        },
        require: '^appNavigatorTopbar',
        restrict: 'E',
        replace: false,
        link: function (scope, iElm, iAttrs, topbarCtrl) {
            function getClickHandle() {
                if (iAttrs['ngClick']) {
                    return scope.ngClick;
                } else {
                    return null;
                }
            }

            function getHref() {
                return scope.href || null;
            }

            topbarCtrl.registerAction({
                target: iAttrs['target'],
                text: iAttrs['text'],
                icon: iAttrs['icon'],
                preset: iAttrs['preset'] || null,
                href: getHref(),
                disableHandle: scope.ngDisabled,
                clickHandle: getClickHandle(),
                newTab: !!scope.newTab
            });
        }
    };
}])

.directive('appNavigatorTopbar', ['systemConfig', function (systemConfig) {
    var actionPresets = {
        'account': {
            href: systemConfig.personUrl,
            text: '账号设置',
            icon: 'user-square',
            newTab: false,
            disableHandle: function () { return false; },
            clickHandle: null
        },
        'identity': {
            href: systemConfig.identityUrl,
            text: '切换身份',
            icon: 'exchange',
            newTab: false,
            disableHandle: function () { return false; },
            clickHandle: null
        },
        'message': {
            href: '',
            text: '消息',
            icon: 'bell-o',
            newTab: false,
            disableHandle: function () { return false; },
            clickHandle: null
        }
    };

    var defaultMenuEntranceList = [];

    if (systemConfig.personUrl) {
        defaultMenuEntranceList.push(actionPresets.account);
    }

    if (systemConfig.identityUrl) {
        defaultMenuEntranceList.push(actionPresets.identity);
    }

    return {
        priority: 1,
        scope: {
            productUrl: '@',
            displayName: '@',
            isCheckLogon: '@',
            searchbar: '@'
        },
        controller: 'topbarCtrl',
        restrict: 'E',
        transclude: true,
        templateUrl: 'lui-tpl/AppNavigatorTopbar/app-navigator-topbar.tmpl.html',
        replace: true,
        link: function(scope, iElm, iAttrs, controller) {
            scope.headerUrl = scope.productUrl || systemConfig.gatewayUrl;
            scope.logoutUrl = systemConfig.logoutUrl;

            function transformAction(action) {
                if (action.preset) {
                    var preset = actionPresets[action.preset];
                    return preset || action;
                } else {
                    return action;
                }
            }

            scope.topbarEntranceList = controller.actions
                .filter(function (a) {
                    return a.target == 'topbar';
                })
                .map(transformAction);

            scope.menuEntranceList = defaultMenuEntranceList.concat(
                controller.actions
                    .filter(function (a) {
                        return a.target == 'menu';
                    })
                    .map(transformAction)
            );

            scope.callHandle = function (evt, entrance) {
                if (entrance.clickHandle) {
                    evt.preventDefault();
                    entrance.clickHandle({ $event: evt });
                }
            };

            scope.$watch('searchbar', function(newValue, oldValue) {
                scope.showSearchbar = (newValue == 'true');
                if (scope.showSearchbar && oldValue != 'true') {
                    controller.setupSearching();
                }
            });
        }
    };
}])

.directive('topbarSimple', ['systemConfig', function (systemConfig) {
    return {
        priority: 1,
        scope: {
            displayName: '@',
        },
        controller: 'topbarCtrl',
        restrict: 'E',
        templateUrl: 'lui-tpl/AppNavigatorTopbar/topbar-simple.tmpl.html',
        replace: true
    };
}]);
angular.module('LINDGE.UI-Standard.Control.AudioPlayer', [])

.service('$luiMediaUtil', [function () {
    this.formatPlayerTime = function (seconds, formatHour) {
        seconds = Math.ceil(seconds);
        if (isNaN(seconds)) {
            return '0:0';
        } else {
            var minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;

            var parts = [seconds > 9 ? seconds : '0' + seconds];

            if (formatHour && minutes >= 60) {
                var hours = Math.floor(minutes / 60);
                minutes -= hours * 60;

                parts.unshift(minutes > 9 ? minutes : '0' + minutes);
                parts.unshift(hours);
            } else {
                parts.unshift(minutes);
            }

            return parts.join(':');
        }
    };
}])

.factory('$luiAudioService', ['$injector', '$SDK', '$log', '$ngUtil', '$luiTimer', function ($injector, $SDK, $log, $ngUtil, Timer) {
    var NAME_AUDIO_SERVICE = 'AudioCore';
    var NAME_OUTSIDER_SERVICE = 'LCWOutsiderService';

    var DEFAULT_TIMER_INTERVAL = 200;

    var clamp = $SDK.Math.clamp;

    var AudioCore = $ngUtil.tryLoadService(NAME_AUDIO_SERVICE);
    var OutsiderService = $ngUtil.tryLoadService(NAME_OUTSIDER_SERVICE, function (service) { return service.OutsiderService; });


    /**
     * Audio Service
     */
    function AudioService() {
        if (OutsiderService) {
            OutsiderService.call(this);
        }

        this._uiHandles = [];

        this._refineStateUpdating = false;
        this._refreshTimer = new Timer(DEFAULT_TIMER_INTERVAL);

        this._currentFile = '';
        this._start = -1;           // s
        this._end = -1;             // s
        this._handles = null;
        this._autoStart = false;

        this._canplay = false;

        this.audio = new AudioCore(0);
        this._setupAudio();

        this.currentTime = 0;
        this.duration = 0.0;
        this.progress = 0.0;    // [0, 100]
        this.isActive = false;
        this.isPlaying = false;
    }

    if (OutsiderService) {
        $SDK.Lang.inherits(AudioService, OutsiderService);
    }

    AudioService.prototype._setupAudio = function() {
        this.audio.addEventListener('loadedmetadata', () => {
            if (this._useCustomRange()) {
                this.duration = this._end - this._start;
            } else {
                this.duration = this.audio.getDuration();
            }
        });

        this.audio.addEventListener('canplay', () => {
            this._canplay = true;

            if (this._autoStart) {
                this.play();
            } else {
                this._updateTime();
                this._notifyUI();
            }
        });

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
        });

        this.audio.addEventListener('error', err => {
            if (this.isActive) {
                this.terminatePlayback();
            }
        });

        this.audio.addEventListener('ended', () => {
            if (this.isActive) {
                this.pause();

                if (this._handles.onPlayEnd) {
                    try {
                        this._handles.onPlayEnd();
                    } catch (err) {
                        $log.error('error occurred when calling play end handle', err);
                    }
                }
            }
        });
    };

    AudioService.prototype._initAudio = function() {
        if (!this._currentFile) {
            return;
        }

        this.audio.setSrc(this._currentFile);

        if (this._useCustomRange()) {
            this.audio.setTime(this._start);
        }
    };

    AudioService.prototype._notifyUI = function() {
        this._uiHandles.forEach(function (handle) {
            try {
                handle.notify();
            } catch (err) {
                $log.error('error occurred when calling ui notify callback', err);
            }
        });
    };

    AudioService.prototype.addUIHandle = function(handle) {
        this._uiHandles.push(handle);
    };

    AudioService.prototype._reset = function() {
        this._currentFile = '';
        this._start = -1;           // s
        this._end = -1;             // s
        this._handles = null;
        this._canplay = false;
        this._autoStart = false;

        this.currentTime = 0;
        this.duration = 0.0;
        this.progress = 0.0;    // [0, 100]
        this.isActive = false;
        this.isPlaying = false;

        this._stopStateUpdate();
    };

    AudioService.prototype.initPlayback = function(config) {
        // {
        //     file,
        //     autoStart,
        //     onPlayStart,
        //     onPlayEnd,
        //     onTerminate,
        //     onError,
        //     start?,
        //     end?
        // }

        if (config.file) {
            this._currentFile = config.file;
        } else {
            this._currentFile = '';
        }

        if (typeof config.start == 'number' && config.start >= 0) {
            this._start = config.start / 1000;      // convert to s
        }

        if (typeof config.end == 'number' && config.end >= 0) {
            this._end = config.end / 1000;
        }

        this._autoStart = !!config.autoStart;
        this._handles = config;

        this._initAudio(config);
        this.isActive = true;
        this._notifyUI();
    };

    AudioService.prototype.terminatePlayback = function() {
        if (this.isActive) {
            this.audio.stop();
            this.audio.setSrc('');

            var handles = this._handles;

            this._reset();
            this._notifyUI();

            if (handles.onTerminate) {
                handles.onTerminate();
            }
        }
    };

    if (OutsiderService) {
        AudioService.prototype.newInstance = function(config) {
            if (this.isActive) {
                throw new Error('closeInstance is not called yet');
            }

            this.initPlayback(config);

            return this;
        };

        AudioService.prototype.closeInstance = AudioService.prototype.terminatePlayback;

        AudioService.prototype.isOccupied = function() {
            return this.isActive;
        };
    }

    /* =============== state management =============== */
    AudioService.prototype.useRefineStateUpdating = function() {
        this._refineStateUpdating = true;
    };

    AudioService.prototype._setupStateUpdate = function() {
        var audio = this.audio;

        this._refreshTimer.start({
            tick: () => {
                if (this._canplay) {
                    this._updateTime();

                    if (this.currentTime >= this.duration) {
                        if (this.isPlaying) {
                            audio.pause();
                            this.isPlaying = false;

                            if (this._handles.onPlayEnd) {
                                try {
                                    this._handles.onPlayEnd();
                                } catch (err) {
                                    $log.error('error occurred when calling play end handle', err);
                                }
                            }
                        }

                        this._notifyUI();
                        return false;
                    } else {
                        this._notifyUI();
                        return true;
                    }
                } else {
                    return false;
                }
            },
            interval: () => {
                return this.duration >= 3600 ? DEFAULT_TIMER_INTERVAL : 80;
            }
        });
    };

    AudioService.prototype._stopStateUpdate = function() {
        if (this._refreshTimer.isRunning) {
            this._refreshTimer.stop();
        }
    };

    /* =============== -- =============== */

    /* =============== time management =============== */
    AudioService.prototype._useCustomRange = function() {
        return this._start >= 0 && this._end > this._start;
    };

    AudioService.prototype._updateTime = function() {
        var audio = this.audio;
        var currentTime = audio.getTime();

        if (this._useCustomRange()) {
            this.currentTime = Math.max(currentTime - this._start, 0.0);
            this.progress = clamp(0.0, 1.0, this.currentTime / this.duration) * 100;
        } else {
            this.currentTime = currentTime;
            this.progress = audio.getPosition() * 100;
        }

        if (this.currentTime > this.duration) {
            this.currentTime = this.duration;
        }
    };

    AudioService.prototype._isPassedTime = function(time) {
        if (this._useCustomRange()) {
            return time >= this._end;
        } else {
            return time >= this.audio.getDuration();
        }
    };

    AudioService.prototype._getEndTime = function() {
        return this._useCustomRange() ? this._end : this.duration;
    };

    AudioService.prototype._getStartTime = function() {
        return this._useCustomRange() ? this._start : 0;
    };

    /* =============== -- =============== */

    /* =============== control methods =============== */
    AudioService.prototype._playFromTime = function(time) {
        this._canplay = false;
        this.audio.setTime(time);
    };

    AudioService.prototype.seekBy = function(offset) {
        if (offset === 0 || !this._canplay) {
            return;
        }

        var startTime = this._getStartTime();
        var endTime = this._getEndTime();

        var oldTime = clamp(startTime, endTime, this.audio.getTime());
        var newTime = oldTime + offset;
        newTime = clamp(startTime, endTime, newTime);

        if (newTime != oldTime) {
            this._playFromTime(newTime);
        }
    };

    AudioService.prototype.seekTo = function(newTime) {
        if (!this._canplay) {
            return;
        }

        var startTime = this._getStartTime();
        var endTime = this._getEndTime();

        var oldTime = clamp(startTime, endTime, this.audio.getTime());
        newTime = clamp(startTime, endTime, newTime);

        if (newTime != oldTime) {
            this._playFromTime(newTime);
        }
    };

    AudioService.prototype.seekToPosition = function(position) {
        if (!this._canplay) {
            return;
        }

        var startTime = this._getStartTime();
        var endTime = this._getEndTime();

        var newTime = position * endTime + (1 - position) * startTime;

        if (isNaN(newTime)) {
            throw new TypeError('invalid position');
        } else {
            newTime = clamp(startTime, endTime, newTime);
        }

        var oldTime = clamp(startTime, endTime, this.audio.getTime());
        if (newTime != oldTime) {
            this._playFromTime(newTime);
        }
    };

    AudioService.prototype.play = function() {
        if (this._canplay && !this.isPlaying) {
            var currentTime = this.audio.getTime();
            if (this._isPassedTime(currentTime)) {
                var startTime = this._getStartTime();
                this.audio.setTime(startTime);
            } else {
                this.audio.play();
                if (this._refineStateUpdating) {
                    this._setupStateUpdate();
                }
                this.isPlaying = true;

                if (this._handles.onPlayStart) {
                    try {
                        this._handles.onPlayStart();
                    } catch (err) {
                        $log.error('error occurred when calling play start handle', err);
                    }
                }
            }
        }
    };

    AudioService.prototype.pause = function() {
        this.audio.pause();
        this._stopStateUpdate();
        this.isPlaying = false;
    };
    /* =============== -- =============== */

    return {
        createAudioService: function () {
            return new AudioService();
        },
        AudioService: AudioService
    };
}])

.directive('luiAudioPlayer', ['$luiAudioService', '$document', '$luiMediaUtil', function ($luiAudioService, $document, $luiMediaUtil) {
    return {
        priority: 1,
        scope: {
            audioService: '=',
            onInit: '='
        },
        // controller: function($scope, $element, $attrs, $transclude) {},
        restrict: 'E',
        templateUrl: 'lui-tpl/AudioPlayer/audio-player.tmpl.html',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs) {
            var progressElm = iElm[0].querySelector('.audio-progress');
            var progressSub = progressElm.querySelector('.progress-sub');
            var slide = progressElm.querySelector('.progress-slide');

            var progressWrapper = angular.element(progressSub);
            var slideWrapper = angular.element(slide);
            var currentTimeWrapper = angular.element(slide.querySelector('.time-current'));
            var durationWrapper = angular.element(slide.querySelector('.time-duration'));

            var progressWidth = parseFloat(window.getComputedStyle(progressElm)['width']);
            var slideWidth = parseFloat(window.getComputedStyle(slide)['width']);
            var slideTrackWidth = progressWidth - slideWidth;

            var progressUpdating = true;
            var lastPercent = 0;

            /* progress handling */
            function updateProgress(percent) {
                function normalizePrecision(value) {
                    return Math.round(value * 100) / 100;
                }

                if (lastPercent > percent) {
                    progressWrapper.addClass('no-anim');
                    slideWrapper.addClass('no-anim');
                }

                progressWrapper.css('right', (100 - percent) + '%');
                slideWrapper.css('left', normalizePrecision(slideTrackWidth * percent / 100.0) + 'px');

                if (lastPercent > percent) {
                    setTimeout(function () {
                        progressWrapper.removeClass('no-anim');
                        slideWrapper.removeClass('no-anim');
                    }, 20);                    
                }

                lastPercent = percent;
            }

            function setupSlideAction() {
                var trackStart = -1;
                var startLeft = 0;
                var position = 0.0;

                function updateDragState(evt) {
                    var offset = evt.clientX - trackStart;
                    var newLeft = startLeft + offset;
                    if (newLeft < 0) {
                        newLeft = 0;
                    } else if (newLeft > slideTrackWidth) {
                        newLeft = slideTrackWidth;
                    }

                    slideWrapper.css('left', newLeft + 'px');

                    position = newLeft / slideTrackWidth;
                    progressWrapper.css('right', ((1 - position) * 100) + '%');

                    currentTimeWrapper.text($luiMediaUtil.formatPlayerTime(position * service.duration));
                }

                function onMouseMove(evt) {
                    evt.preventDefault();
                    updateDragState(evt);
                }

                function onMouseRelease(evt) {
                    $document.unbind('mousemove', onMouseMove);
                    $document.unbind('mouseup', onMouseRelease);

                    updateDragState(evt);

                    if (service.isPlaying) {
                        service.audio.play();
                    } else {
                        service.play();
                    }

                    service.seekToPosition(position);

                    progressWrapper.removeClass('no-anim');
                    slideWrapper.removeClass('no-anim');

                    trackStart = -1;
                    startLeft = 0;
                    position = 0.0;
                    progressUpdating = true;
                }

                slideWrapper.bind('mousedown', function (evt) {
                    if (evt.button !== 0) {
                        return;
                    }

                    evt.preventDefault();

                    trackStart = evt.clientX;
                    startLeft = parseFloat(window.getComputedStyle(slide)['left']);
                    progressUpdating = false;

                    // mimic suspending
                    if (service.isPlaying) {
                        service.audio.pause();
                    }

                    progressWrapper.addClass('no-anim');
                    slideWrapper.addClass('no-anim');

                    $document.bind('mousemove', onMouseMove);
                    $document.bind('mouseup', onMouseRelease);
                });
            }

            setupSlideAction();

            /* scope variables */
            scope.currentTime = 0;

            /* service initiation */
            var service;
            if (scope.audioService && scope.audioService instanceof $luiAudioService.AudioService) {
                service = scope.audioService;
            } else {
                service = $luiAudioService.createAudioService();
            }

            service.useRefineStateUpdating();

            service.addUIHandle({
                notify: function () {
                    if (progressUpdating) {
                        currentTimeWrapper.text($luiMediaUtil.formatPlayerTime(service.currentTime));
                        durationWrapper.text($luiMediaUtil.formatPlayerTime(service.duration));
                        updateProgress(service.progress);
                    }
                    scope.$evalAsync(angular.noop);
                }
            });

            scope.service = service;

            // other init code
            if (angular.isFunction(scope.onInit)) {
                scope.onInit(service);
            }

            scope.$on('$destroy', function () {
                service.terminatePlayback();
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.BreadCrumb', [])

.directive('luiBreadCrumb', [function () {
    var breadCrumbSeparator = angular.element('<span class="bread-crumb-sep"></span>');
    var breadCrumbTag = angular.element('<span class="bread-crumb-tag"></span>');
    var breadCrumbBtn = angular.element('<span class="bread-crumb-btn"></span>');

    return {
        priority: 1,
        restrict: 'E',
        scope: {
            path: '='
        },
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs) {
            var steps = [];

            function convertStep(input) {
                var step = {
                    index: 0,
                    text: '',
                    callback: null
                };

                if (typeof input == 'string') {
                    step.text = input;
                } else {
                    if (input.text) {
                        step.text = input.text;
                    }

                    if (angular.isFunction(input.callback)) {
                        step.callback = input.callback;
                    }
                }

                return step;
            }

            function updateElements() {
                if (steps.length > 0) {
                    for (var i = 0; i < steps.length; i++) {
                        var step = steps[i];
                        var elm;
                        if (step.callback) {
                            elm = breadCrumbBtn.clone();
                        } else {
                            elm = breadCrumbTag.clone();
                        }

                        elm.attr('data-step', step.index);
                        elm.text(step.text);
                        iElm.append(elm);

                        if (i < (steps.length - 1)) {
                            var separator = breadCrumbSeparator.clone();
                            iElm.append(separator);
                        }
                    }
                }
            }

            function onModelUpdate(newSteps) {
                iElm.empty();
                steps.length = 0;

                if (Array.isArray(newSteps)) {
                    newSteps.forEach(function (item) {
                        var step = convertStep(item);
                        step.index = steps.length;
                        steps.push(step);
                    });
                    updateElements();
                }
            }

            iElm.bind('click', function (evt) {
                var srcElm = angular.element(evt.srcElement);
                var stepIndex = parseInt(srcElm.attr('data-step'));

                if (!isNaN(stepIndex) && stepIndex < steps.length) {
                    var step = steps[stepIndex];
                    if (step.callback) {
                        step.callback.call(null);
                    }
                }
            });

            scope.$watch('path', function(newValue) {
                onModelUpdate(newValue);
            }, true);
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Button', ['ngMaterial'])

.directive('luiButton', ['$mdInkRipple', function ($mdInkRipple) {
    function isAnchor(attr) {
        return ['href', 'ngHref', 'ngLink', 'uiSref'].some(function (name) { return angular.isDefined(attr[name]); });
    }

    function getTemplate(element, attr) {
        if (isAnchor(attr)) {
            return '<a class="lui-button" ng-transclude></a>';
        } else {
            //If buttons don't have type="button", they will submit forms automatically.
            var btnType = (typeof attr.type === 'undefined') ? 'button' : attr.type;
            return '<button class="lui-button" type="' + btnType + '" ng-transclude></button>';
        }
    }

    return {
        priority: 1,
        scope: false,
        restrict: 'EA',
        template: getTemplate,
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs) {
            $mdInkRipple.attach(scope, iElm, {
                isMenuItem: false,
                dimBackground: true
            });

            // For anchor elements, we have to set tabindex manually when the
            // element is disabled
            if (isAnchor(iAttrs) && angular.isDefined(iAttrs.ngDisabled)) {
                scope.$watch(iAttrs.ngDisabled, function(isDisabled) {
                    iElm.attr('tabindex', isDisabled ? -1 : 0);
                });
            }

            // disabling click event when disabled is true
            iElm.on('click', function (evt) {
                if (iAttrs.disabled === true) {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                }
            });

            if (!iElm.hasClass('lui-no-focus')) {
                iElm.on('focus', function () {
                    iElm.addClass('lui-focused');
                });

                iElm.on('blur', function () {
                    iElm.removeClass('lui-focused');
                });
            }
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.ContextMenu', ['LINDGE-Service'])

.service('$luiContextMenu', ['$SDK', 'EventEmitter', function ($SDK, EventEmitter) {
    function setPositionStyle (elm) {
        var position = window.getComputedStyle(elm)['position'];
        if (position == 'static' || position ==='') {
            elm.style.position = 'relative';
        }
    }

    function computeOffsetXY (src, target) {
        if (src === target) {
            return [0, 0];
        } else if (target === window.document.body) {
            var bound = src.getBoundingClientRect();
            return [bound.left, bound.top];
        } else {
            return $SDK.DOM.getElementXYCoord(src, target);
        }
    }

    function getBoundingInfo (elm) {
        return elm.getBoundingClientRect();
    }

    var menuTpl = angular.element('<div class="lui-context-menu" style="display:none;position:absolute;left:0;top:0;z-index:20"></div>');
    var separatorTpl = angular.element('<div class="lui-menu-sep"></div>');
    var menuItemTpl = angular.element('<div class="lui-menu-item"></div>');

    function createSeparator () {
        return separatorTpl.clone();
    }

    function createMenu () {
        var elm = menuTpl.clone();
        elm.bind('contextmenu', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

        elm.bind('mousedown', function (e) { e.stopPropagation(); });

        return elm;
    }

    function createMenuItem (name, title) {
        var item = menuItemTpl.clone();
        item.attr('name', name)
            .attr('title', title)
            .text(title);
        return item;
    }


    var MENU_ITEM_TYPES = {
        NORMAL: 0x01,
        SEPARATOR: 0x02,
        SUBMENU: 0x03       // TBF
    };

    /**
     * Base class for menu item
     */
    function MenuItemBase (parent) {
        if (!(parent instanceof ContextMenu)) {
            throw new TypeError('invalid parent');
        }

        this.name = '';
        this.label = '';
        this.enabled = true;
        this.type = MENU_ITEM_TYPES.NORMAL;

        this._parent = parent;
        this._handler = null;
        this._element = null;
    }

    MenuItemBase.prototype.getElement = function() {
        return this._element;
    };

    MenuItemBase.prototype.disable = function() {
        this.enabled = false;
    };

    MenuItemBase.prototype.enable = function() {
        this.enabled = true;
    };

    /**
     * normal context menu item
     * 
     * @param {Object} config
     * {
     *   name
     *   label
     *   handler
     * }
     */
    function ContextMenuItem (parent, config) {
        MenuItemBase.call(this, parent);
        this.type = MENU_ITEM_TYPES.NORMAL;
        this.init(config);
    }

    $SDK.Lang.inherits(ContextMenuItem, MenuItemBase);

    ContextMenuItem.prototype.init = function(config) {
        if (angular.isObject(config)) {
            var name = config['name'];
            if (typeof name == 'string' && name.length > 0) {
                this.name = name;
            }

            var label = config['label'];
            if (typeof label == 'string' && label.length > 0) {
                this.label = label;
            }

            if (this.name && this.label) {
                if (angular.isFunction(config['handler'])) {
                    this._handler = config['handler'];
                }

                this._initElement();
            }
        } else {
            throw new TypeError('Initiate config must be object');
        }
    };

    ContextMenuItem.prototype._initElement = function() {
        var elm = createMenuItem(this.name, this.label);
        var evtHandler = this._execute.bind(this);

        elm[0].addEventListener('click', evtHandler);
        this._element = elm;
    };

    ContextMenuItem.prototype._execute = function(evt) {
        var handler = this._handler;
        var param = this._parent.getCurrentParam();
        if (handler && this.enabled) {
            if (param !== void(0) && handler.length > 1) {
                handler(evt, param);
            } else {
                handler(evt);
            }
        }
    };

    ContextMenuItem.prototype.disable = function() {
        if (this._element) {
            this.enabled = false;
            this._element
                .attr('disabled', '')
                .addClass('disabled');
        }
    };

    ContextMenuItem.prototype.enable = function() {
        if (this._element) {
            this.enabled = true;
            this._element
                .removeAttr('disabled')
                .removeClass('disabled');
        }
    };

    ContextMenuItem.prototype.setLabel = function(label) {
        label = String(label);
        if (this._element) {
            this._element.text(label).attr('title', label);
        }

        return this;
    };


    /**
     * menu separator
     */
    function ContextMenuSeparator (parent) {
        MenuItemBase.call(this, parent);
        this.type = MENU_ITEM_TYPES.SEPARATOR;
        this._element = createSeparator();
    }

    $SDK.Lang.inherits(ContextMenuSeparator, MenuItemBase);

    ContextMenuSeparator.prototype.disable = function() {
        return;
    };

    ContextMenuSeparator.prototype.enable = function() {
        return;
    };


    /**
     * context menu event names
     */
    var CONTEXT_MENU_EVENTS = {
        SHOW: 'show',
        HIDE: 'hide'
    };

    /**
     * context menu service
     * 
     * @param {Element} container  menu container, default document.body
     * @param {Object=} config
     */
    function ContextMenu (container, config) {
        EventEmitter.call(this);

        if (container && container !== window.document.body) {
            setPositionStyle(container);
            this._container = angular.element(container);
        } else {
            this._container = angular.element(window.document.body);
        }

        this._globalHandler = (function () {
            this.hide();
        }).bind(this);

        this._element = createMenu();
        this._menuItems = [];
        this._menuItemMapping = {};

        this._linked = false;
        this._isShown = false;
        this._currentParams = [];

        var defaultConfig = {
            'addClass': []
        };

        angular.extend(defaultConfig, config);
        this._init(defaultConfig);
    }

    $SDK.Lang.inherits(ContextMenu, EventEmitter);

    ContextMenu.prototype._init = function(config) {
        var menuElm = this._element;
        config['addClass'].forEach(function (cls) {
            menuElm.addClass(cls);
        });

        this._element[0].addEventListener('click', function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        });

        window.document.addEventListener('mousedown', this._globalHandler);
    };

    ContextMenu.prototype.addMenuItem = function(config) {
        var menuItem = new ContextMenuItem(this, config);
        this._element.append(menuItem.getElement());
        this._menuItems.push(menuItem);
        this._menuItemMapping[menuItem.name] = menuItem;
        return this;
    };

    ContextMenu.prototype.getItem = function(name) {
        return this._menuItemMapping[name] || null;
    };

    ContextMenu.prototype.addSeparator = function() {
        var separator = new ContextMenuSeparator(this);
        this._element.append(separator.getElement());
        this._menuItems.push(separator);
        return this;
    };

    ContextMenu.prototype._getContainerSize = function() {
        var container = this._container[0];
        var boundingInfo = getBoundingInfo(container);
        return [boundingInfo['width'], boundingInfo['height']];
    };

    ContextMenu.prototype.show = function(evt, param) {
        if (!this._isShown) {
            var container = this._container[0];
            if (!this._linked) {
                this._container.append(this._element);
                this._linked = true;
            }

            if (arguments.length > 1) {
                this._currentParams.push(param);
            }

            evt.stopPropagation();

            var srcElm = evt.srcElement;
            if (srcElm === container ||
                $SDK.DOM.contains(this._container[0], srcElm)) {
                var coords = computeOffsetXY(srcElm, container);
                var posX = coords[0] + evt.offsetX, posY = coords[1] + evt.offsetY;

                this._element.css('display', 'block');
                this._isShown = true;

                var boundingInfo = getBoundingInfo(this._element[0]);
                var menuWidth = boundingInfo['width'], menuHeight = boundingInfo['height'];

                var containerSize = this._getContainerSize();
                var containerWidth = containerSize[0], containerHeight = containerSize[1];

                if ((posX + menuWidth) > containerWidth) {
                    posX = posX - menuWidth;
                    if (posX < container.scrollLeft) {
                        posX = container.scrollLeft;
                    }
                }

                if ((posY + menuHeight) > containerHeight) {
                    posY = posY - menuHeight;
                    if (posY < container.scrollTop) {
                        posY = container.scrollTop;
                    }
                }

                this._element.css({
                    'left': posX + 'px',
                    'top': posY + 'px'
                });

                this._dispatchEvent(CONTEXT_MENU_EVENTS.SHOW);
            }
        }
    };

    ContextMenu.prototype.isShown = function() {
        return this._isShown;
    };

    ContextMenu.prototype.hide = function() {
        if (this._isShown) {
            this._element.css('display', 'none');
            this._isShown = false;
            this._currentParams.length = 0;

            this._dispatchEvent(CONTEXT_MENU_EVENTS.HIDE);
        }
    };

    ContextMenu.prototype.dispose = function() {
        this._element.remove();
        this._element = null;
        this._container = null;
        this._menuItems.length = 0;
        this._menuItemMapping = null;

        var handler = this._globalHandler;
        window.document.removeEventListener('click', handler);
    };

    ContextMenu.prototype.getCurrentParam = function() {
        if (this._currentParams.length > 0) {
            return this._currentParams[0];
        } else {
            return void(0);
        }
    };


    return {
        ContextMenu: ContextMenu
    };
}]);
angular.module('LINDGE.UI-Standard.Control.DatePicker', [])

.config(['$mdDateLocaleProvider', function ($mdDateLocaleProvider) {
    var monthNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    var weekDatNumbers = ['日', '一', '二', '三', '四', '五', '六'];

    var weekUnit = '周';
    var monthUnit = '月';
    var yearUnit = '年';

    $mdDateLocaleProvider.firstDayOfWeek = 1;

    $mdDateLocaleProvider.months = monthNumbers.map(function (m) { return m + monthUnit; });
    $mdDateLocaleProvider.shortMonths = monthNumbers.map(function (m) { return m + monthUnit; });
    $mdDateLocaleProvider.days = weekDatNumbers.map(function (d) { return weekUnit + d; });
    $mdDateLocaleProvider.shortDays = $mdDateLocaleProvider.days;

    $mdDateLocaleProvider.monthHeaderFormatter = function(date) {
        return [date.getFullYear(), yearUnit, ' ', monthNumbers[date.getMonth()], monthUnit].join('');
    };

    $mdDateLocaleProvider.weekNumberFormatter = function(weekNumber) {
        return weekDatNumbers[weekNumber];
    };
}])

.controller('$luiDatepickerPopupCtrl', ['mdPanelRef', 'dateInfo', 'handle', function (panelRef, dateInfo, handle) {
    this.date = dateInfo.date;
    this.minDate = dateInfo.minDate;
    this.maxDate = dateInfo.maxDate;
    this.mode = '';

    var thisCtrl = this;

    this.onChange = function () {
        panelRef.close();
        handle(this.date);
    };
}])

.directive('luiDatepicker', ['$mdPanel', '$filter', function ($mdPanel, $filter) {
    var dateFilter = $filter('date');
    var disableCls = 'disabled';

    return {
        priority: 1,
        scope: {
            minDate: '=',
            maxDate: '=',
            placeholder: '@',
            disableOutRange: '=',
            ngDisabled: '='
        },
        // controller: function($scope, $element, $attrs, $transclude) {},
        require: ['?ngModel', '^?form'],
        restrict: 'EA',
        templateUrl: 'lui-tpl/DatePicker/datepicker.tmpl.html',
        replace: false,
        link: function(scope, iElm, iAttrs, ctrls) {
            var ngModelCtrl = ctrls[0];
            var formCtrl = ctrls[1];

            var input = iElm.find('input');

            scope.dateText = '';
            var isCalendarOpen = false;
            var disabled = false;

            /* -------------------- date utils -------------------- */
            function isValidDate(date) {
                return date instanceof Date;
            }

            function normalizeDate(date) {
                if (isValidDate(date)) {
                    return date;
                } else {
                    return null;
                }
            }

            function getDate() {
                var date = ngModelCtrl.$viewValue;
                if (isValidDate(date)) {
                    return new Date(date);
                } else {
                    return new Date();
                }
            }

            function toDateText(date) {
                return dateFilter(date, 'yyyy-MM-dd');
            }

            function toUTCDate(date) {
                var utc = Date.UTC(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    date.getHours(),
                    date.getMinutes(),
                    date.getDay()
                );

                return new Date(utc);
            }

            /* -------------------- ngModel state control -------------------- */

            function updateModelState() {
                var currentDate = ngModelCtrl.$viewValue;
                if (iAttrs.required) {
                    ngModelCtrl.$setValidity('required', isValidDate(currentDate));
                }

                var isValidRange = true;
                if (isValidDate(scope.minDate)) {
                    isValidRange = scope.minDate <= currentDate;
                }

                if (isValidRange && isValidDate(scope.maxDate)) {
                    isValidRange = scope.maxDate >= currentDate;
                }

                ngModelCtrl.$setValidity('date-range', isValidRange);
            }

            /* -------------------- popup -------------------- */

            function showCalendar() {
                var panelPosition = $mdPanel.newPanelPosition()
                      .relativeTo(iElm)
                      .addPanelPosition($mdPanel.xPosition.ALIGN_START, $mdPanel.yPosition.BELOW);

                var animationAnchor = iElm[0].querySelector('.datepicker-icon');
                var panelAnimation = $mdPanel.newPanelAnimation()
                    .openFrom(animationAnchor)
                    .closeTo(animationAnchor)
                    .duration(200)
                    .withAnimation($mdPanel.animation.FADE);

                var config = {
                    attachTo: angular.element(document.body),
                    controller: '$luiDatepickerPopupCtrl',
                    controllerAs: 'ctrl',
                    position: panelPosition,
                    animation: panelAnimation,
                    templateUrl: 'lui-tpl/DatePicker/datepicker-popup.tmpl.html',
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: true,
                    zIndex: 1052,
                    panelClass: 'lui-control-popup-container',
                    onCloseSuccess: function () {
                        isCalendarOpen = false;
                        input.removeClass('lui-focused');
                    },
                    locals: {
                        dateInfo: {
                            date: getDate(),
                            minDate: scope.disableOutRange ? normalizeDate(scope.minDate) : null,
                            maxDate: scope.disableOutRange ? normalizeDate(scope.maxDate) : null
                        },
                        handle: function (newDate) {
                            ngModelCtrl.$setViewValue(toUTCDate(newDate));
                            updateModelState();
                            scope.dateText = toDateText(newDate);
                        }
                    }
                };

                input.addClass('lui-focused');
                isCalendarOpen = true;

                $mdPanel.open(config);
            }

            /* -------------------- events -------------------- */

            ngModelCtrl.$render = function () {
                var date = ngModelCtrl.$viewValue;
                if (date instanceof Date) {
                    scope.dateText = toDateText(date);
                } else {
                    scope.dateText = '';
                }

                if (formCtrl) {
                    updateModelState();
                }
            };

            if (formCtrl) {
                scope.$watch('minDate', function () {
                    updateModelState();
                });

                scope.$watch('maxDate', function () {
                    updateModelState();
                });
            }

            scope.$watch('ngDisabled', function (newValue) {
                disabled = !!newValue;
                if (disabled) {
                    iElm.addClass(disableCls);
                } else {
                    iElm.removeClass(disableCls);
                }
            });

            input.bind('focus', function () {
                if (!disabled) {
                    showCalendar();
                    ngModelCtrl.$setTouched();
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Dialog', ['LINDGE-UI-Core'])

.config(['$luiDialogProvider', function ($luiDialogProvider) {
    var confirmTemplate = `
        <div class="lui-dialog-standard" role="dialog" layout="column">
            <div flex="nogrow" class="lui-dialog-header" layout="row" layout-align="space-between center">
                <div class="lui-dialog-title">
                    <span class="message-type-icon" ng-show="ctrl.setting.typeIcon">
                        <i ng-class="ctrl.setting.typeIcon"></i>
                    </span>
                    <span ng-bind="ctrl.setting.title"></span>
                </div>
            </div>
            <div flex="auto" class="lui-dialog-body layout-column layout-align-center-start">
                <span ng-bind="ctrl.setting.textContent" ng-show="ctrl.setting.textContent"></span>
                <div bind-styled-html="ctrl.setting.styledContent" ng-show="ctrl.setting.styledContent"></div>
            </div>
            <div class="lui-dialog-actions" layout="row">
                <span class="flex-auto"></span>
                <div class="lui-button-list">
                    <lui-button class="color-primary" ng-click="ctrl.cancel()" ng-bind="ctrl.setting.cancelLabel" aria-label="cancel"></lui-button>
                    <lui-button class="color-primary lui-primary" ng-click="ctrl.confirm()" ng-bind="ctrl.setting.confirmLabel" aria-label="confirm"></lui-button>
                </div>
            </div>
        </div>`;

    var alertTemplate = `
        <div class="lui-dialog-standard" role="dialog" layout="column">
            <div flex="nogrow" class="lui-dialog-header" layout="row" layout-align="space-between center">
                <div class="lui-dialog-title">
                    <span class="message-type-icon" ng-show="ctrl.setting.typeIcon">
                        <i ng-class="ctrl.setting.typeIcon"></i>
                    </span>
                    <span ng-bind="ctrl.setting.title"></span>
                </div>
            </div>
            <div flex="auto" class="lui-dialog-body layout-column layout-align-center-start">
                <span ng-bind="ctrl.setting.textContent" ng-show="ctrl.setting.textContent"></span>
                <div bind-styled-html="ctrl.setting.styledContent" ng-show="ctrl.setting.styledContent"></div>
            </div>
            <div class="lui-dialog-actions" layout="row">
                <span class="flex-auto"></span>
                <div class="lui-button-list">
                    <lui-button class="color-primary lui-primary" ng-click="ctrl.confirm()" ng-bind="ctrl.setting.confirmLabel" aria-label="confirm"></lui-button>
                </div>
            </div>
        </div>`;

    var buttonDialogTemplate = `
        <div class="lui-dialog-standard" role="dialog" layout="column">
            <div class="lui-dialog-header" flex="nogrow" layout="row" layout-align="space-between center">
                <div class="lui-dialog-title">
                    <span class="message-type-icon" ng-show="ctrl.setting.typeIcon">
                        <i ng-class="ctrl.setting.typeIcon"></i>
                    </span>
                    <span ng-bind="ctrl.setting.title"></span>
                </div>
            </div>
            <div flex="auto" class="lui-dialog-body layout-column layout-align-center-start">
                <span ng-bind="ctrl.setting.textContent" ng-show="ctrl.setting.textContent"></span>
                <div bind-styled-html="ctrl.setting.styledContent" ng-show="ctrl.setting.styledContent"></div>
            </div>
            <div class="lui-dialog-actions" layout="row">
                <span class="flex-auto"></span>
                <div class="lui-button-list">
                    <lui-button role="{{btn.role}}" ng-repeat="btn in ctrl.buttons" ng-click="ctrl.onButtonClick(btn.index)" ng-class="btn.class" aria-label="button">{{btn.label}}</lui-button>
                </div>
            </div>
        </div>`;

    var inputDialogTemplate = `
        <div class="lui-dialog-standard size-large" role="dialog" layout="column">
            <div class="lui-dialog-header" flex="nogrow" layout="row" layout-align="space-between center">
                <div class="lui-dialog-title">
                    <span class="message-type-icon" ng-show="ctrl.setting.typeIcon">
                        <i ng-class="ctrl.setting.typeIcon"></i>
                    </span>
                    <span ng-bind="ctrl.setting.title"></span>
                </div>
            </div>
            <div flex="auto" class="lui-dialog-body layout-column layout-align-center-start">
                <div class="lui-dialog-prompt" ng-bind="ctrl.setting.textContent" ng-show="ctrl.setting.textContent"></div>
                <div class="lui-dialog-prompt" bind-styled-html="ctrl.setting.styledContent" ng-show="ctrl.setting.styledContent"></div>

                <form class="lui-form-container" name="inputDialogForm">
                    <lui-form-group>
                        <label class="lui-form-header" ng-if="ctrl.setting.inputLabel" ng-bind="ctrl.setting.inputLabel"></label>
                        <div class="lui-form-body" ng-class="{full:!ctrl.setting.inputLabel}">
                            <input class="lui-form-control" ng-required="ctrl.validation.required" type="text" name="value"
                                   ng-model="ctrl.input.value" placeholder="{{ctrl.setting.placeholder}}" ng-keydown="ctrl.confirmKey($event)" />

                            <div class="ng-hide" ng-messages="inputDialogForm.value.$error"
                                 ng-show="inputDialogForm.value.$touched&&inputDialogForm.value.$error.required">
                                <div ng-message="required">{{ctrl.validation.required.message}}</div>
                            </div>
                        </div>
                    </lui-form-group>
                </form>
            </div>
            <div class="lui-dialog-actions" layout="row">
                <span class="flex-auto"></span>
                <div class="lui-button-list">
                    <lui-button class="color-primary" ng-click="ctrl.cancel()" ng-bind="ctrl.setting.cancelLabel" aria-label="cancel"></lui-button>
                    <lui-button class="color-primary lui-primary" ng-click="ctrl.confirm()" ng-bind="ctrl.setting.confirmLabel" aria-label="confirm"></lui-button>
                </div>
            </div>
        </div>`;

    $luiDialogProvider.configConfirmDialog(confirmTemplate);
    $luiDialogProvider.configAlertDialog(alertTemplate);
    $luiDialogProvider.configButtonDialog(buttonDialogTemplate, function (btn) {
        if (btn.role == 'cancel') {
            btn.class += ' color-primary';
        }

        return btn;
    });
    $luiDialogProvider.configInputDialog(inputDialogTemplate);
}]);
angular.module('LINDGE.UI-Standard.Control.FileDropper', [])

.directive('luiFileDropper', ['$luiDragdrop', function ($luiDragdrop) {
    var droppingCls = 'lui-dropping';

    return {
        priority: 1,
        scope: {
            onDrop: '=',
            ngDisabled: '='
        },
        restrict: 'E',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            if (angular.isDefined(iAttrs.ngClick)) {
                iElm.addClass('clickable');
            }

            var dropZone = angular.element('<div class="drop-zone">');
            iElm.append(dropZone);

            $luiDragdrop.configDropZone(dropZone[0], {
                canDrop: function () {
                    return !scope.ngDisabled;
                },
                onDropBegin: function () {
                    iElm.addClass(droppingCls);
                },
                onDropEnd: function () {
                    iElm.removeClass(droppingCls);
                },
                onDrop: function (evt) {
                    if (angular.isFunction(scope.onDrop)) {
                        scope.onDrop($luiDragdrop.extractDropFiles(evt));
                    }
                }
            });

            scope.$watch('ngDisabled', function(newValue) {
                iElm.attr('disabled', !!newValue);
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.FloatToobar', [])

.directive('luiFloatToolbar', [function () {
    var template = '<div class="lui-float-toolbar" ng-transclude></div>';
    var toolbarHideCls = 'offscreen';

    return {
        priority: 1,
        scope: {
            layoutModify: '=',
            hide: '='
        },
        restrict: 'E',
        template: template,
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs) {
            if (!!scope.layoutModify || angular.isUndefined(iAttrs['layoutModify'])) {
                var parentNode = iElm.parent()[0];
                if (parentNode) {
                    var paddingBottom = window.getComputedStyle(parentNode).paddingBottom;
                    var bottomValue = parseFloat(paddingBottom);

                    var toolbarHeight = parseFloat(window.getComputedStyle(iElm[0]).height);

                    var newBottomValue = bottomValue + toolbarHeight;
                    parentNode.style.paddingBottom = (newBottomValue + 'px');
                }
            }

            var position = iAttrs['position'];
            if (position == 'local') {
                iElm.parent().css({
                    'position': 'absolute',
                    'overflow': 'hidden'
                });

                iElm.css('position', 'absolute');
            } else if (position == 'global' || angular.isUndefined(position)) {
                iElm.addClass('position-global');
            }

            scope.$watch('hide', function(newValue) {
                if (!!newValue) {
                    iElm.addClass(toolbarHideCls);
                } else {
                    iElm.removeClass(toolbarHideCls);
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Form', ['LINDGE-Service'])

.service('$$luiFormUtils', ['$SDK', function ($SDK) {
    var userInputElms = ['INPUT', 'TEXTAREA', 'MD-SELECT'];

    function isUserInputControl(elm) {
        return userInputElms.indexOf(elm.tagName) >= 0;
    }

    function filterUserInputs(root, callback) {
        $SDK.DOM.walkDOM([root], function (node) {
            if (isUserInputControl(node)) {
                callback(angular.element(node));
                return true;
            } else {
                return true;
            }
        }, 2);
    }

    this.filterUserInputs = filterUserInputs;
}])

.controller('$luiFormCtrl', ['$scope', function ($scope) {
    var formGroups = [];

    this.registerFromGroup = function (ctrl) {
        formGroups.push(ctrl);
    };

    this.setDisabled = function (disabled) {
        formGroups.forEach(function (ctrl) {
            if (!ctrl.disableWatcherDefined) {
                ctrl.setDisabled(disabled);
            }
        });
    };
}])

.directive('luiForm', ['$parse', function ($parse) {
    return {
        priority: 1,
        scope: false,
        controller: '$luiFormCtrl',
        restrict: 'A',
        replace: false,
        link: function(scope, iElm, iAttrs, ctrl) {
            if (!ctrl) {
                return;
            }

            if (iElm[0].tagName != 'FORM') {
                return;
            }

            if (angular.isDefined(iAttrs['ngDisabled'])) {
                var getter = $parse(iAttrs['ngDisabled']);
                scope.$watch(getter, function (newValue) {
                    ctrl.setDisabled(!!newValue);
                });
            }
        }
    };
}])

.controller('$luiFormGroupCtrl', ['$scope', '$element', '$attrs', '$animate', '$$luiFormUtils',
function ($scope, $element, $attrs, $animate, $$luiFormUtils) {
    this.required = angular.isDefined($attrs['required']);
    this.disableWatcherDefined = angular.isDefined($attrs['ngDisabled']);

    function makeDisabled(elem) {
        elem.attr('disabled', true);
    }

    function makeEnabled(elem) {
        elem.attr('disabled', false);
    }

    this.setDisabled = function (disabled) {
        var bodyElm = $element[0].querySelector('.lui-form-body');
        if (bodyElm) {
            var modifier = disabled ? makeDisabled : makeEnabled;
            $$luiFormUtils.filterUserInputs(bodyElm, function (elem) {
                if (!angular.isDefined(elem.attr('ng-disabled'))) {
                    modifier(elem);
                }
            });
        }
    };
}])

.directive('luiFormGroup', ['$SDK', '$parse', '$$luiFormUtils', function ($SDK, $parse, $$luiFormUtils) {
    return {
        priority: 1,
        scope: false,
        controller: '$luiFormGroupCtrl',
        require: ['luiFormGroup', '^?luiForm'],
        restrict: 'EA',
        replace: false,
        compile: function (tElement, tAttr) {
            if (angular.isDefined(tAttr['required'])) {
                var bodyElm = tElement[0].querySelector('.lui-form-body');
                if (bodyElm) {
                    $$luiFormUtils.filterUserInputs(bodyElm, function (elem) {
                        elem.attr('required', true);
                    });
                }
            }

            function postlink(scope, iElm, iAttrs, ctrls) {
                var thisCtrl = ctrls[0];
                var formCtrl = ctrls[1];

                iElm.addClass('lui-form-group');

                function makeRequired(elem) {
                    elem.addClass('lui-required');
                }

                var labelElm = iElm[0].querySelector('label');
                if (labelElm && thisCtrl.required) {
                    makeRequired(angular.element(labelElm));
                }

                if (thisCtrl.disableWatcherDefined) {
                    var getter = $parse(tAttr['ngDisabled']);
                    scope.$watch(getter, function (newValue) {
                        thisCtrl.setDisabled(!!newValue);
                    });
                }

                if (formCtrl) {
                    formCtrl.registerFromGroup(thisCtrl);
                }
            }

            return postlink;
        }
    };
}]);
(function ()
{

'use strict';

angular.module('LINDGE.UI-Standard.Control.Message', [])

.directive('ngMessages', [function () {
    var visibilityDirectives = ['ngIf', 'ngShow', 'ngHide', 'ngSwitchWhen', 'ngSwitchDefault'];

    return {
        priority: 1,
        scope: false,
        require: '^^?luiFormGroup',
        restrict: 'EA',
        replace: false,
        link: function(scope, iElm, iAttrs, inputCtrl) {
            if (!inputCtrl) {
                return;
            }

            iElm.toggleClass('lui-form-message-animation', true);
        }
    };
}])

.directive('ngMessage', [function () {
    return {
        priority: 100,
        scope: false,
        restrict: 'EA',
        replace: false,
        compile: function(tElement) {
            tElement.toggleClass('lui-form-message-animation-holder', true);
            /*return function (scope, iElm) {
                iElm.toggleClass('lui-form-message-animation-holder', true);
            }*/
        }
    };
}]);

}());
angular.module('LINDGE.UI-Standard.Control.NumberFlipper', [])

.directive('numberFlipper', ['$filter', function ($filter) {
    var numberFilter = $filter('number');

    var defaultInterval = 5;
    var defaultDuration = 1500;     // ms

    function link($scope, $element, $attrs) {
        // 刷新时间间隔
        var refreshInterval = defaultInterval;
        // 总时长
        var duration = defaultDuration;

        var refreshHandle = null;
        var current = 0;
        var converter = null;

        function showNumber(number) {
            var output;
            if (converter) {
                output = converter(number);
            } else {
                output = numberFilter(number, 0);
            }

            $element.text(output);
        }

        function updateNumber(start, end, enforceDuration) {
            refreshInterval = defaultInterval;
            showNumber(start);

            current = start;
            var offset = end - start;
            var totalSteps = duration / refreshInterval;

            var step;
            if (offset > totalSteps) {
                step = Math.round(offset / totalSteps);
            } else {
                if (enforceDuration) {
                    refreshInterval = Math.round(duration / offset);
                }

                step = 1;
            }

            function update() {
                current += step;
                current = Math.min(current, end);
                showNumber(current);

                if (current < end) {
                    refreshHandle = setTimeout(update, refreshInterval);
                }
            }

            update();
        }

        function clearAnimation() {
            if (refreshHandle) {
                clearTimeout(refreshHandle);
                refreshHandle = null;
            }
        }

        $scope.$watch('numberFlipper', function (newValue) {
            newValue = Number(newValue);
            var enforceDuration = angular.isDefined($attrs.enforceDuration);

            if (!isNaN(newValue)) {
                clearAnimation();

                if (enforceDuration) {
                    current = 0;
                }

                if (current < newValue) {
                    updateNumber(current, newValue, enforceDuration);
                } else {
                    current = newValue;
                    showNumber(current);
                }
            }
        });

        $scope.$watch('converter', function (newValue) {
            converter = (typeof newValue == 'function') ? newValue : null;
            showNumber(current);
        });

        $scope.$on('$destroy', clearAnimation);
    }

    return {
        priority: 1,
        scope: {
            numberFlipper: '=',
            converter: '='
        },
        restrict: 'A',
        link: link
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Pagination', [])

.directive('luiPagination', ['$SDK', function ($SDK) {
    return {
        priority: 1,
        scope: {
            totalCount: '=',
            steps: '=',
            increment: '=',
            ngChange: '&',
            uiInfotag: '@'
        },
        require: 'ngModel',
        restrict: 'EA',
        templateUrl: 'lui-tpl/Pagination/pagination.tmpl.html',
        replace: false,
        link: function(scope, iElm, iAttrs, ngModel) {
            if (!ngModel) {
                return;
            }

            function isOptionOn(attr) {
                var value = iAttrs[attr];
                return value === '1' || value === 'true' || value == 'on';
            }

            scope.controls = {
                increment: !angular.isDefined(iAttrs['uiIncrement']) || isOptionOn('uiIncrement'),
                fastjump: isOptionOn('uiFastjump'),
                infotag: ''
            };

            scope.$watch('uiInfotag', function (newValue) {
                scope.controls.infotag = newValue;
            });

            var currentPage = 1;
            var increment = scope.increment || 1;

            scope.pageArray = [];
            scope.jumpPage = 1;
            scope.hasLeft = true;
            scope.hasRight = true;
            
            function createPage (page) {
                return {
                    title: String(page),
                    number: page,
                    active: page === currentPage
                };
            }

            function updatePageArray () {
                if (!scope.totalCount) {
                    scope.pageArray.length = 0;
                    return;
                }

                var total = scope.totalCount;
                var steps = scope.steps;
                if (steps > total) {
                    steps = total;
                }

                var halfStep = Math.ceil(steps / 2);

                var start, end;
                if (currentPage <= halfStep) {
                    start = 1;
                } else if ((currentPage + halfStep) > total) {
                    start = total - steps + 1;
                } else {
                    start = currentPage - halfStep + 1;
                }

                end = start + steps;

                // scope.hasLeft = start > 1;
                // scope.hasRight = end <= total;

                var arr = scope.pageArray;
                arr.length = 0;

                while (start < end) {
                    var page = createPage(start);
                    arr.push(page);
                    start++;
                }
            }

            function updateControlStates() {
                scope.hasLeft = currentPage > 1;
                scope.hasRight = currentPage < scope.totalCount;
            }

            function setPage (page) {
                if (page < 1) {
                    page = 1;
                } else if (page > scope.totalCount) {
                    page = scope.totalCount;
                }

                if (!page) {
                    page = 1;
                }

                if (page !== currentPage) {
                    ngModel.$setViewValue(page);
                    // scope.$evalAsync(function () {
                    //     scope.ngChange();
                    // });

                    currentPage = page;
                    scope.jumpPage = page;
                    updatePageArray();
                    updateControlStates();
                }

                return page;
            }

            ngModel.$render = function () {
                var oldPage = currentPage;
                var newPage = setPage(ngModel.$viewValue || 1);
                if (oldPage !== newPage) {
                    scope.ngChange();
                    updatePageArray();
                }
                updateControlStates();
            };

            scope.goLeft = function () {
                setPage(currentPage - increment);
            };

            scope.goRight = function () {
                setPage(currentPage + increment);
            };

            scope.gotoPage = function (page) {
                setPage(page.number);
            };

            scope.onFastJump = function (evt) {
                if (evt instanceof window.KeyboardEvent && evt.keyCode !== 13) {
                    return;
                }

                var page = parseInt(scope.jumpPage);
                if (!isNaN(page) && page >= 1) {
                    setPage(page);
                } else {
                    scope.jumpPage = currentPage;
                }
            };

            scope.onFastJumperFocus = function (evt) {
                var input = iElm[0].querySelector('.fastjumper input');
                if (input !== null) {
                    input.select();
                }
            };

            scope.getInfo = function () {
                if (scope.controls.infotag) {
                    return $SDK.Lang.formatStringByMap(scope.controls.infotag, { total: String(scope.totalCount || 0) });
                } else {
                    return '';
                }
            };

            scope.$watchGroup(['totalCount', 'steps'], updatePageArray);
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Popover', ['LINDGE-UI-Core'])

.config(['$luiPopoverProvider', function ($luiPopoverProvider) {
    var POSITION = $luiPopoverProvider.POSITION;
    var ALIGNMENT = $luiPopoverProvider.ALIGNMENT;

    var arrowHeight = 8;
    var arrowOffset = 2;

    function generateCSSRule(value) {
        return value >= 0 ? value + 'px' : '';
    }

    var panelFactory = {
        createPanel: function (wrapper, wrapperPos, config) {
            var popover = angular.element('<div class="lui-popover">');
            var arrow = angular.element('<div class="lui-popover-arrow">');

            switch (wrapperPos.position) {
                case POSITION.TOP:
                    popover.css({
                        marginBottom: arrowHeight + 'px',
                        maxWidth: generateCSSRule(wrapperPos.maxWidth),
                        maxHeight: generateCSSRule(wrapperPos.maxHeight)
                    });

                    arrow.addClass('point-bottom');
                    arrow.css({
                        bottom: generateCSSRule(arrowOffset)
                    });
                    break;
                case POSITION.BOTTOM:
                    popover.css({
                        marginTop: arrowHeight + 'px',
                        maxWidth: generateCSSRule(wrapperPos.maxWidth),
                        maxHeight: generateCSSRule(wrapperPos.maxHeight)
                    });
                    arrow.css({
                        top: generateCSSRule(arrowOffset)
                    });
                    break;
                default:
                    // TBF
                    break;
            }

            if (wrapperPos.alignment === ALIGNMENT.LEFT) {
                arrow.css({
                    left: generateCSSRule(Math.max(3, wrapperPos.pointerRange.left + 3))
                });
            } else if (wrapperPos.alignment === ALIGNMENT.RIGHT) {
                arrow.css({
                    right: generateCSSRule(Math.max(3, wrapperPos.pointerRange.right + 3))
                });
            }

            wrapper.append(popover);
            wrapper.append(arrow);

            return popover;
        }
    };

    $luiPopoverProvider.registerTemplate('standard', panelFactory, true);
}]);
angular.module('LINDGE.UI-Standard.Control.RichTextEdit', ['LINDGE-Service'])

.config(['$moduleManagerProvider', function ($moduleManagerProvider) {
    $moduleManagerProvider.defineModule({
        id: 'quill',
        components: [{
            id: 'quill.js',
            path: '/CDN/Quill/1.3.6/quill.min.js',
            type: $moduleManagerProvider.COMPONENT_TYPE.SCRIPT,
            scopeChecker: function () {
                return !!window.Quill;
            }
        }, {
            id: 'quill.css',
            path: '/CDN/Quill/1.3.6/quill.snow.css',
            type: $moduleManagerProvider.COMPONENT_TYPE.STYLE,
            downloadParams: {
                trivial: true
            }
        }]
    });
}])

.service('$richtextEditorConfig', ['$SDK', function ($SDK) {
    this.configQuill = function (Quill) {
        // hr button
        var Embed = Quill.import('blots/block/embed');

        class HrBlot extends Embed {
            static create(value) {
                var node = super.create(value);
                var wrapper = document.createElement('p');
                wrapper.appendChild(node);
                return wrapper;
            }
        }

        HrBlot.blotName = 'hr';
        HrBlot.tagName = 'hr';

        Quill.register({
            'formats/hr': HrBlot
        });

        // config tollbar icon
        var icons = Quill.import('ui/icons');
        icons['bold'] = '<i class="lic lic-editor-bold" aria-hidden="true"></i>';
        icons['italic'] = '<i class="lic lic-editor-italic" aria-hidden="true"></i>';
        icons['underline'] = '<i class="lic lic-editor-underline" aria-hidden="true"></i>';
        icons['strike'] = '<i class="lic lic-editor-strike" aria-hidden="true"></i>';
        icons['list']['ordered'] = '<i class="lic lic-editor-list-order" aria-hidden="true"></i>';
        icons['list']['bullet'] = '<i class="lic lic-editor-list-unorder" aria-hidden="true"></i>';
        icons['hr'] = '<i class="lic lic-editor-separator" aria-hidden="true"></i>';
        icons['image'] = '<i class="lic lic-editor-image" aria-hidden="true"></i>';
    };
}])

.factory('$richtextEditorAdaptor', [function () {
    /**
     * Quill editor adaptor
     *
     * @class      QuillAdaptor (name)
     * @param      {<type>}  editor  The editor
     */
    function QuillAdaptor(editor) {
        this._editor = editor;
    }

    QuillAdaptor.prototype.focus = function() {
        this._editor.focus();
    };

    QuillAdaptor.prototype.blur = function() {
        this._editor.blur();
    };

    return {
        QuillAdaptor: QuillAdaptor
    };
}])

.directive('luiRichtextEditor', ['$log', '$moduleManager', '$richtextEditorConfig', '$richtextEditorAdaptor', '$injector', '$filter', '$luiFileDialog',
function ($log, $moduleManager, $richtextEditorConfig, $richtextEditorAdaptor, $injector, $filter, $luiFileDialog) {
    var Quill = null;
    var quillLoadHandle = $moduleManager.loadModule('quill');

    quillLoadHandle.then(function () {
        Quill = window.Quill;
        $richtextEditorConfig.configQuill(Quill);
    });

    var QuillAdaptor = $richtextEditorAdaptor.QuillAdaptor;

    return {
        priority: 1,
        scope: {
            placeholder: '@',
            ngDisabled: '=',
            ngReadonly: '=',
            onInit: '='
        },
        require: 'ngModel',
        restrict: 'E',
        templateUrl: 'lui-tpl/RichTextEdit/richtext.tmpl.html',
        replace: false,
        link: function(scope, iElm, iAttrs, ngModelCtrl) {
            if (!ngModelCtrl) {
                return;
            }

            scope.features = {
                image: $injector.has('$fastUploader')
            };

            var editor = null;

            function canEdit() {
                return !scope.ngDisabled && !scope.ngReadonly;
            }

            function setEditorContent (editor, content) {
                var delta = editor.clipboard.convert(content || '');
                editor.setContents(delta, 'user');
            }

            function initEditor() {
                editor = new Quill(iElm[0].querySelector('.editor-container'), {
                    placeholder: scope.placeholder || '',
                    modules: {
                        toolbar: {
                            container: iElm[0].querySelector('.lui-richtext-toolbar'),
                            handlers: {
                                image: function () {
                                    $luiFileDialog.triggerGlobalInput(function (files, fileCount) {
                                        if (fileCount === 0) {
                                            return;
                                        }

                                        var $fastUploader = $injector.get('$fastUploader');
                                        var UploadingStates = $injector.get('lplUploadingStates');
                                        var fastUploaderFilter = $filter('fastUploadStreamFilter');

                                        var uploader = {
                                            fileName: '',
                                            fileSize: 0,
                                            speed: 0,
                                            timeRemain: 0,
                                            progress: 0,
                                            finishedCallback: function (state, id) {
                                                if (state == UploadingStates.completed) {
                                                    var range = editor.getSelection();
                                                    if (range) {
                                                        editor.insertEmbed(range.index, 'image', fastUploaderFilter(id));
                                                        editor.setSelection(range.index + 1, 0);
                                                    }
                                                } else {
                                                    $log.error('上传图片失败');
                                                }
                                            }
                                        };

                                        $fastUploader.upload(files[0], uploader, {
                                            root: '',
                                            encrypted: !!scope.encrypted
                                        });
                                    }, { accept: 'image/*' });
                                },
                                hr: function () {
                                    var range = editor.getSelection();
                                    if (range) {
                                        editor.insertEmbed(range.index, 'hr', 'null');
                                        editor.setSelection(range.index + 2, 0);
                                    }
                                }
                            }
                        }
                    },
                    readonly: !!iAttrs.readonly,
                    theme: 'snow'
                });

                ngModelCtrl.$render = function () {
                    setEditorContent(editor, ngModelCtrl.$viewValue);
                };

                editor.on('text-change', function () {
                    var contents = editor.root.innerHTML;
                    ngModelCtrl.$setViewValue(contents);
                });

                if (ngModelCtrl.$viewValue) {
                    setEditorContent(editor, ngModelCtrl.$viewValue);
                }

                if (iAttrs.ngDisabled) {
                    scope.$watch('ngDisabled', function (value) {
                        editor.enable(canEdit());
                        if (value) {
                            iElm.attr('disabled', true);
                        } else {
                            iElm.attr('disabled', undefined);
                        }
                    });
                }

                if (iAttrs.ngReadonly) {
                    scope.$watch('ngReadonly', function (value) {
                        editor.enable(canEdit());

                        if (value) {
                            iElm.attr('readonly', true);
                        } else {
                            iElm.attr('readonly', undefined);
                        }
                    });
                }

                if (!!scope.onInit && (typeof scope.onInit == 'function')) {
                    scope.onInit.call(null, new QuillAdaptor(editor));
                }
            }

            quillLoadHandle.then(initEditor);
        }
    };
}])

.directive('luiRichtextViewer', ['$SDK', function ($SDK) {
    var FORBID_NODES = ['SCRIPT', 'BUTTON', 'STYLE', 'SELECT', 'INPUT'];

    return {
        priority: 1,
        scope: {
            input: '='
        },
        restrict: 'E',
        // template: '',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs) {
            var wrapper = angular.element('<div>');

            function updateContent(input) {
                if (input) {
                    wrapper.html(input);
                    $SDK.DOM.walkDOM([wrapper[0]], function (node) {
                        if (node.type == 1) {
                            var elm = angular.element(node);
                            if (FORBID_NODES.indexOf(node.tagName) >= 0) {
                                elm.remove();
                                return false;
                            }

                            var hrefAttr = elm.attr('href');
                            if (hrefAttr && hrefAttr.startsWith('javascript')) {
                                elm.remove();
                                return false;
                            }

                            var attrs = elm[0].attributes;
                            var attrCount = attrs.length;
                            for (var i = 0; i < attrCount; i++) {
                                var attrInfo = attrs[i];
                                // remove native event handle codes
                                if (attrInfo.name.startsWith('on') &&
                                    HTMLElement.prototype.hasOwnProperty(attrInfo.name)) {
                                    attrInfo.value = undefined;
                                }
                            }

                            return true;
                        } else {
                            return true;
                        }
                    });

                    iElm.empty();
                    var nodes = wrapper[0].childNodes;
                    for (var i = 0; i < nodes.length; i++) {
                        iElm.append(nodes[i]);
                    }
                } else {
                    iElm.empty();
                }
            }

            scope.$watch('input', function(newValue) {
                updateContent(newValue);
            });
        }
    };
}]);

angular.module('LINDGE.UI-Standard.Control.Search', [])

.directive('luiSearchBox', ['$log', function ($log) {
    return {
        priority: 1,
        scope: {
            onSearch: '=',
            confirm: '@'
        },
        restrict: 'E',
        templateUrl: 'lui-tpl/Search/search.tmpl.html',
        replace: true,
        link: function(scope, iElm, iAttrs) {
            scope.placeholder = iAttrs['placeholder'];
            scope.showButton = (scope.confirm == 'button');

            var inputElm = iElm.children().eq(0).children().eq(1);

            scope.value = '';
            var justChange = false;

            function activeCallback() {
                if (angular.isFunction(scope.onSearch)) {
                    try {
                        scope.onSearch.call(null, scope.value);
                    } catch (err) {
                        $log.error('error occurred within search callback:', err);
                    }
                }
            }

            scope.onTextUpdate = function () {
                if (scope.confirm) {
                    justChange = true;
                } else {
                    justChange = false;
                    activeCallback();
                }
            };

            scope.onKeypress = function (evt) {
                if (evt.keyCode == 13 && justChange) {
                    activeCallback();
                    justChange = false;
                }
            };

            scope.onButtonClick = function () {
                activeCallback();
                justChange = false;
            };

            scope.reset = function () {
                scope.value = '';
                scope.onTextUpdate();
                setTimeout(function () {
                    inputElm.focus();
                }, 30);
            };
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.SpinBox', [])

.directive('luiSpinbox', [function () {
    var MAX_STEP_PRECISION = 6;
    var BASE = Math.pow(10, MAX_STEP_PRECISION);
    var EPSILON = 1 / BASE;
    var DEFAULT_STEP = BASE;

    // value scale/unscale based on system precision

    var ROUNDING_METHOD = {
        NONE: function (value) { return value; },
        ROUND: Math.round,
        FLOOR: Math.floor,
        CEIL: Math.ceil
    };

    function scaleValue(value, method) {
        if (arguments.length < 2) {
            return Math.round(value * BASE);
        } else {
            return method(value * BASE);
        }
    }

    function unscaleValue(value) {
        return value / BASE;
    }

    return {
        priority: 1,
        scope: {
            min: '=',
            max: '=',
            step: '=',
            ngDisabled: '='
        },
        require: ['ngModel', '^?form'],
        restrict: 'E',
        templateUrl: 'lui-tpl/SpinBox/spinbox.tmpl.html',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs, ctrls) {
            var ngModelCtrl = ctrls[0];
            var formCtrl = ctrls[1];

            if (angular.isDefined(iAttrs.inputMode)) {
                iElm.addClass('input-mode');
            } else {
                iElm.addClass('control-mode');
            }

            var inputElm = iElm[0].querySelector('input');

            scope.input = '0';
            var valueNumber = 0;

            var rangeInfo = {
                min: -Infinity,
                max: Infinity,
                precision: 0,
                step: DEFAULT_STEP
            };

            var autoCorrect = angular.isDefined(iAttrs.autoCorrect);

            function formatValue(value) {
                if (isNaN(value)) {
                    return '';
                } else {
                    value = unscaleValue(value);
                    return String(Math.floor(value * 100) / 100);
                }
            }

            /* -------------------- validation and correction -------------------- */

            function validValue(value) {
                if (isNaN(value)) {
                    return false;
                } else if (value < rangeInfo.min ||
                    value > rangeInfo.max) {
                    return false;
                } else {
                    if (rangeInfo.precision > 0) {
                        return value % rangeInfo.precision === 0;
                    } else {
                        return true;
                    }
                }
            }

            function correctValue(value) {
                if (value < rangeInfo.min) {
                    return rangeInfo.min;
                } else if (value > rangeInfo.max) {
                    return rangeInfo.max;
                } else if (rangeInfo.precision > 0) {
                    return Math.round(value / rangeInfo.precision) * rangeInfo.precision;
                } else {
                    return value;
                }
            }

            /* -------------------- ngModel state updating -------------------- */
            function correctModel() {
                if (isNaN(valueNumber)) {
                    valueNumber = 0;
                    scope.input = '0';
                } else {
                    valueNumber = correctValue(valueNumber);
                    scope.input = formatValue(valueNumber);
                }
            }

            function updateModelState(hasValue, isValid) {
                if (formCtrl) {
                    if (angular.isDefined(iAttrs.required)) {
                        ngModelCtrl.$setValidity('required', hasValue);
                    }

                    ngModelCtrl.$setValidity('range', isValid);
                }
            }

            function updateModelValue(value) {
                ngModelCtrl.$setViewValue(unscaleValue(value));
            }

            /* -------------------- control handles -------------------- */

            scope.onInputChange = function () {
                valueNumber = scope.input === '' ? NaN : Number(scope.input);
                valueNumber = scaleValue(valueNumber);

                var isValid = validValue(valueNumber);
                if (isValid || autoCorrect) {
                    if (!isValid) {
                        correctModel();
                    }
                    updateModelState(true, true);
                } else {
                    updateModelState(scope.input === '', false);
                }

                updateModelValue(valueNumber);
            };

            scope.onInputKeyDown = function (evt) {
                if (evt.keyCode == 13) {
                    scope.onInputChange();
                }
            };

            scope.decrease = function () {
                if (!validValue(valueNumber)) {
                    correctModel();
                }

                valueNumber -= rangeInfo.step;
                if (valueNumber < rangeInfo.min) {
                    valueNumber = rangeInfo.min;
                }

                scope.input = formatValue(valueNumber);

                updateModelState(true, true);
                updateModelValue(valueNumber);
            };

            scope.increase = function () {
                if (!validValue(valueNumber)) {
                    correctModel();
                }

                valueNumber += rangeInfo.step;
                if (valueNumber > rangeInfo.max) {
                    valueNumber = rangeInfo.max;
                }

                scope.input = formatValue(valueNumber);

                updateModelState(true, true);
                updateModelValue(valueNumber);
            };

            /* -------------------- events -------------------- */

            ngModelCtrl.$render = function () {
                valueNumber = scaleValue(Number(ngModelCtrl.$viewValue));
                scope.input = formatValue(valueNumber);

                var isValid = validValue(valueNumber);
                if (!isValid && autoCorrect) {
                    correctModel();
                    updateModelValue(valueNumber);
                } else {
                    updateModelState(scope.input === '', isValid);
                }
            };

            scope.$watch('min', function(newValue) {
                if (typeof newValue == 'number' && !isNaN(newValue)) {
                    if (newValue < rangeInfo.max) {
                        rangeInfo.min = scaleValue(newValue, ROUNDING_METHOD.CEIL);
                    }
                }
            });

            scope.$watch('max', function(newValue) {
                if (typeof newValue == 'number' && !isNaN(newValue)) {
                    if (newValue > rangeInfo.min) {
                        rangeInfo.max = scaleValue(newValue, ROUNDING_METHOD.FLOOR);
                    }
                }
            });

            scope.$watch('step', function (newValue) {
                if (typeof newValue == 'number' && !isNaN(newValue)) {
                    newValue = Math.abs(newValue);
                    if (newValue < EPSILON) {
                        rangeInfo.step = DEFAULT_STEP;
                        rangeInfo.precision = 0;
                    } else {
                        rangeInfo.step = scaleValue(newValue);
                        rangeInfo.precision = rangeInfo.step;
                    }
                }
            });

            inputElm.addEventListener('focus', function () {
                inputElm.select();
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.SwitchList', [])

.directive('luiSwitchList', [function () {
    return {
        priority: 1,
        scope: {},
        controller: '$luiSingleSelectionDirectiveCtrl',
        require: ['luiSwitchList', '?ngModel'],
        restrict: 'E',
        replace: false,
        link: function(scope, iElm, iAttrs, ctrls) {
            var thisCtrl = ctrls[0];
            var ngModelCtrl = ctrls[1];

            if (ngModelCtrl) {
                thisCtrl.bindNgModelCtrl(ngModelCtrl);
            }
        }
    };
}])

.directive('luiSwitchItem', [function () {
    return {
        priority: 1,
        scope: {
            value: '='
        },
        require: '^?luiSwitchList',
        restrict: 'EA',
        template: '<div class="switch-item-wrapper layout-row layout-align-start-center" ng-transclude></div>',
        transclude: true,
        replace: false,
        link: function(scope, iElm, iAttrs, listCtrl) {
            iElm.addClass('lui-switch-item');

            if (listCtrl) {
                var control = {
                    getValue: function () {
                        return scope.value;
                    },
                    sync: function (value) {
                        if (this.isEqual(value)) {
                            this.select();
                            return true;
                        } else {
                            this.deselect();
                            return false;
                        }
                    },
                    isEqual: function (value) {
                        return scope.value == value;
                    },
                    select: function () {
                        iElm.addClass('selected');
                    },
                    deselect: function () {
                        iElm.removeClass('selected');
                    },
                    setDisabled: function (disabled) {
                        return;
                    },
                    isDisabled: function () {
                        return false;
                    }
                };

                listCtrl.registerItem(control);

                iElm.bind('click', function (evt) {
                    listCtrl.onItemSelectChange(control, true);
                });

                scope.$on('$destroy', function () {
                    listCtrl.deregisterItem(control);
                });
            }
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.NgTable', [])

.config(['$ngTableConfigProvider',function ($ngTableConfigProvider) {
    $ngTableConfigProvider.setPagerTemplateUrl('lui-tpl/Table/table-pagination.tmpl.html');
}]);
angular.module('LINDGE.UI-Standard.Control.Tabs', [])

.controller('$luiTabsCtrl', ['$scope', function ($scope) {
    $scope.tabs = [];
    $scope.currentTab = null;

    this.registerTab = function (newTab) {
        $scope.tabs.push(newTab);
        $scope.tabs = $scope.tabs.slice(0);
        if ($scope.tabs.length === 1) {
            this.selectTab(newTab);
        }
    };

    this.deregisterTab = function (tab) {
        $scope.tabs = $scope.tabs.filter(function (t) { return t !== tab; });
    };

    this.selectTab = function (target) {
        for (var i = 0; i < $scope.tabs.length; i++) {
            var tab = $scope.tabs[i];
            if (tab === target) {
                tab.show();
                $scope.currentTab = target;
                $scope.$evalAsync(angular.noop);
            } else {
                tab.hide();
            }
        }
    };

    this.getTabIndex = function (tab) {
        return $scope.tabs.indexOf(tab);
    };

    this.getCurrentTabIndex = function () {
        if ($scope.currentTab) {
            return $scope.tabs.indexOf($scope.currentTab);
        } else {
            return -1;
        }
    };
}])

.directive('luiTabbar', [function () {
    // simple async task queue implementation
    function createProcessQueue () {
        var processQueue = {
            _queue: [],
            _handle: null,
            _interval: 100,

            push: function (item) {
                this._queue.push(item);
            },

            popLeft: function () {
                if (this._queue.length > 0) {
                    return this._queue.shift();
                } else {
                    return null;
                }
            },

            length: function () {
                return this._queue.length;
            },

            begin: function (interval) {
                interval = Number(interval);
                if (!isNaN(interval)) {
                    this._interval = interval;
                } else {
                    interval = this._interval;
                }

                var self = this;

                function next() {
                    var callback = self.popLeft();
                    if (callback) {
                        callback();
                    }

                    self._handle = setTimeout(next, interval);
                }

                if (!this._handle) {
                    this._handle = setTimeout(next, interval);
                }
            },

            stop: function () {
                if (this._handle) {
                    clearTimeout(this._handle);
                    this._handle = null;
                }
            }
        };

        return processQueue;
    }

    var template = [
        '<div class="lui-tabbar clearfix">',
        '<div class="tabbar-item" ng-repeat="item in items" ng-click="selectItem(item)" tab-ripple-helper>',
        '{{item.text}}',
        '</div>',
        '<div class="inkbar" ng-show="items.length>0"></div>',
        '</div>'
    ].join('');

    return {
        priority: 1,
        scope: {
            items: '='
        },
        require: ['?^luiTabs', '?ngModel'],
        restrict: 'EA',
        template: template,
        replace: false,
        link: function(scope, iElm, iAttrs, ctrls) {
            var tabsCtrl = ctrls[0];    // TBD
            var ngModelCtrl = ctrls[1];

            if (!ngModelCtrl) {
                return;
            }

            var tabElems = [];
            var container = angular.element(iElm[0].querySelector('.lui-tabbar'));
            var inkbar = angular.element(iElm[0].querySelector('.inkbar'));

            var processQueue = createProcessQueue();

            function getTabElementByValue(value) {
                for (var i = 0; i < scope.items.length; i++) {
                    var item = scope.items[i];
                    if (item === value) {
                        return tabElems[i];
                    }
                }
                
                return null;
            }

            function updateSelectTab(elem) {
                tabElems.forEach(function(e) {
                    if (elem !== e) {
                        e.removeClass('selected');
                    }
                });

                elem.addClass('selected');

                var containerWidth = container[0].getBoundingClientRect().width;
                var bound = elem[0].getBoundingClientRect();
                var left = elem[0].offsetLeft;
                inkbar.css({ left: left + 'px', width: bound.width + 'px' });
            }

            function updateKeyElement() {
                var elem = getTabElementByValue(ngModelCtrl.$viewValue || null);
                if (elem) {
                    updateSelectTab(elem);
                }
            }

            function liveUpdateUI () {
                updateKeyElement();
                processQueue.push(liveUpdateUI);
            }

            ngModelCtrl.$render = updateKeyElement;

            scope.selectItem = function (item) {
                var idx = scope.items.indexOf(item);
                if (idx >= 0) {
                    ngModelCtrl.$setViewValue(item);
                    updateKeyElement();
                }
            };

            scope.$watch('items', function () {
                var tabs = iElm[0].querySelectorAll('.tabbar-item');
                tabElems.length = 0;
                for (var i = 0; i < tabs.length; i++) {
                    tabElems.push(angular.element(tabs[i]));
                }

                updateKeyElement();
            });

            scope.$on('$destroy', function () {
                processQueue.stop();
            });

            processQueue.begin(150);
            liveUpdateUI();
        }
    };
}])

.directive('tabRippleHelper', ['$mdInkRipple', function ($mdInkRipple) {
    var helperElmTpl = angular.element('<span class="ripple-helper"></span>');

    return {
        priority: 1,
        scope: false,
        restrict: 'A',
        replace: false,
        link: function(scope, iElm) {
            var helperElm = helperElmTpl.clone();

            $mdInkRipple.attach(scope, iElm, {
                isMenuItem: false,
                dimBackground: true,
                fitRipple: true,
                colorElement: helperElm
            });

            iElm.append(helperElm);
        }
    };
}])

.directive('luiTabs', [function () {
    var template = [
        '<lui-tabbar items="tabs" ng-model="currentTab" ng-change="onTabbarChange()"></lui-tabbar>',
        '<div class="lui-tab-container" ng-transclude></div>'
    ].join('');

    return {
        priority: 1,
        scope: {
            onTabChange: '&'
        },
        controller: '$luiTabsCtrl',
        restrict: 'EA',
        template: template,
        replace: false,
        transclude: true,
        link: function(scope, iElm, iAttrs, thisCtrl) {
            scope.onTabbarChange = function () {
                thisCtrl.selectTab(scope.currentTab);

                scope.$evalAsync(function () {
                    var tabInfo = {
                        value: scope.currentTab.value,
                        index: thisCtrl.getCurrentTabIndex()
                    };

                    scope.onTabChange({ $tab: tabInfo });
                });
            };
        }
    };
}])

.directive('luiTab', [function () {
    return {
        priority: 1,
        scope: {
            onSelect: '&',
            onHide: '&',
            value: '='
        },
        require: '^?luiTabs',
        restrict: 'EA',
        replace: false,
        transclude: false,
        compile: function(tElement) {
            var wrapper = angular.element('<div class="lui-tab-wrapper"></div>');
            var children = tElement.children();
            for (var i = 0; i < children.length; i++) {
                wrapper.append(children[i]);
            }
            tElement.append(wrapper);

            function postLink (scope, iElm, iAttrs, parentCtrl) {
                var displayStyle = window.getComputedStyle(iElm[0]).style || 'block';

                var ctrl = {
                    value: scope.value || null,
                    text: iAttrs['label'],
                    show: function () {
                        iElm.css('display', displayStyle);
                        scope.$evalAsync(scope.onSelect);
                    },
                    hide: function () {
                        iElm.css('display', 'none');
                        scope.$evalAsync(scope.onHide);
                    }
                };

                iElm.css('display', 'none');

                parentCtrl.registerTab(ctrl);

                scope.$on('$destroy', function () {
                    parentCtrl.deregisterTab(ctrl);
                });
            }

            return postLink;
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.TreeView', [])

.directive('luiTreeItem', ['luiTreeViewParams', function (TreeViewParams) {
    var iconName = 'lic-caret-down';

    var template = `<i class="lic ${iconName} expand-icon flex-none"></i>`;
    var fragment = new DocumentFragment();
    fragment.append(angular.element(template)[0]);

    return {
        priority: 1,
        scope: false,
        require: '^?luiTreeView',
        replace: false,
        compile: function(tElm, tAttrs) {
            function postLink (scope, iElm, iAttrs, ctrl) {
                if (!ctrl) {
                    return;
                }

                var expandBtn = angular.element(iElm[0].querySelector('.expand-icon'));
                var displayMode = iAttrs.expandButton;
                var rotateCls = 'lui-rotate-neg-90';

                scope.$watch(function () {
                    return scope.$node.$isOpen;
                }, function (value) {
                    if (value) {
                        expandBtn.removeClass(rotateCls);
                    } else {
                        expandBtn.addClass(rotateCls);
                    }
                });

                if (displayMode != 'always') {
                    scope.$watch(function () {
                        var children = ctrl.getParam().getNodeChildren(scope.$node);
                        return children.length;
                    }, function (value) {
                        if (value > 0) {
                            expandBtn.addClass(iconName);
                        } else {
                            expandBtn.removeClass(iconName);
                        }
                    });
                }

                expandBtn.bind('click', function (evt) {
                    evt.stopPropagation();
                    var param = ctrl.getParam();
                    if (param) {
                        if (param.setting.clickToExpand !== TreeViewParams.ACTION_TYPES.OFF) {
                            param.toggleNodeOpen(scope.$node);
                            scope.$apply();
                        }
                    }
                });
            }

            if (angular.isDefined(tAttrs.expandButton)) {
                tElm[0].prepend(fragment.cloneNode(true));
                return postLink;
            } else {
                return angular.noop;
            }
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.FiletaskList', [])

.factory('$filetaskList', ['$log', function ($log) {
    function createTask() {
        return {
            description: '',
            isFinished: false,
            isFailed: false,
            isProgressing: false,
            isCanceled: false,
            progress: 0, // [0, 1]
            icon: 'lic-document',
            result: null,
            error: null,
            handles: {
                onCancel: null,
                onDelete: null,
                onFinish: null
            },
            metadata: {
                name: ''
            }
        };
    }

    return {
        createTask: createTask,
        discardTask: function (task) {
            if (task.isProgressing) {
                task.isProgressing = false;
                task.isCanceled = true;
                if (typeof task.handles.onCancel == 'function') {
                    try {
                        task.handles.onCancel.call(null);
                    } catch (err) {
                        $log.error('error occurred within onCancel handle', err);
                    }
                }
            } else {
                if (typeof task.handles.onDelete == 'function') {
                    try {
                        task.handles.onDelete.call(null);
                    } catch (err) {
                        $log.error('error occurred within onDelete handle', err);
                    }
                }
            }
        },
        setTaskFinish: function (task, success) {
            task.isProgressing = false;
            if (success) {
                task.isFinished = true;
                task.isFailed = false;
            } else {
                task.isFinished = false;
                task.isFailed = true;
            }

            if (typeof task.handles.onFinish == 'function') {
                try {
                    task.handles.onFinish.call(null);
                } catch (err) {
                    $log.error('error occurred within onFinish handle', err);
                }
            }
        }
    };
}])

.directive('luiUploadList', ['$luiDialog', '$filetaskList', '$SDK', function ($luiDialog, $filetaskList, $SDK) {
    return {
        priority: 1,
        scope: {
            tasks: '=',
            descTemplate: '@'
        },
        templateUrl: 'lui-tpl/UploadControl/upload-tasklist.tmpl.html',
        restrict: 'E',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            function removeTask(task) {
                var index = scope.tasks.indexOf(task);
                if (index >= 0) {
                    scope.tasks.splice(index, 1);
                }
            }

            scope.cancelOrDelete = function (task) {
                $luiDialog.confirm('文件上传', '确认移除' + task.description + '？')
                    .then(function () {
                        removeTask(task);
                        $filetaskList.discardTask(task);
                    });
            };

            scope.getDesc = function (task) {
                if (scope.descTemplate) {
                    return $SDK.Lang.formatStringByMap(scope.descTemplate, task.metadata);
                } else {
                    return task.description;
                }
            };

            scope.$watch(function () {
                return scope.tasks.length;
            }, function () {
                scope.tasks.forEach(function (task, index) {
                    task.metadata.index = index + 1;
                });
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Uploader', [])

.directive('luiUploader', ['$SDK', '$luiDialog', 'lplUploadingStates', '$filetaskList', '$fastUploader', '$uploadCounter', '$luiFileDialog',
function ($SDK, $luiDialog, UploadingStates, $filetaskList, $fastUploader, $uploadCounter, $luiFileDialog) {
    var counter = $uploadCounter.getCounter('lui-upload', 10);

    return {
        priority: 1,
        scope: {
            onChange: '&',
            hooks: '=',
            ngDisabled: '=',
            encrypted: '=',
            tip: '@',
            label: '@',
            icon: '@',
            multiple: '=',
            customList: '=',
            accept: '@',
            descTemplate: '@'
        },
        restrict: 'E',
        templateUrl: function (tElm, tAttrs) {
            if (angular.isDefined(tAttrs.drop)) {
                return 'lui-tpl/UploadControl/upload-control-drop.tmpl.html';
            } else {
                return 'lui-tpl/UploadControl/upload-control.tmpl.html';
            }
        },
        replace: false,
        link: function(scope, iElm, iAttrs) {
            // element initiation
            var iconElm = angular.element(iElm[0].querySelector('button>i'));
            if (scope.icon) {
                iconElm.addClass(scope.icon);
            } else {
                iconElm.addClass('lic-upload-cloud');
            }

            // control states //
            scope.buttonLabel = !!scope.label ? scope.label : '选择文件';
            scope.canUpload = true;
            scope.useCustomTasklist = !!scope.customList;

            var needOutputResult = angular.isDefined(iAttrs.onChange) && iAttrs.onChange.indexOf('$result') >= 0;
            var hooks = null;

            var maxCount = 1;
            if (angular.isDefined(iAttrs.multiple)) {
                maxCount = $SDK.Math.safeToNumber(scope.multiple);
                if (maxCount <= 0) {
                    maxCount = -1;
                }
            }

            // hook management //
            function checkHook(name) {
                return !!hooks && typeof hooks[name] == 'function';
            }

            function activeHook(name, params, defaultResult) {
                if (arguments.length < 3) {
                    defaultResult = null;
                }

                if (checkHook(name)) {
                    var hook = hooks[name];
                    try {
                        return hook.apply(hooks, params);
                    } catch (err) {
                        return defaultResult;
                    }
                } else {
                    return defaultResult;
                }
            }

            // task list intergration //

            var taskList = scope.useCustomTasklist ? scope.customList : [];
            scope.fileList = taskList;

            function getValidTaskCount() {
                var count = 0;
                taskList.forEach(function (task) {
                    if (!task.isFailed) {
                        count++;
                    }
                });

                return count;
            }

            function clearTasks() {
                taskList.forEach(function (task) {
                    $filetaskList.discardTask(task);
                });
                taskList.length = 0;
            }

            function getResults() {
                return taskList
                    .filter(function (task) {
                        return task.isFinished;
                    })
                    .map(function (task) {
                        return task.result;
                    });
            }

            function createTaskResult(file, handle) {
                return {
                    name: file.name,
                    handle: handle,
                    type: file.type,
                    size: file.size,
                    lastModifiedTime: file.lastModifiedDate
                };
            }

            // file dialog intergration //

            function onFileSelect(files, fileCount) {
                if (fileCount > 0) {
                    if (maxCount == 1) {
                        // override all tasks if only one file can be uploaded
                        clearTasks();
                    } else {
                        if (maxCount > 1 && (getValidTaskCount() + fileCount) > maxCount) {
                            $luiDialog.alert('文件上传', '本次选择文件数过多，达到总数上限。');
                            return;
                        }
                    }

                    Array.prototype.forEach.call(files, function (file) {
                        if (activeHook('onAcceptFile', [file], true)) {
                            uploadFile(file);
                        }
                    });
                    scope.$apply();
                }
            }

            // core task management //

            function triggerChange(newResult) {
                var files = null;

                if (angular.isDefined(iAttrs.onChange)) {
                    if (needOutputResult) {
                        files = getResults();
                        scope.onChange({
                            $result: {
                                latest: newResult,
                                files: files
                            }
                        });
                    } else {
                        scope.onChange();
                    }
                }

                if (checkHook('onChange')) {
                    if (files === null) {
                        files = getResults();
                    }
                    activeHook('onChange', [newResult, files]);
                }
            }

            function uploadFile(file) {
                // create task
                var task = $filetaskList.createTask();
                task.isProgressing = true;
                task.description = file.name;
                task.metadata.name = file.name;

                activeHook('onUploadBegin', [file.name]);

                // create upload handle
                var uploader = {
                    fileName: '',
                    fileSize: 0,
                    speed: 0,
                    timeRemain: 0,
                    progress: 0,
                    changeCallback: function () {
                        task.progress = this.progress;
                    },
                    finishedCallback: function (state, id) {
                        counter.release(true);
                        
                        if (state == UploadingStates.completed) {
                            var newResult = createTaskResult(file, id);
                            task.result = newResult;

                            $filetaskList.setTaskFinish(task, true);
                            triggerChange(newResult);
                        } else {
                            $filetaskList.setTaskFinish(task, false);
                            task.error = state;

                            if (checkHook('onError')) {
                                activeHook('onError', [state, getResults()]);
                            }
                        }
                    }
                };

                // register task callbacks
                var isUploading = false;

                task.handles.onCancel = function () {
                    if (isUploading) {
                        try {
                            uploader.cancelHandle.call(null);
                            activeHook('onUploadCancel', [file.name]);
                        } finally {
                            counter.release(true);
                        }
                    }
                };

                task.handles.onDelete = function () {
                    triggerChange();
                };

                // save task
                taskList.push(task);

                // require uploading permission
                counter.require(function () {
                    isUploading = true;

                    // start upload
                    $fastUploader.upload(file, uploader, {
                        root: '',
                        encrypted: !!scope.encrypted
                    });
                });
            }

            // scope binding //

            function checkAcceptNewTask() {
                if (maxCount > 1 && getValidTaskCount() >= maxCount) {
                    // prompt if uploaded tasks has reached uplimit
                    $luiDialog.alert('文件上传', '当前上传文件已达到数量上限，请删除后再上传');
                    return false;
                } else {
                    return true;
                }
            }

            scope.triggerFileSelect = function (evt) {
                evt.preventDefault();

                if (checkAcceptNewTask()) {
                    if (activeHook('onBeforeSelect', [], true)) {
                        $luiFileDialog.triggerGlobalInput(onFileSelect, { multiple: maxCount != 1, accept: scope.accept || '' });
                    }
                }
            };

            scope.triggerFileDrop = function (files) {
                files = files.filter(function (file) { return file.size > 0; });
                onFileSelect(files, files.length);
            };

            scope.$on('$destroy', function () {
                taskList.forEach(function (task) {
                    if (task.isProgressing) {
                        $filetaskList.discardTask(task);
                    }
                });
            });

            scope.$watch('hooks', function (newValue) {
                if (typeof newValue == 'object') {
                    hooks = newValue;
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Standard.Control.VideoPlayer', ['LINDGE.UI-Standard.Control.VideoService'])

.directive('luiVideoPlayer', ['$luiVideoService', '$document', '$luiMediaUtil', '$SDK', 'ElementStateMonitor',
function (VideoService, $document, $luiMediaUtil, $SDK, ElementStateMonitor) {
    function createOrSetBufferChunk (chunk, start, end) {
        if (chunk) {
            chunk = angular.element(chunk);
        } else {
            chunk = angular.element('<div class="load-chunk">');
        }

        chunk.css({
            left: start * 100 + '%',
            right: (1 - end) * 100 + '%'
        });

        return chunk;
    }

    function createStateToggleFunc(elm, cls) {
        return function (isActive) {
            if (isActive) {
                elm.addClass(cls);
            } else {
                elm.removeClass(cls);
            }
        };
    }

    function disableTouchHandle(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    function disableTouchScroll(iElm, disable) {
        if (disable) {
            iElm[0].addEventListener('touchmove', disableTouchHandle, { passive: false });
        } else {
            iElm[0].removeEventListener('touchmove', disableTouchHandle);
        }
    }

    var STATE_PAUSE_CLS = 'state-pause';
    var STATE_LOADING_CLS = 'state-loading';
    var STATE_INTERACT_CLS = 'state-interact';
    var STATE_FULLSCREEN_CLS = 'state-fullscreen';
    var AUTO_HIDE_TOOLBAR_CLS = 'autohide-toolbar';
    var DRAGGING_CLS = 'sliding';

    var DEFAULT_VOLUME = 60;
    var MIN_VOLUME = 20;

    var VOLUME_TYPES = [{
        name: 'high',
        icon: 'lic-volume-up',
        threshold: 0.49
    }, {
        name: 'low',
        icon: 'lic-volume-down',
        threshold: 0.0
    }, {
        name: 'mute',
        icon: 'lic-volume-mute',
        threshold: -1.0
    }];

    function link(scope, iElm, iAttrs) {
        function forceScopeUpdate() {
            scope.$evalAsync(angular.noop);
        }

        var markStatePause = createStateToggleFunc(iElm, STATE_PAUSE_CLS);
        var markStateInteract = createStateToggleFunc(iElm, STATE_INTERACT_CLS);
        var markFullscreen = createStateToggleFunc(iElm, STATE_FULLSCREEN_CLS);

        // service initiation
        var service = VideoService.createVideoService();

        // structure elements
        var structureElms = {
            videoWrapper: iElm[0].querySelector('.video-wrapper')
        };

        // player global states
        var playerStates = {
            fullscreen: false
        };

        // progress elements config
        var progressElms = {
            container: angular.element(iElm[0].querySelector('.video-progress')),
            play: angular.element(iElm[0].querySelector('.video-play-progress')),
            load: angular.element(iElm[0].querySelector('.video-load-progress')),
            scrubber: angular.element(iElm[0].querySelector('.video-progress-scrubber'))
        };

        var progressDragInfo = {
            isPlayingBeforeDrag: false,
            isDragging: false
        };

        function setProgress(name, ratio) {
            progressElms[name].css('width', ratio * 100 + '%');
        }

        function clearLoadProgress() {
            progressElms.load.empty();
        }

        function setScrubberPos(ratio) {
            var cssWidth = window.getComputedStyle(progressElms.scrubber[0]).width;
            var handleWidth = parseFloat(cssWidth);
            progressElms.scrubber.css('left', ['calc(', ratio * 100 + '%', ' - ', handleWidth / 2 + 'px)'].join(''));
        }

        function computeRatioFromEvent(container, evt, padding) {
            var elm = container[0];
            var elmLeft = elm.getBoundingClientRect().left;

            var ratio;
            if (padding > 0) {
                ratio = (evt.clientX - elmLeft + padding) / (elm.offsetWidth - padding * 2);
            } else {
                ratio = (evt.clientX - elmLeft) / elm.offsetWidth;
            }

            return $SDK.Math.clamp(0, 1, ratio);
        }

        var progressDragActions = {
            playProgressDragBegin: function (evt) {
                if (evt.button !== 0) {
                    return;
                }

                evt.preventDefault();
                evt.stopPropagation();

                progressElms.container.addClass(DRAGGING_CLS);
                markStateInteract(true);

                progressDragInfo.isPlayingBeforeDrag = service.isPlaying;
                progressDragInfo.isDragging = true;
                service.pause();

                disableTouchScroll(iElm, true);

                $document.bind('pointermove', progressDragActions.playProgressDragging);
                $document.bind('pointerup', progressDragActions.playProgressDragEnd);
                progressDragActions.playProgressDragging(evt);
            },
            playProgressDragging: function (evt) {
                evt.preventDefault();

                var ratio = computeRatioFromEvent(progressElms.container, evt);
                setProgress('play', ratio);
                setScrubberPos(ratio);
                service.seekToPosition(ratio);
            },
            playProgressDragEnd: function (evt) {
                evt.preventDefault();

                progressDragActions.playProgressDragging(evt);

                $document.unbind('pointermove', progressDragActions.playProgressDragging);
                $document.unbind('pointerup', progressDragActions.playProgressDragEnd);

                if (progressDragInfo.isPlayingBeforeDrag) {
                    service.play();
                }

                disableTouchScroll(iElm, false);

                progressDragInfo.isDragging = false;
                progressElms.container.removeClass(DRAGGING_CLS);
                markStateInteract(false);
            }
        };

        progressElms.container.bind('pointerdown', progressDragActions.playProgressDragBegin);
        progressElms.scrubber.bind('pointerdown', progressDragActions.playProgressDragBegin);

        // volume elements config
        var volumeInfo = {
            wrapper: angular.element(iElm[0].querySelector('.video-volume-wrapper')),
            container: angular.element(iElm[0].querySelector('.volume-progress')),
            value: angular.element(iElm[0].querySelector('.volume-progress-value')),
            scrubber: angular.element(iElm[0].querySelector('.volume-progress-scrubber')),
            icon: angular.element(iElm[0].querySelector('.volume-icon')),
            width: 60,
            scrubberWidth: 12,
            isDragging: false,
            currentType: null,
            isChangingVolume: false
        };

        function setVolumeProgress(ratio) {
            var width = (volumeInfo.width - volumeInfo.scrubberWidth / 2) * ratio;
            volumeInfo.value.css('width', width + 'px');
        }

        function setVolumeScrubber(ratio) {
            var left = (volumeInfo.width - volumeInfo.scrubberWidth) * ratio;
            volumeInfo.scrubber.css('left', left + 'px');
        }

        function getVolumeType(ratio) {
            for (var i = 0; i < VOLUME_TYPES.length; i++) {
                var type = VOLUME_TYPES[i];
                if (type.threshold < ratio) {
                    return type;
                }
            }

            return null;
        }

        function setVolumeState(ratio) {
            setVolumeProgress(ratio);
            setVolumeScrubber(ratio);

            var newType = getVolumeType(ratio);
            if (volumeInfo.currentType !== newType) {
                if (volumeInfo.currentType) {
                    volumeInfo.icon.removeClass(volumeInfo.currentType.icon);
                }

                volumeInfo.icon.addClass(newType.icon);
                volumeInfo.currentType = newType;
            }
        }

        var volumeActions = {
            volumeDragBegin: function (evt) {
                if (evt.button !== 0) {
                    return;
                }

                evt.preventDefault();
                evt.stopPropagation();

                volumeInfo.wrapper.addClass(DRAGGING_CLS);
                volumeInfo.isChangingVolume = true;
                markStateInteract(true);

                disableTouchScroll(iElm, true);

                $document.bind('pointermove', volumeActions.volumeDragging);
                $document.bind('pointerup', volumeActions.volumeDragEnd);
                $document.bind('pointerdown', volumeActions.defocus);
                volumeActions.volumeDragging(evt);
            },
            volumeDragging: function (evt) {
                var ratio = computeRatioFromEvent(volumeInfo.container, evt);
                setVolumeState(ratio);

                if (ratio <= 0) {
                    service.mute();
                } else {
                    service.unmute();
                    service.setVolume(ratio * 100);
                }
            },
            volumeDragEnd: function (evt) {
                evt.preventDefault();

                volumeActions.volumeDragging(evt);

                $document.unbind('pointermove', volumeActions.volumeDragging);
                $document.unbind('pointerup', volumeActions.volumeDragEnd);

                disableTouchScroll(iElm, false);

                markStateInteract(false);
                volumeInfo.isChangingVolume = false;
            },
            defocus: function (evt) {
                volumeInfo.wrapper.removeClass(DRAGGING_CLS);
                $document.unbind('pointerdown', volumeActions.defocus);
            }
        };

        volumeInfo.container.bind('pointerdown', volumeActions.volumeDragBegin);

        service.video.addEventListener('volumechange', function () {
            if (!volumeInfo.isChangingVolume) {
                var volume = service.getVolume();
                setVolumeState(volume / 100);

                if (volume <= 0) {
                    service.mute();
                } else {
                    service.unmute();
                }
            }
        });

        // time display config
        var timeDisplayElm = angular.element(iElm[0].querySelector('.time-current'));
        var durationDisplayElm = angular.element(iElm[0].querySelector('.time-duration'));

        function updateTimeDisplay(current, duration) {
            var currentText = $luiMediaUtil.formatPlayerTime(current, true);
            var durationText = $luiMediaUtil.formatPlayerTime(duration, true);
            timeDisplayElm.text(currentText);
            durationDisplayElm.text(durationText);
        }

        // cover image
        scope.coverImage = {
            isShow: false,
            image: document.createElement('img')
        };

        function showCoverImage(src) {
            var img = scope.coverImage.image;
            img.remove();
            img.attr('src', '');
            img.attr('src', src);

            img[0].onload = function () {
                if (!service.isPlaying) {
                    // TBD
                }
            };
        }

        // toolbar autohide
        var autohideHandle = -1;
        var markAutoHideToolbar = createStateToggleFunc(iElm, AUTO_HIDE_TOOLBAR_CLS);

        function resetAutohideHandle() {
            if (autohideHandle > 0) {
                clearTimeout(autohideHandle);
                autohideHandle = -1;
            }
        }

        function autohideDetectHandle(evt) {
            resetAutohideHandle();
            markAutoHideToolbar(false);

            autohideHandle = setTimeout(function () {
                markAutoHideToolbar(true);
            }, 1500);
        }

        iElm.bind('mouseenter', function (evt) {
            autohideDetectHandle(evt);
            iElm.bind('mousemove', autohideDetectHandle);
        });

        iElm.bind('mouseleave', function (evt) {
            resetAutohideHandle();
            iElm.unbind('mousemove', autohideDetectHandle);
            markAutoHideToolbar(true);
        });

        // fullscreen management
        function enterFullscreen() {
            iElm[0].requestFullscreen({ navigationUI: 'hide' })
                .then(function () {
                    markFullscreen(true);
                    playerStates.fullscreen = true;
                });
        }

        function exitFullscreen() {
            document.exitFullscreen()
                .then(function () {
                    markFullscreen(false);
                    playerStates.fullscreen = false;
                });
        }

        function onFullscreenChange(evt) {
            if (document.fullscreenElement && document.fullscreenElement === iElm[0]) {
                if (!playerStates.fullscreen) {
                    markFullscreen(true);
                    playerStates.fullscreen = true;
                }
            } else {
                if (playerStates.fullscreen) {
                    markFullscreen(false);
                    playerStates.fullscreen = false;
                }
            }
        }

        $document.bind('fullscreenchange', onFullscreenChange);

        // layout management
        function getCurrentRootSize() {
            return {
                width: iElm[0].clientWidth,
                height: iElm[0].clientHeight,
            };
        }

        function updateDrawElementLayout(containerSize) {
            if (!containerSize) {
                containerSize = getCurrentRootSize();
            }

            var videoNode = angular.element(service.video.getDOMNode());
            var resolution = service.video.getResolution();
            if (resolution[0] > 0 && resolution[1] > 0) {
                var scale;
                if (resolution[0] >= resolution[1]) {
                    scale = containerSize.width / resolution[0];
                    var height = resolution[1] * scale;
                    videoNode.css({
                        width: '100%',
                        height: height + 'px',
                        top: Math.max(0, ((containerSize.height - height) / 2)) + 'px'
                    });
                } else {
                    scale = containerSize.height / resolution[1];
                    videoNode.css({
                        width: scale * resolution[0] + 'px',
                        height: '100%',
                        top: '0'
                    });
                }
            }
        }

        function createVideoSizeWatcher() {
            var sizeChecker = new ElementStateMonitor.SizeChecker(iElm[0], false);
            sizeChecker.addCallback(updateDrawElementLayout);

            var monitor = new ElementStateMonitor.ElementStateMonitor();
            monitor.addChecker(sizeChecker);

            return monitor;
        }

        var videoSizeWatcher = createVideoSizeWatcher();
        videoSizeWatcher.beginWatch();

        // service config
        scope.service = service;

        service.registerHandle({
            onInitLoading: function () {
                setTimeout(function () {
                    updateDrawElementLayout();
                }, 200);
            },
            onPlaybackSet: function (playback) {
                setProgress('play', 0);
                setScrubberPos(0);
                updateTimeDisplay(0, 0);
                clearLoadProgress();

                if (playback.cover) {
                    //
                }

                forceScopeUpdate();
            },
            onPlayStart: function () {
                markStatePause(false);
                updateTimeDisplay(service.currentTime, service.duration);
            },
            onPlayEnd: function () {
                markStatePause(true);
                updateTimeDisplay(service.duration, service.duration);
                forceScopeUpdate();
            },
            onTerminate: function () {
                markStatePause(true);
                forceScopeUpdate();
            },
            onTimeChange: function () {
                if (!progressDragInfo.isDragging) {
                    setProgress('play', service.progress / 100);
                    setScrubberPos(service.progress / 100);
                }

                updateTimeDisplay(service.currentTime, service.duration);
                forceScopeUpdate();
            }
        });

        service.video.addEventListener('progress', function (evt) {
            var loadElm = progressElms.load;
            var children = loadElm.children();

            var bufferList = service.video.getBufferView(true);
            var count = 0;
            if (bufferList.length > 0) {
                bufferList.forEach(function (buffer) {
                    if (buffer[1] - buffer[0] > 0.02) {
                        var chunk = children[count];
                        if (chunk) {
                            createOrSetBufferChunk(chunk, buffer[0], buffer[1]);
                        } else {
                            chunk = createOrSetBufferChunk(null, buffer[0], buffer[1]);
                            loadElm.append(chunk);
                        }

                        count++;
                    }
                });
            }

            for (var i = count; i < children.length; i++) {
                children[i].remove();
            }
        });

        service.useRefineStateUpdating();

        // ui callbacks
        scope.togglePlay = function () {
            if (service.isPlaying) {
                service.pause();
                markStatePause(true);
            } else {
                service.play();
                markStatePause(false);
            }
        };

        scope.toggleMute = function () {
            if (service.isMute()) {
                service.unmute();
                var volume = service.getVolume();
                if (volume === 0) {
                    service.setVolume(MIN_VOLUME);
                    setVolumeState(MIN_VOLUME / 100);
                } else {
                    setVolumeState(volume / 100);
                }
            } else {
                service.mute();
                setVolumeState(0);
            }
        };

        scope.toggleFullscreen = function (evt) {
            if (playerStates.fullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        };

        // other init code
        markStatePause(true);

        service.setVolume(DEFAULT_VOLUME);
        setVolumeState(DEFAULT_VOLUME / 100);

        structureElms.videoWrapper.appendChild(service.video.getDOMNode());

        iElm.bind('contextmenu', function (evt) {
            evt.preventDefault();
        });

        scope.$on('$destroy', function () {
            service.terminatePlayback();

            if (videoSizeWatcher.isWatching) {
                videoSizeWatcher.stopWatch();
            }

            $document.unbind('fullscreenchange', onFullscreenChange);
        });

        if (angular.isFunction(scope.onInit)) {
            scope.onInit(service);
        }
    }

    return {
        priority: 1,
        scope: {
            onInit: '='  
        },
        restrict: 'E',
        templateUrl: 'lui-tpl/VideoPlayer/video-player.tmpl.html',
        replace: false,
        transclude: false,
        link: link
    };
}]);
angular.module('LINDGE.UI-Standard.Control.VideoService', [])

.factory('$luiVideoService', ['$injector', '$SDK', '$log', '$ngUtil', '$luiTimer', function ($injector, $SDK, $log, $ngUtil, Timer) {
    var NAME_VIDEO_SERVICE = 'VideoCore';
    var NAME_SUBTITLE_MACHINE = 'SubtitleMachine';
    var NAME_SUBTITLE_PAINTER = '$lwmSubtitlePainter';

    var VideoCore = $ngUtil.tryLoadService(NAME_VIDEO_SERVICE);
    var SubtitleMachine = $ngUtil.tryLoadService(NAME_SUBTITLE_MACHINE);
    var SubtitlePainter = $ngUtil.tryLoadService(NAME_SUBTITLE_PAINTER);

    var DEFAULT_TIMER_INTERVAL = 200;

    var clamp = $SDK.Math.clamp;

    /**
     * video service
     */
    function VideoService() {
        this._refineStateUpdating = false;
        this._refreshTimer = new Timer(DEFAULT_TIMER_INTERVAL);

        this._canplay = false;
        this._autoStart = false;
        this._handles = [];

        this.currentTime = 0;
        this.duration = 0.0;
        this.progress = 0.0;    // [0, 100]

        this.isActive = false;
        this.isPlaying = false;

        this._currentFile = '';

        this.video = new VideoCore();
        this._setupVideo();
    }

    VideoService.prototype._triggerHandles = function(name, params) {
        this._handles.forEach(function (handle) {
            var callback = handle[name];
            if (callback) {
                try {
                    if (Array.isArray(params)) {
                        callback.apply(handle, params);
                    } else {
                        callback.call(handle);
                    }
                } catch (err) {
                    $log.error('error occurred when calling handle: ' + name);
                }
            }
        });
    };

    VideoService.prototype._setupVideo = function() {
        this.video.addEventListener('loadedmetadata', () => {
            this.duration = this.video.getDuration();
            this._triggerHandles('onInitLoading');
        });

        this.video.addEventListener('canplay', () => {
            this._canplay = true;

            if (this._autoStart || this.isPlaying) {
                this.play();
            } else {
                this._updateTime();
            }
        });

        this.video.addEventListener('playing', () => {
            this.isPlaying = true;
        });

        this.video.addEventListener('error', err => {
            if (this.isActive) {
                this.closeInstance();
            }
        });

        this.video.addEventListener('ended', () => {
            if (this.isActive) {
                this.pause();
                this._triggerHandles('onPlayEnd');
            }
        });
    };

    VideoService.prototype._initVideo = function() {
        if (!this._currentFile) {
            return;
        }

        this.video.setSrc(this._currentFile);
    };

    VideoService.prototype._reset = function() {
        this._currentFile = '';
        this._canplay = false;
        this._autoStart = false;

        this.currentTime = 0;
        this.duration = 0.0;
        this.progress = 0.0;    // [0, 100]
        this.isActive = false;
        this.isPlaying = false;

        this._stopStateUpdate();
    };

    VideoService.prototype.registerHandle = function(handle) {
        this._handles.push(handle);
    };

    VideoService.prototype.unregisterHandle = function(handle) {
        var index = this._handles.indexOf(handle);
        if (index >= 0) {
            this._handles.splice(index, 1);
        }
    };

    VideoService.prototype.initPlayback = function(config) {
        // {
        //     file,
        //     autoStart
        // }

        if (config.file) {
            this._currentFile = config.file;
        } else {
            this._currentFile = '';
        }

        this._autoStart = !!config.autoStart;

        this._initVideo(config);
        this.isActive = true;

        this._triggerHandles('onPlaybackSet', [config]);
    };

    VideoService.prototype.terminatePlayback = function() {
        if (this.isActive) {
            this.video.stop();
            this.video.setSrc('');

            this._reset();
            this._triggerHandles('onTerminate');
        }
    };

    /* =============== state management =============== */
    VideoService.prototype.useRefineStateUpdating = function() {
        this._refineStateUpdating = true;
    };

    VideoService.prototype._setupStateUpdate = function() {
        var video = this.video;

        this._refreshTimer.start(() => {
            if (this._canplay) {
                this._updateTime();

                if (this.currentTime >= this.duration) {
                    if (this.isPlaying) {
                        video.pause();
                        this.isPlaying = false;

                        this._triggerHandles('onPlayEnd');
                    }
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        });
    };

    VideoService.prototype._stopStateUpdate = function() {
        if (this._refreshTimer.isRunning) {
            this._refreshTimer.stop();
        }
    };

    /* =============== -- =============== */

    /* =============== time management =============== */
    VideoService.prototype._updateTime = function() {
        var video = this.video;
        var currentTime = video.getTime();

        this.currentTime = currentTime;
        this.progress = video.getPosition() * 100;

        if (this.currentTime > this.duration) {
            this.currentTime = this.duration;
        }

        this._triggerHandles('onTimeChange');
    };

    VideoService.prototype._isPassedTime = function(time) {
        return time >= this.video.getDuration();
    };

    /* =============== -- =============== */

    /* =============== control methods =============== */

    VideoService.prototype._playFromTime = function(time) {
        this._canplay = false;
        this.video.setTime(time);
    };

    VideoService.prototype.seekTo = function(newTime) {
        if (!this._canplay) {
            return;
        }

        var startTime = this._getStartTime();
        var endTime = this._getEndTime();

        var oldTime = clamp(0, this.duration, this.video.getTime());
        newTime = clamp(0, this.duration, newTime);

        if (newTime != oldTime) {
            this._playFromTime(newTime);
        }
    };

    VideoService.prototype.seekToPosition = function(position) {
        if (!this._canplay) {
            return;
        }

        var startTime = 0;
        var endTime = this.duration;

        var newTime = position * endTime + (1 - position) * startTime;

        if (isNaN(newTime)) {
            throw new TypeError('invalid position');
        } else {
            newTime = clamp(startTime, endTime, newTime);
        }

        var oldTime = clamp(startTime, endTime, this.video.getTime());
        if (newTime != oldTime) {
            this._playFromTime(newTime);
        }
    };

    VideoService.prototype.play = function() {
        this.isPlaying = true;
        if (this._canplay) {
            var currentTime = this.video.getTime();
            if (this._isPassedTime(currentTime)) {
                this.video.setTime(0);
            } else {
                this.video.play();
                if (this._refineStateUpdating) {
                    this._setupStateUpdate();
                }
                this.isPlaying = true;
                this._triggerHandles('onPlayStart');
            }
        }
    };

    VideoService.prototype.pause = function() {
        this.video.pause();
        this._stopStateUpdate();
        this.isPlaying = false;
    };

    VideoService.prototype.getVolume = function() {
        if (this.video.isMuted()) {
            return 0;
        } else {
            return this.video.getVolume();
        }
    };

    VideoService.prototype.setVolume = function(value) {
        return this.video.setVolume(value);
    };

    VideoService.prototype.isMute = function() {
        return this.video.isMuted();
    };

    VideoService.prototype.mute = function() {
        this.video.muteAudio(true);
    };

    VideoService.prototype.unmute = function() {
        this.video.muteAudio(false);
    };

    /* =============== -- =============== */


    return {
        createVideoService: function () {
            return new VideoService();
        },
        VideoService: VideoService
    };
}]);
angular.module('LINDGE.UI-Standard.Control.Waiting', [])

.directive('luiWaitingProgressNd', [function () {
    var template = `
        <div class="lui-waiting-progress">
            <div class="waiting-title" ng-bind="title"></div>
            <div class="waiting-progress">
                <div class="progress-bar"></div>
                <div class="progress-bar bar-2"></div>
            </div>
        </div>`;

    return {
        priority: 1,
        scope: {},
        require: '^luiWaiting',
        restrict: 'E',
        template: template,
        replace: false,
        link: function(scope, iElm, iAttrs, parentCtrl) {
            scope.title = '';

            parentCtrl.addComponent({
                onShow: function (param) {
                    scope.title = param.title;
                }
            });
        }
    };
}])

.directive('luiWaitingLoadingAnimation', [function () {
    var templates = {
        'line-scale': '<div class="line-scale"><div></div><div></div><div></div><div></div><div></div></div>',
        'circular': '<div class="waiting-circular"><md-progress-circular md-mode="indeterminate" md-diameter="25" color="#fff"></md-progress-circular></div>',
        'infinity': '<div class="waiting-infinity"><svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" focusable="false"><path fill="none" stroke="#ff9319" stroke-width="8" stroke-dasharray="164.2169140625 92.37201416015625" d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z" stroke-linecap="round" style="transform:scale(0.8);transform-origin:50px 50px"></path></svg></div>'
    };

    var animationActiveCls = 'waiting-animation-active';

    return {
        priority: 1,
        scope: {},
        require: '^luiWaiting',
        restrict: 'E',
        template: function (tElement, tAttrs) {
            var animation = tAttrs['animation'];
            if (animation) {
                var template = templates[animation];
                return !!template ? template : '<span></span>';
            }
        },
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs, parentCtrl) {
            var animationElm = iElm.children().eq(0);

            parentCtrl.addComponent({
                onShow: function (param) {
                    animationElm.addClass(animationActiveCls);
                },
                onHide: function () {
                    animationElm.removeClass(animationActiveCls);
                }
            });
        }
    };
}]);
angular.module('LINDGE-UI-Standard').run(['$templateCache', function ($templateCache) {
$templateCache.put("lui-tpl/AppNavigationFramework/navigation-collapse-btn.tmpl.html", "<div ng-show=\"showCollapseBtn\" class=\"appsidebar-collapse-btn\" style=\"z-index:2\"><div class=\"appsidebar-collapse-btn-inner\" ng-click=\"toggleCollapse()\"><div class=\"appsidebar-collapse-btn-shape\"></div><div class=\"appsidebar-collapse-btn-icon\"><i class=\"expand-icon\"></i></div></div></div>");

$templateCache.put("lui-tpl/AppNavigationFramework/navigation-framework-sidebar.tmpl.html", "<div class=\"lui-navframe-appsidebar\" ng-class=\"{collapsed:collapsed}\"><div class=\"appsidebar-content\"><div class=\"appsidebar-header\" ng-bind=\"header\"></div><div class=\"appsidebar-body\" ng-transclude></div></div></div>");

$templateCache.put("lui-tpl/AppNavigatorBar/app-navigator-bar.tmpl.html", "<div class=\"lui-app-navigator-bar\" ng-class=\"{'show-app-panel':showAppPanel}\"><div class=\"lui-app-navigator-wrapper\"><div class=\"app-list-header\" md-ink-ripple><div class=\"app-list-header-wrapper\" ng-click=\"toggleAppPanel()\"><span class=\"app-icon-box\"><i class=\"app-icon lic lic-app-start\"></i> </span><span class=\"app-list-header-title lui-text-truncate\">产品与服务</span> <span class=\"navigator-bar-controls\"><i class=\"control-icon lic lic-angle-right text-bold\"></i></span></div></div><div class=\"pinned-app-list\"><div class=\"app-item\" ng-class=\"{'app-item-active':app.$active}\" ng-repeat=\"app in pinnedApps\"><span class=\"app-icon-box\"><i class=\"app-icon lic\" ng-class=\"'lic-'+app.Icon\"></i> </span><a ng-href=\"{{app.Url}}\"><span class=\"app-item-title lui-text-truncate\" ng-bind=\"app.DisplayName\"></span> </a><span class=\"navigator-bar-controls\"><span class=\"control-wrapper app-remove-btn\" ng-click=\"togglePinndedState(app)\"><i class=\"control-icon lic lic-close\"></i></span></span></div></div></div><div class=\"app-panel\"><div class=\"app-panel-content\"><div class=\"app-panel-search\"><i class=\"app-panel-search-icon lic lic-search text-bold\"></i> <input type=\"text\" class=\"app-panel-search-input\" placeholder=\"请输入关键字\" ng-model=\"appFilter\" ng-change=\"filterApps()\"><div class=\"app-search-summary\" ng-show=\"appFilter\"><span ng-show=\"hasFilteredApps\">以下是&nbsp;“<span class=\"keyword\">{{appFilter}}</span>”&nbsp;相关的产品 </span><span ng-show=\"!hasFilteredApps\">未找到与&nbsp;“<span class=\"keyword\">{{appFilter}}</span>”&nbsp;相关的产品</span></div></div><div class=\"app-category-list\"><div class=\"app-category-list-wrapper clearfix\"><div class=\"app-category-column\" ng-repeat=\"groups in appColumns\"><div class=\"app-category-group\" ng-repeat=\"category in groups\"><div class=\"category-header\" ng-bind=\"category.DisplayName\"></div><div class=\"category-apps\"><div class=\"category-app-item\" ng-repeat=\"app in category.Apps\"><a class=\"lui-text-truncate\" ng-href=\"{{app.Url}}\"><span ng-bind=\"app.DisplayName\"></span> </a><span class=\"app-pin-control\" ng-click=\"togglePinndedState(app)\"><i class=\"lic lic-star pin-icon\" ng-show=\"app.IsCollected\"></i> <i class=\"lic lic-star-outline unpin-icon\" ng-show=\"!app.IsCollected\"></i></span></div></div></div></div></div></div></div></div></div>");

$templateCache.put("lui-tpl/AppNavigatorTopbar/app-navigator-topbar.tmpl.html", "<div class=\"lui-topbar layout-row\"><a ng-href=\"{{headerUrl}}\" class=\"topbar-headers layout-row topbar-click-btn\"><div class=\"topbar-header-icon topbar-icon\"><i class=\"lic lic-cloud\"></i></div><div class=\"topbar-header-name topbar-text-item lui-text-truncate\"><span ng-bind=\"name\"></span></div></a><span style=\"width:60px\"></span><div class=\"topbar-unit-path topbar-text-item lui-text-truncate hide-xs\" ng-bind=\"currentUnit.DisplayName\"></div><span class=\"flex-auto\"></span><div class=\"topbar-search hide-xs\" ng-show=\"showSearchbar\"><input type=\"text\" placeholder=\"搜索\" ng-model=\"$searchKey\" ng-keydown=\"$activeSearch($event)\"> <span class=\"search-icon\" ng-click=\"$activeSearch($event)\"><i class=\"lic lic-search\"></i></span></div><a class=\"topbar-click-btn topbar-icon dimmed\" ng-repeat=\"entrance in topbarEntranceList\" ng-href=\"{{entrance.href}}\" target=\"{{entrance.newTab?'_blank':''}}\" ng-click=\"callHandle($event, entrance)\" ng-disabled=\"entrance.disableHandle()\"><i class=\"lic\" ng-class=\"'lic-'+entrance.icon\"></i></a><div class=\"topbar-user-menu-btn topbar-click-btn\"><span class=\"topbar-avatar-wrapper\"><span class=\"topbar-avatar\"><img alt=\"\" ng-src=\"{{avatarId|platformImage:'avatar':'small'}}\"></span></span><div class=\"topbar-user-menu\"><div class=\"topbar-user-menu-header\"><span class=\"topbar-avatar\"><img alt=\"\" ng-src=\"{{avatarId|platformImage:'avatar':'small'}}\"> </span><span class=\"user-name\" ng-bind=\"userName\"></span></div><hr class=\"topbar-user-menu-separator\" ng-if=\"menuEntranceList.length>0\"><div class=\"topbar-user-menu-item\" ng-repeat=\"entrance in menuEntranceList\"><a class=\"menu-entrance\" ng-href=\"{{entrance.href}}\" target=\"{{entrance.newTab?'_blank':''}}\" ng-click=\"callHandle($event, entrance)\" ng-disabled=\"entrance.disableHandle()\"><span class=\"menu-item-icon\"><i class=\"lic\" ng-class=\"'lic-'+entrance.icon\"></i> </span><span class=\"menu-content\" ng-bind=\"entrance.text\"></span></a></div><hr class=\"topbar-user-menu-separator\"><div class=\"topbar-user-menu-item text-center\"><span class=\"menu-content\"><a ng-href=\"{{logoutUrl}}\">登出凌极云平台</a></span></div></div></div><div ng-transclude style=\"display:none\"></div></div>");

$templateCache.put("lui-tpl/AppNavigatorTopbar/topbar-simple.tmpl.html", "<div class=\"lui-topbar layout-row\"><div class=\"topbar-header-icon topbar-icon\"><i class=\"lic lic-cloud\"></i></div><div class=\"topbar-header-name topbar-text-item lui-text-truncate\"><span ng-bind=\"name\"></span></div><span class=\"flex-auto\"></span></div>");

$templateCache.put("lui-tpl/AudioPlayer/audio-player.tmpl.html", "<div class=\"lui-audio-player layout-row\"><div class=\"audio-player-control layout-row layout-align-start-center\"><button class=\"control-btn-seek-left\" ng-click=\"service.seekBy(-10);service.play()\"><span>10</span> <span class=\"arrow\"></span></button> <button class=\"control-btn btn-pause\" ng-click=\"service.pause($event)\" ng-show=\"service.isPlaying\"><i class=\"lic lic-player-pause-round\"></i></button> <button class=\"control-btn btn-play\" ng-click=\"service.play($event)\" ng-show=\"!service.isPlaying\"><i class=\"lic lic-player-start\"></i></button> <button class=\"control-btn-seek-right\" ng-click=\"service.seekBy(10);service.play()\"><span>10</span> <span class=\"arrow\"></span></button></div><div class=\"audio-progress\"><div class=\"progress-groove\"><div class=\"progress-sub\"></div></div><div class=\"progress-slide\"><span class=\"time-current\">0:00</span> &nbsp;/&nbsp; <span class=\"time-duration\">0:00</span></div></div></div>");

$templateCache.put("lui-tpl/DatePicker/datepicker-popup.tmpl.html", "<div class=\"lui-datepick-popup\"><md-calendar ng-model=\"ctrl.date\" ng-change=\"ctrl.onChange()\" md-min-date=\"ctrl.minDate\" md-max-date=\"ctrl.maxDate\" md-mode=\"ctrl.mode\"></md-calendar></div>");

$templateCache.put("lui-tpl/DatePicker/datepicker.tmpl.html", "<span class=\"datepicker-icon lic lic-calendar\"></span> <input readonly=\"\" ng-model=\"dateText\" placeholder=\"{{placeholder}}\"> <span class=\"datapicker-arrow lic lic-caret-down\"></span>");

$templateCache.put("lui-tpl/Pagination/pagination.tmpl.html", "<div class=\"lui-pagination\"><ul class=\"pagination-list clearfix\"><li class=\"infotag\" ng-show=\"controls.infotag\"><span ng-bind=\"getInfo()\"></span></li><li ng-show=\"controls.increment\"><button class=\"pagination-left\" ng-click=\"goLeft()\" ng-disabled=\"!hasLeft\"><i class=\"lic lic-angle-right lui-flip-horizontal\"></i></button></li><li ng-repeat=\"page in pageArray\"><button class=\"pagination-page\" ng-click=\"gotoPage(page)\" ng-class=\"{'current':page.active}\"><span ng-bind=\"page.title||page.number\"></span></button></li><li ng-show=\"pageArray.length==0\"><a href=\"\" class=\"pagination-page\"><span>1</span></a></li><li ng-show=\"controls.increment\"><button class=\"pagination-right\" ng-click=\"goRight()\" ng-disabled=\"!hasRight\"><i class=\"lic lic-angle-right\"></i></button></li><li ng-show=\"controls.fastjump\"><div class=\"fastjumper\">前往<input type=\"text\" ng-model=\"jumpPage\" ng-keypress=\"onFastJump($event)\" ng-focus=\"onFastJumperFocus($event)\" ng-blur=\"onFastJump($event)\">页</div></li></ul></div>");

$templateCache.put("lui-tpl/RichTextEdit/richtext.tmpl.html", "<div class=\"editor-wrapper\"><div class=\"lui-richtext-toolbar\"><div class=\"ql-formats\"><button class=\"ql-bold\"></button> <button class=\"ql-italic\"></button> <button class=\"ql-underline\"></button> <button class=\"ql-strike\"></button></div><span class=\"toolbar-sep-vertical\"></span><div class=\"ql-formats\"><button class=\"ql-list\" value=\"ordered\"></button> <button class=\"ql-list\" value=\"bullet\"></button></div><span class=\"toolbar-sep-vertical\"></span><div class=\"ql-formats\"><button class=\"ql-hr\"></button></div><span class=\"toolbar-sep-vertical\" ng-show=\"features.image\"></span><div class=\"ql-formats\" ng-show=\"features.image\"><button class=\"ql-image\"></button></div><hr></div><div class=\"editor-container\"></div></div>");

$templateCache.put("lui-tpl/Search/search.tmpl.html", "<div class=\"lui-search\" ng-class=\"{'has-button':showButton}\"><div class=\"input-wrapper\"><i class=\"search-icon lic lic-search\"></i> <input type=\"text\" ng-model=\"value\" placeholder=\"{{placeholder}}\" ng-change=\"onTextUpdate()\" ng-keypress=\"onKeypress($event)\"> <button class=\"reset-btn\" ng-click=\"reset()\" ng-show=\"value\"><i class=\"lic lic-fault-circle-fill\"></i></button></div><lui-button ng-if=\"showButton\" class=\"color-primary lui-primary\" ng-click=\"onButtonClick()\">搜索</lui-button></div>");

$templateCache.put("lui-tpl/SpinBox/spinbox.tmpl.html", "<div class=\"spinbox-wrapper\"><button type=\"button\" class=\"spinbox-minus\" ng-click=\"decrease()\" ng-disabled=\"ngDisabled\"></button> <input class=\"lui-form-control\" type=\"text\" ng-model=\"input\" ng-disabled=\"ngDisabled\" ng-keydown=\"onInputKeyDown($event)\" ng-blur=\"onInputChange()\"> <button type=\"button\" class=\"spinbox-plus\" ng-click=\"increase()\" ng-disabled=\"ngDisabled\"></button></div>");

$templateCache.put("lui-tpl/Table/table-pagination.tmpl.html", "<div class=\"layout-row\" ng-show=\"pageInfo.totalCount>1\"><span class=\"flex-auto\"></span><lui-pagination ng-model=\"pageInfo.current\" total-count=\"pageInfo.totalCount\" steps=\"pageInfo.steps\" ng-change=\"onPageChange()\" ui-infotag=\"共 {{params.total()}} 条\" ui-fastjump=\"true\"></lui-pagination></div>");

$templateCache.put("lui-tpl/UploadControl/upload-control-drop.tmpl.html", "<lui-file-dropper on-drop=\"triggerFileDrop\" ng-disabled=\"!canUpload||ngDisabled\" ng-click=\"triggerFileSelect($event)\"><div class=\"file-dropper-icon\"><i class=\"lic lic-upload-cloud\"></i></div><div class=\"file-dropper-text\">将文件拖到此处，或<span class=\"text-color-primary\">点击上传</span></div></lui-file-dropper><div class=\"upload-tip\" ng-bind=\"tip\" ng-if=\"tip\"></div><lui-upload-list ng-show=\"!useCustomTasklist&&fileList.length>0\" tasks=\"fileList\" desc-template=\"{{descTemplate}}\"><lui-upload-list></lui-upload-list></lui-upload-list>");

$templateCache.put("lui-tpl/UploadControl/upload-control.tmpl.html", "<button type=\"button\" class=\"upload-button\" ng-click=\"triggerFileSelect($event)\" ng-disabled=\"!canUpload||ngDisabled\" md-ink-ripple><i class=\"lic\"></i>&nbsp;&nbsp;{{buttonLabel}}</button><div class=\"upload-tip\" ng-bind=\"tip\" ng-if=\"tip\"></div><lui-upload-list ng-show=\"!useCustomTasklist&&fileList.length>0\" tasks=\"fileList\" desc-template=\"{{descTemplate}}\"><lui-upload-list></lui-upload-list></lui-upload-list>");

$templateCache.put("lui-tpl/UploadControl/upload-tasklist.tmpl.html", "<div class=\"upload-task\" ng-repeat=\"task in tasks\" ng-class=\"{progressing:task.isProgressing}\" title=\"{{task.description}}\"><div class=\"task-info lui-text-truncate\"><i class=\"lic\" ng-class=\"task.icon\"></i> {{getDesc(task)}}</div><div class=\"task-control\"><i class=\"close-icon lic lic-close\" ng-click=\"cancelOrDelete(task)\"></i> <i class=\"state-icon state-failed lic lic-fault-circle-fill\" ng-if=\"task.isFailed\"></i> <i class=\"state-icon state-success lic lic-check-circle-fill\" ng-if=\"!task.isFailed\"></i> <span class=\"progress-text\">{{task.progress*100|number:0}}%</span></div><div class=\"task-progress\" ng-if=\"task.isProgressing\"><div class=\"task-progress-bar\" ng-style=\"{width:(task.progress*100)+'%'}\"></div></div></div>");

$templateCache.put("lui-tpl/VideoPlayer/video-player.tmpl.html", "<div class=\"video-wrapper\" ng-click=\"togglePlay($event)\"></div><div class=\"video-overlay\"></div><div class=\"video-bottom-gradient\"></div><div class=\"video-bottom\"><div class=\"video-progress\"><div class=\"video-progress-groove\"><div class=\"video-load-progress\"></div><div class=\"video-play-progress\"></div></div><div class=\"video-progress-scrubber\"></div></div><div class=\"video-toolbar\"><button class=\"video-tool play-btn\" ng-click=\"togglePlay($event)\"><i class=\"lic lic-player-start-solid play-icon\"></i> <i class=\"lic lic-player-pause pause-icon\"></i></button><div class=\"video-volume-wrapper\"><button class=\"video-tool volume-btn\" ng-click=\"toggleMute($event)\"><i class=\"lic volume-icon\"></i></button><div class=\"volume-progress\"><div class=\"volume-progress-groove\"><div class=\"volume-progress-value\"></div></div><div class=\"volume-progress-scrubber\"></div></div></div><div class=\"video-time-display\"><span class=\"time-current\">0:0</span> <span class=\"time-separator\">/</span> <span class=\"time-duration\">0:0</span></div><span class=\"flex-auto\"></span> <button class=\"video-tool expand-btn\" ng-click=\"toggleFullscreen($event)\"><i class=\"lic lic-expand expand-icon\"></i> <i class=\"lic lic-shrink shrink-icon\"></i></button></div></div>");
}]);
angular.module('LINDGE-UI-Standard').config(['$luiIconProvider', function ($luiIconProvider) {
$luiIconProvider.registerIcon('exclamation-mark', {type:'svg',src:'local',content:' <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:version="1.1-dev (ec456fc, 2020-04-15)" sodipodi:docname="空列表 copy.svg" id="svg854" version="1.1" viewBox="0 0 512 512" height="512px" width="512px"><metadata id="metadata860"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/></cc:Work></rdf:RDF></metadata><defs id="defs858"/><sodipodi:namedview inkscape:current-layer="svg854" inkscape:window-maximized="1" inkscape:window-y="-8" inkscape:window-x="1912" inkscape:cy="272.06188" inkscape:cx="223.93475" inkscape:zoom="0.83984375" showgrid="false" id="namedview856" inkscape:window-height="1017" inkscape:window-width="1920" inkscape:pageshadow="2" inkscape:pageopacity="0" guidetolerance="10" gridtolerance="10" objecttolerance="10" borderopacity="1" bordercolor="#666666" pagecolor="#ffffff"/><title id="title846">图标/空列表 copy</title><desc id="desc848">Created with Sketch.</desc><g inkscape:label="exclamation-mark" fill-rule="evenodd" fill="none" stroke-width="1" stroke="none" id="图标/空列表-copy"><path fill-rule="nonzero" fill="#FF3B30" id="Combined-Shape" d="M 256,0 C 397.29231,0 512,114.70769 512,256 512,397.29231 397.29231,512 256,512 114.70769,512 0,397.29231 0,256 0,114.70769 114.70769,0 256,0 Z m 0,12 C 121.29167,12 12,121.29167 12,256 12,390.70833 121.29167,500 256,500 390.70833,500 500,390.70833 500,256 500,121.29167 390.70833,12 256,12 Z m -1,344 c 22.22222,0 40,17.77778 40,40 0,22.22222 -18.27161,40 -40,40 -21.7284,0 -40,-17.77778 -40,-40 0,-22.22222 17.77778,-40 40,-40 z m 0,10.37037 c -16.2963,0 -30.12346,13.33333 -30.12346,30.12346 0,16.29629 13.33334,30.12345 30.12346,30.12345 16.2963,0 30.12346,-13.33333 30.12346,-30.12345 0,-16.79013 -13.82716,-30.12346 -30.12346,-30.12346 z M 255,76 c 30.44643,0 55,24.66539 55,55.25048 0,87.80879 -48.61607,195.3499 -50.58036,199.78967 C 258.4375,333.01338 256.96429,334 255,334 c -1.96429,0 -3.4375,-0.98662 -4.41964,-2.95985 C 248.61607,326.60038 200,219.05927 200,131.25048 200,100.66539 224.55357,76 255,76 Z m 0,10.359465 c -25.04464,0 -45.17857,20.225625 -45.17857,45.384325 0,70.04971 32.90178,155.88527 45.17857,184.99044 12.27679,-29.10517 45.17857,-114.94073 45.17857,-184.99044 0,-25.1587 -20.13393,-45.384325 -45.17857,-45.384325 z"/><path fill="#FF3B30" fill-opacity="0.1" id="path851" d="m 255,366.37037 c 16.2963,0 30.12346,13.33333 30.12346,30.12346 0,16.79012 -13.82716,30.12345 -30.12346,30.12345 -16.79012,0 -30.12346,-13.82716 -30.12346,-30.12345 0,-16.79013 13.82716,-30.12346 30.12346,-30.12346 z m 0,-280.010905 c 25.04464,0 45.17857,20.225625 45.17857,45.384325 0,70.04971 -32.90178,155.88527 -45.17857,184.99044 -12.27679,-29.10517 -45.17857,-114.94073 -45.17857,-184.99044 0,-25.1587 20.13393,-45.384325 45.17857,-45.384325 z"/></g></svg>'});
$luiIconProvider.registerIcon('list-page', {type:'svg',src:'local',content:' <svg width="512px" height="512px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>图标/空列表</title><desc>Created with Sketch.</desc><g id="图标/空列表" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Group-3-Copy" fill="#FF9319" fill-rule="nonzero"><path d="M476,0 C495.882251,0 512,16.117749 512,36 L512,335 L357.5,512 L36,512 C16.117749,512 0,495.882251 0,476 L0,36 C0,16.117749 16.117749,0 36,0 L476,0 Z M502,331.249501 L502,36 C502,21.6405965 490.359403,10 476,10 L36,10 C21.6405965,10 10,21.6405965 10,36 L10,476 C10,490.359403 21.6405965,502 36,502 L352.955073,502 L502,331.249501 Z" id="Rectangle"></path><path d="M512,334 L355,512 L355,379 C355,354.147186 375.147186,334 400,334 L512,334 Z" id="Rectangle"></path><path d="M476,0 C495.882251,0 512,16.117749 512,36 L512,123 L0,123 L0,36 C0,16.117749 16.117749,0 36,0 L476,0 Z" id="Rectangle"></path><polygon id="Rectangle" points="127 178 127 245 60 245 60 178"></polygon><polygon id="Rectangle-Copy" points="127 267 127 334 60 334 60 267"></polygon><polygon id="Rectangle-Copy-2" points="127 356 127 423 60 423 60 356"></polygon><polygon id="Line" points="171 206 171 216 463 216 463 206"></polygon><polygon id="Line-Copy" points="171 296 171 306 336 306 336 296"></polygon><polygon id="Line-Copy-2" points="171.038608 383.961688 170.961688 393.961392 310.961392 395.038312 311.038312 385.038608"></polygon></g><path d="M489.845745,344 L400,344 C380.670034,344 365,359.670034 365,379 L365,485.544857 L489.845745,344 Z" id="Path" fill="#FFE9D1" fill-rule="nonzero"></path><polygon id="Path" fill="#FFE9D1" fill-rule="nonzero" points="117 188 70 188 70 235 117 235"></polygon><polygon id="Path" fill="#FFE9D1" fill-rule="nonzero" points="117 366 70 366 70 413 117 413"></polygon><polygon id="Path" fill="#FFE9D1" fill-rule="nonzero" points="117 277 70 277 70 324 117 324"></polygon><path d="M502,113 L502,36 C502,21.6405965 490.359403,10 476,10 L36,10 C21.6405965,10 10,21.6405965 10,36 L10,113 L502,113 Z" id="Path" fill="#FFE9D1" fill-rule="nonzero"></path></g></svg>'});
$luiIconProvider.registerIcon('list', {type:'svg',src:'local',content:' <svg width="512px" height="512px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>图标/空列表 copy</title><desc>Created with Sketch.</desc><g id="图标/空列表-copy" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="iconfinder_List_2290853" transform="translate(56.000000, 50.000000)" fill="#FF9319" fill-rule="nonzero"><path d="M152.404,376.551 L401,376.551 C403.761424,376.551 406,374.312424 406,371.551 C406,368.789576 403.761424,366.551 401,366.551 L152.404,366.551 C149.642576,366.551 147.404,368.789576 147.404,371.551 C147.404,374.312424 149.642576,376.551 152.404,376.551 Z" id="Path"></path><path d="M152.404,211 L401,211 C403.761424,211 406,208.761424 406,206 C406,203.238576 403.761424,201 401,201 L152.404,201 C149.642576,201 147.404,203.238576 147.404,206 C147.404,208.761424 149.642576,211 152.404,211 Z" id="Path"></path><path d="M152.404,45.45 L401,45.45 C403.761424,45.45 406,43.2114237 406,40.45 C406,37.6885763 403.761424,35.45 401,35.45 L152.404,35.45 C149.642576,35.45 147.404,37.6885763 147.404,40.45 C147.404,43.2114237 149.642576,45.45 152.404,45.45 Z" id="Path"></path><path d="M75.745,74.506 C75.745,74.9493134 75.3888326,75.304 74.93,75.304 C72.1685763,75.304 69.93,77.5425763 69.93,80.304 C69.93,83.0654237 72.1685763,85.304 74.93,85.304 C80.9023748,85.304 85.745,80.4815092 85.745,74.506 C85.745,71.7445763 83.5064237,69.506 80.745,69.506 C77.9835763,69.506 75.745,71.7445763 75.745,74.506 Z" id="Path"></path><path d="M74.93,75.305 L6.815,75.305 C4.05357625,75.305 1.815,77.5435763 1.815,80.305 C1.815,83.0664237 4.05357625,85.305 6.815,85.305 L74.93,85.305 C77.6914237,85.305 79.93,83.0664237 79.93,80.305 C79.93,77.5435763 77.6914237,75.305 74.93,75.305 Z" id="Path"></path><path d="M6.815,75.305 C6.35564561,75.305 6,74.950791 6,74.507 C6,71.7455763 3.76142375,69.507 1,69.507 C-1.76142375,69.507 -4,71.7455763 -4,74.507 C-4,80.4827196 0.8418387,85.305 6.815,85.305 C9.57642375,85.305 11.815,83.0664237 11.815,80.305 C11.815,77.5435763 9.57642375,75.305 6.815,75.305 Z" id="Path"></path><path d="M6,74.506 L6,6.445 C6,3.68357625 3.76142375,1.445 1,1.445 C-1.76142375,1.445 -4,3.68357625 -4,6.445 L-4,74.506 C-4,77.2674237 -1.76142375,79.506 1,79.506 C3.76142375,79.506 6,77.2674237 6,74.506 Z" id="Path"></path><path d="M6,6.445 C6,5.96811753 6.37177681,5.594 6.815,5.594 C9.57642375,5.594 11.815,3.35542375 11.815,0.594 C11.815,-2.16742375 9.57642375,-4.406 6.815,-4.406 C0.834830791,-4.406 -4,0.459271042 -4,6.445 C-4,9.20642375 -1.76142375,11.445 1,11.445 C3.76142375,11.445 6,9.20642375 6,6.445 Z" id="Path"></path><path d="M6.815,5.595 L74.93,5.595 C77.6914237,5.595 79.93,3.35642375 79.93,0.595 C79.93,-2.16642375 77.6914237,-4.405 74.93,-4.405 L6.815,-4.405 C4.05357625,-4.405 1.815,-2.16642375 1.815,0.595 C1.815,3.35642375 4.05357625,5.595 6.815,5.595 Z" id="Path"></path><path d="M74.93,5.595 C75.3737439,5.595 75.745,5.96863789 75.745,6.446 C75.745,9.20742375 77.9835763,11.446 80.745,11.446 C83.5064237,11.446 85.745,9.20742375 85.745,6.446 C85.745,0.460055469 80.9109578,-4.405 74.93,-4.405 C72.1685763,-4.405 69.93,-2.16642375 69.93,0.595 C69.93,3.35642375 72.1685763,5.595 74.93,5.595 Z" id="Path"></path><path d="M75.745,6.445 L75.745,74.506 C75.745,77.2674237 77.9835763,79.506 80.745,79.506 C83.5064237,79.506 85.745,77.2674237 85.745,74.506 L85.745,6.445 C85.745,3.68357625 83.5064237,1.445 80.745,1.445 C77.9835763,1.445 75.745,3.68357625 75.745,6.445 Z" id="Path"></path><path d="M75.745,240.074 C75.745,240.526617 75.3965471,240.873 74.93,240.873 C72.1685763,240.873 69.93,243.111576 69.93,245.873 C69.93,248.634424 72.1685763,250.873 74.93,250.873 C80.9061027,250.873 85.745,246.062844 85.745,240.074 C85.745,237.312576 83.5064237,235.074 80.745,235.074 C77.9835763,235.074 75.745,237.312576 75.745,240.074 Z" id="Path"></path><path d="M74.93,240.873 L6.815,240.873 C4.05357625,240.873 1.815,243.111576 1.815,245.873 C1.815,248.634424 4.05357625,250.873 6.815,250.873 L74.93,250.873 C77.6914237,250.873 79.93,248.634424 79.93,245.873 C79.93,243.111576 77.6914237,240.873 74.93,240.873 Z" id="Path"></path><path d="M6.815,240.873 C6.34648684,240.873 6,240.528654 6,240.074 C6,237.312576 3.76142375,235.074 1,235.074 C-1.76142375,235.074 -4,237.312576 -4,240.074 C-4,246.065421 0.837464381,250.873 6.815,250.873 C9.57642375,250.873 11.815,248.634424 11.815,245.873 C11.815,243.111576 9.57642375,240.873 6.815,240.873 Z" id="Path"></path><path d="M6,240.074 L6,171.979 C6,169.217576 3.76142375,166.979 1,166.979 C-1.76142375,166.979 -4,169.217576 -4,171.979 L-4,240.074 C-4,242.835424 -1.76142375,245.074 1,245.074 C3.76142375,245.074 6,242.835424 6,240.074 Z" id="Path"></path><path d="M6,171.979 C6,171.502118 6.37177681,171.128 6.815,171.128 C9.57642375,171.128 11.815,168.889424 11.815,166.128 C11.815,163.366576 9.57642375,161.128 6.815,161.128 C0.834830791,161.128 -4,165.993271 -4,171.979 C-4,174.740424 -1.76142375,176.979 1,176.979 C3.76142375,176.979 6,174.740424 6,171.979 Z" id="Path"></path><path d="M6.815,171.128 L74.93,171.128 C77.6914237,171.128 79.93,168.889424 79.93,166.128 C79.93,163.366576 77.6914237,161.128 74.93,161.128 L6.815,161.128 C4.05357625,161.128 1.815,163.366576 1.815,166.128 C1.815,168.889424 4.05357625,171.128 6.815,171.128 Z" id="Path"></path><path d="M74.93,171.128 C75.3742202,171.128 75.745,171.501115 75.745,171.979 C75.745,174.740424 77.9835763,176.979 80.745,176.979 C83.5064237,176.979 85.745,174.740424 85.745,171.979 C85.745,165.99227 80.9111679,161.128 74.93,161.128 C72.1685763,161.128 69.93,163.366576 69.93,166.128 C69.93,168.889424 72.1685763,171.128 74.93,171.128 Z" id="Path"></path><path d="M75.745,171.979 L75.745,240.074 C75.745,242.835424 77.9835763,245.074 80.745,245.074 C83.5064237,245.074 85.745,242.835424 85.745,240.074 L85.745,171.979 C85.745,169.217576 83.5064237,166.979 80.745,166.979 C77.9835763,166.979 75.745,169.217576 75.745,171.979 Z" id="Path"></path><path d="M75.745,405.607 C75.745,406.06851 75.4056881,406.405 74.93,406.405 C72.1685763,406.405 69.93,408.643576 69.93,411.405 C69.93,414.166424 72.1685763,416.405 74.93,416.405 C80.9099296,416.405 85.745,411.610136 85.745,405.607 C85.745,402.845576 83.5064237,400.607 80.745,400.607 C77.9835763,400.607 75.745,402.845576 75.745,405.607 Z" id="Path"></path><path d="M74.93,406.405 L6.815,406.405 C4.05357625,406.405 1.815,408.643576 1.815,411.405 C1.815,414.166424 4.05357625,416.405 6.815,416.405 L74.93,416.405 C77.6914237,416.405 79.93,414.166424 79.93,411.405 C79.93,408.643576 77.6914237,406.405 74.93,406.405 Z" id="Path"></path><path d="M6.815,406.405 C6.33879096,406.405 6,406.068986 6,405.607 C6,402.845576 3.76142375,400.607 1,400.607 C-1.76142375,400.607 -4,402.845576 -4,405.607 C-4,411.610344 0.834285945,416.405 6.815,416.405 C9.57642375,416.405 11.815,414.166424 11.815,411.405 C11.815,408.643576 9.57642375,406.405 6.815,406.405 Z" id="Path"></path><path d="M6,405.607 L6,337.528 C6,334.766576 3.76142375,332.528 1,332.528 C-1.76142375,332.528 -4,334.766576 -4,337.528 L-4,405.607 C-4,408.368424 -1.76142375,410.607 1,410.607 C3.76142375,410.607 6,408.368424 6,405.607 Z" id="Path"></path><path d="M6,337.528 C6,337.068702 6.37215435,336.695 6.815,336.695 C9.57642375,336.695 11.815,334.456424 11.815,331.695 C11.815,328.933576 9.57642375,326.695 6.815,326.695 C0.839997435,326.695 -4,331.555121 -4,337.528 C-4,340.289424 -1.76142375,342.528 1,342.528 C3.76142375,342.528 6,340.289424 6,337.528 Z" id="Path"></path><path d="M6.815,336.695 L74.93,336.695 C77.6914237,336.695 79.93,334.456424 79.93,331.695 C79.93,328.933576 77.6914237,326.695 74.93,326.695 L6.815,326.695 C4.05357625,326.695 1.815,328.933576 1.815,331.695 C1.815,334.456424 4.05357625,336.695 6.815,336.695 Z" id="Path"></path><path d="M74.93,336.695 C75.373367,336.695 75.745,337.068222 75.745,337.528 C75.745,340.289424 77.9835763,342.528 80.745,342.528 C83.5064237,342.528 85.745,340.289424 85.745,337.528 C85.745,331.554906 80.9057911,326.695 74.93,326.695 C72.1685763,326.695 69.93,328.933576 69.93,331.695 C69.93,334.456424 72.1685763,336.695 74.93,336.695 Z" id="Path"></path><path d="M75.745,337.528 L75.745,405.607 C75.745,408.368424 77.9835763,410.607 80.745,410.607 C83.5064237,410.607 85.745,408.368424 85.745,405.607 L85.745,337.528 C85.745,334.766576 83.5064237,332.528 80.745,332.528 C77.9835763,332.528 75.745,334.766576 75.745,337.528 Z" id="Path"></path></g></g></svg>'});
$luiIconProvider.registerIcon('star', {type:'svg',src:'local',content:' <svg width="512px" height="512px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>图标/空列表 copy</title><desc>Created with Sketch.</desc><g id="图标/空列表-copy" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Colour" transform="translate(19.000000, 15.000000)" fill-rule="nonzero"><path d="M236.661017,0.000162619343 C242.986114,0.000162619343 248.721396,3.71747571 251.307797,9.49344828 L298.160847,109.174655 C258.207384,130.551914 221.314105,157.21795 188.476441,188.453276 C159.389614,216.317424 133.969616,247.731787 112.803059,281.932372 L25.1988014,192.450517 C19.117956,186.137733 18.585951,176.31664 23.949248,169.383103 L23.9387829,169.395163 L147.782277,150.479483 C153.169746,149.584095 157.773911,146.097537 160.098888,141.152586 L222.014237,9.49344828 C224.600638,3.71747571 230.33592,0.000162619343 236.661017,0.000162619343 Z" id="Combined-Shape" fill-opacity="0.2" fill="#FF9319"></path><path d="M372.809492,303.207414 C368.943035,307.234649 367.214105,312.858019 368.149652,318.363621 L391.783729,463.013793 C393.073171,469.225206 390.681243,475.625355 385.635116,479.465816 C380.588987,483.306277 373.786616,483.90364 368.149153,481.001379 L353.585593,473.006897 C360.304562,469.558749 363.985505,462.124366 362.65661,454.686207 L339.022034,310.036034 C338.086618,304.530352 339.815735,298.90697 343.682373,294.879828 L443.962216,192.450517 C450.279368,185.855792 450.532217,175.530037 444.545424,168.633621 L464.019732,171.631552 C470.285792,172.834337 475.381653,177.390651 477.278538,183.486523 C479.175422,189.582394 477.565384,196.228203 473.089417,200.778103 L372.809492,303.207414 Z" id="Shape" fill-opacity="0.2" fill="#FF9319"></path><path d="M250.142712,7.41155172 L189.225424,136.988793 C186.900447,141.933744 182.296282,145.420302 176.908814,146.31569 L147.864915,150.72931 L147.781695,150.479483 C153.169163,149.584095 157.773329,146.097537 160.098305,141.152586 L222.014237,9.49344828 C224.425696,4.11877562 229.586914,0.498980192 235.458467,0.0644040318 C241.330019,-0.370172128 246.967278,2.45038645 250.142712,7.41155172 Z" id="Shape" fill="#FFFFFF"></path></g><ellipse id="Oval" fill="#FF9319" fill-rule="nonzero" cx="115.958951" cy="382.907845" rx="8.3220339" ry="8.32758621"></ellipse><path d="M255.661017,10.0000422 C263.823601,10.0000422 271.236686,14.7195495 274.66696,22.0052527 L274.832437,22.3656254 L336.748749,154.025571 C338.325037,157.378973 341.399795,159.772816 344.960139,160.475874 L345.295313,160.53681 L483.773957,181.688879 L483.961434,181.721176 C492.038892,183.271488 498.607351,189.144112 501.052385,197.000376 C503.455008,204.720368 501.492998,213.124999 495.957451,218.970676 L495.662811,219.275963 L395.416341,321.670163 C392.731159,324.467089 391.485161,328.339412 392.027613,332.195891 L392.083718,332.557356 L415.706,477.134 L415.759392,477.402432 C417.230126,485.236478 414.23721,493.244937 407.989422,498.191633 L407.663364,498.444749 C401.196592,503.366421 392.517221,504.20359 385.24204,500.638512 L384.860452,500.446809 L384.735953,500.380474 L260.766979,432.064135 C257.69862,430.323509 253.964028,430.269115 250.805036,431.928346 L126.58608,500.380474 L126.461582,500.446809 C119.110033,504.231707 110.238894,503.452766 103.65867,498.444749 C97.1893548,493.521143 94.0665507,485.371548 95.5626421,477.402432 L95.616,477.13 L105.756479,415.001325 C106.189583,412.347682 108.637434,410.525118 111.281784,410.84164 L111.496585,410.872017 C114.150228,411.305121 115.972793,413.752972 115.656271,416.397321 L115.625893,416.612123 L105.473012,478.819192 L105.433909,479.030191 C104.535784,483.356117 106.201512,487.813295 109.714902,490.487234 C113.136977,493.091675 117.71886,493.553069 121.580819,491.706527 L121.849,491.572 L245.620877,423.36621 C251.726487,419.902607 259.174959,419.834693 265.282448,423.134074 L389.472,491.572 L389.741215,491.706527 C393.501543,493.504476 397.944404,493.114361 401.334593,490.688392 L401.607132,490.487234 C405.03483,487.878513 406.703895,483.572479 405.949276,479.346928 L405.849163,478.820058 L382.21975,334.200873 C381.043362,327.274778 383.15154,320.203591 387.940156,315.024274 L388.23668,314.709554 L488.525407,212.27187 C491.70859,209.035703 492.853632,204.308201 491.504115,199.971998 C490.186983,195.739854 486.702556,192.551825 482.393296,191.607037 L482.153,191.557 L343.721059,170.411904 C336.846684,169.270064 330.953035,164.885181 327.876781,158.649347 L327.699089,158.280409 L314.909146,131.081391 C277.121624,151.81314 242.16829,177.355004 210.935255,207.0639 C177.112164,239.464886 148.299835,276.71742 125.440337,317.5946 C128.667672,322.285657 130.029809,328.062466 129.173956,333.754275 L129.106265,334.177086 L126.359994,350.832259 C125.910729,353.556891 123.337777,355.401441 120.613145,354.952177 C117.960213,354.514735 116.141653,352.063908 116.462498,349.420079 L116.493227,349.205328 L119.243479,332.526369 C119.893044,328.701994 118.748099,324.798536 116.184239,321.967505 L115.94722,321.714059 C115.887514,321.656215 115.829451,321.597053 115.773051,321.536646 L15.6674405,219.284337 C9.89922205,213.420109 7.82487475,204.855806 10.2696488,197.000376 C12.6739323,189.27505 19.0653387,183.467793 26.9579963,181.802283 L27.3605996,181.721176 L27.548077,181.688879 L165.962415,160.547061 C169.614477,159.940451 172.752136,157.629844 174.421493,154.336383 L174.573665,154.024763 L236.450833,22.4500822 C239.842497,14.8755558 247.36462,10.0000422 255.661017,10.0000422 Z M255.661017,20.0000422 C251.408403,20.0000422 247.542544,22.4416227 245.669272,26.3403274 L183.623325,158.279601 C180.656794,164.590613 174.835109,169.075842 167.935884,170.352096 L167.536669,170.422156 L29.165,191.558 L28.9287379,191.607037 C24.7245822,192.528781 21.3055138,195.585675 19.918143,199.66421 L19.8179191,199.971998 C18.50214,204.199796 19.5577507,208.799573 22.5693339,212.034152 L22.8048451,212.280244 L118.32679,309.84982 C141.407066,269.230174 170.270352,232.171012 204.030404,199.830455 C236.051588,169.371829 271.891377,143.215388 310.644808,122.015247 L265.744393,26.5368144 C263.963359,22.5592725 260.014884,20.0000422 255.661017,20.0000422 Z" id="Combined-Shape" fill="#FF9319" fill-rule="nonzero"></path></g></svg>'});}]);
}());