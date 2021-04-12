(function () {
'use strict';
angular.module('LINDGE-UI-Client', ['LINDGE-Service', 'LINDGE-UI-Core', 'LINDGE.UI-Client.Control.CardSelect', 'LINDGE.UI-Client.Control.Combobox', 'LINDGE.UI-Client.Control.TopbarClient']);
angular.module('LINDGE.UI-Client.Control.CardSelect', [])

.directive('luiCardSelect', [function () {
    return {
        priority: 1,
        scope: {
            ngDisabled: '='
        },
        controller: '$luiSingleSelectionDirectiveCtrl',
        require: ['luiCardSelect', '?ngModel'],
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

.directive('luiCardSelectItem', ['$animate', function ($animate) {
    var selectMark = angular.element('<div class="select-mark"><i class="lic lic-check"></i></div>');

    return {
        priority: 1,
        scope: {
            value: '=',
            ngDisabled: '='
        },
        require: '^luiCardSelect',
        template: '<div class="lui-card-item-wrapper" ng-transclude></div>',
        restrict: 'E',
        replace: false,
        transclude: true,
        link: function(scope, iElm, iAttrs, selectCtrl) {
            $animate.enabled(iElm, false);

            function setDisabled(disabled) {
                if (disabled) {
                    iElm.attr('disabled', true);
                } else {
                    iElm.removeAttr('disabled');
                }
            }

            if (selectCtrl) {
                iElm.append(selectMark.clone());

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
                        if (disabled) {
                            setDisabled(true);
                        } else {
                            if (!scope.ngDisabled) {
                                setDisabled(false);
                            }
                        }
                    },
                    isDisabled: function () {
                        return scope.ngDisabled || selectCtrl.isDisabled();
                    }
                };

                selectCtrl.registerItem(control);

                iElm.bind('click', function (evt) {
                    selectCtrl.onItemSelectChange(control, true);
                });

                scope.$on('$destroy', function () {
                    selectCtrl.deregisterItem(control);
                });

                scope.$watch('ngDisabled', function (newValue) {
                    setDisabled(newValue);
                });
            }
        }
    };
}]);
angular.module('LINDGE.UI-Client.Control.Combobox', [])

.directive('luiCombobox', [function () {
    return {
        priority: 1,
        scope: {
            ngDisabled: '='
        },
        controller: '$luiSingleSelectionDirectiveCtrl',
        require: ['luiCombobox', '?ngModel'],
        restrict: 'E',
        replace: false,
        link: function($scope, iElm, iAttrs, ctrls) {
            var thisCtrl = ctrls[0];
            var ngModelCtrl = ctrls[1];

            if (ngModelCtrl) {
                thisCtrl.bindNgModelCtrl(ngModelCtrl);
            }
        }
    };
}])

.directive('luiComboboxBtn', [function () {
    var ACTIVE_CLS = 'actived';

    return {
        priority: 1,
        scope: {
            value: '=',
            text: '@'
        },
        require: '^luiCombobox',
        restrict: 'E',
        template: '<button class="lui-combo-btn">{{text}}</button>',
        replace: false,
        link: function(scope, iElm, iAttrs, selectCtrl) {
            var btn = angular.element(iElm[0].querySelector('.lui-combo-btn'));

            if (selectCtrl) {
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
                        iElm.addClass(ACTIVE_CLS);
                    },
                    deselect: function () {
                        iElm.removeClass(ACTIVE_CLS);
                    },
                    setDisabled: function (disabled) {
                        return;
                    },
                    isDisabled: function () {
                        return false;
                    }
                };

                selectCtrl.registerItem(control);

                scope.$on('$destroy', function () {
                    selectCtrl.deregisterItem(control);
                });

                btn.bind('click', function (evt) {
                    selectCtrl.onItemSelectChange(control, true);
                });
            }
        }
    };
}]);
angular.module('LINDGE.UI-Client.Control.TopbarClient', [])

.service('$luiTopbarClientActions', [function () {
    var ITEM_POSITIONS = {
        LEFT: 'left',
        RIGHT: 'right'
    };

    var actions = {};

    this.ITEM_POSITIONS = ITEM_POSITIONS;

    this.registerAction = function (name, action) {
        if (typeof name == 'string' && name.length > 0) {
            actions[name] = action;
            return this;
        } else {
            throw new Error('invalid name');
        }
    };

    this.getAction = function (action) {
        return actions[action] || null;
    };
}])

.controller('$luiTopbarClientCtrl', ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
    /**
     * get current time stamp
     * @return {Number}
     */
    function getTime() {
        return (new Date()).getTime();
    }

    /**
     * ScheduleTask
     * @param {Number}   remain   [description]
     * @param {Function} callback [description]
     */
    function ScheduleTask(remain, callback) {
        this.start = getTime();
        this.remain = remain;
        this.callback = callback;

        this._discard = false;
    }

    ScheduleTask.prototype.discard = function() {
        this._discard = true;
    };

    ScheduleTask.prototype.isDiscard = function() {
        return this._discard;
    };

    /* -------------------- scheduler -------------------- */
    var minIntegralStep = 300;

    var timer = 0;
    var isReschedule = false;
    var latestTaskStartTime = -1;
    var nextRescheduleTime = -1;
    var schedulers = [];

    function clearTimer() {
        clearTimeout(timer);
        timer = 0;
    }

    function startTimer(delay, callback) {
        latestTaskStartTime = getTime();
        nextRescheduleTime = latestTaskStartTime + delay;
        timer = setTimeout(callback, delay);
    }
    
    function reschedule() {
        isReschedule = true;
        try {
            var newSchedulers = [];
            var minRemain = Infinity;

            var passedTime = getTime() - latestTaskStartTime;
            var i = 0;
            while (i < schedulers.length) {
                var schedule = schedulers[i];
                if (!schedule.isDiscard()) {
                    // only update schedule created before last round
                    if (schedule.start <= latestTaskStartTime) {
                        var remain = schedule.remain - passedTime;
                        if (remain > 0) {
                            schedule.remain = remain;
                            minRemain = Math.min(minRemain, remain);
                            newSchedulers.push(schedule);
                        } else {
                            schedule.callback.call(null);
                        }
                    } else {
                        minRemain = Math.min(minRemain, schedule.remain);
                        newSchedulers.push(schedule);
                    }
                }

                i++;
            }

            schedulers = newSchedulers;

            if (minRemain !== Infinity) {
                startTimer(minRemain, reschedule);
            } else {
                timer = 0;
            }
        } finally {
            isReschedule = false;
        }
    }

    this.schedule = function (callback, delay) {
        if (typeof callback != 'function') {
            throw new TypeError('callback must be function');
        }

        if (typeof delay != 'number' || isNaN(delay)) {
            throw new TypeError('delay must be number');
        }

        delay = Math.max(delay, minIntegralStep);

        var task = new ScheduleTask(delay, callback);
        schedulers.push(task);

        if (timer > 0) {
            if (!isReschedule) {
                // no need to launch reschedule when reschedule process is running
                if ((task.remain + task.start) < nextRescheduleTime) {
                    clearTimer();
                    reschedule();
                }
            }
        } else {
            startTimer(task.remain, reschedule);
        }

        return task;
    };

    this.stopSchedule = function () {
        if (timer > 0) {
            clearTimer();
            timer = 0;
        }
    };
}])

.directive('luiTopbarClient', [function () {
    var template = '<div class="lui-topbar-client clearfix" ng-transclude></div>';

    return {
        priority: 1,
        scope: {
            // homeMode: '@'
        },
        controller: '$luiTopbarClientCtrl',
        restrict: 'E',
        template: template,
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs, thisCtrl) {
            if (iAttrs.homeMode == 'true') {
                iElm.addClass('home-mode');

                window.addEventListener('scroll', function () {
                    if (window.scrollY > 0) {
                        iElm.addClass('highlight');
                    } else {
                        iElm.removeClass('highlight');
                    }
                });
            }

            scope.$on('$destroy', function () {
                thisCtrl.stopSchedule();
            });
        }
    };
}])

.directive('luiTopbarClientItem', ['$luiTopbarClientActions', '$mdInkRipple', '$luiHref',
function ($luiTopbarClientActions, $mdInkRipple, $luiHref) {
    var hrefOverride = 'javascript:void(0)';

    function getDefaultTemplate(position) {
        position = position || '';
        return  `<div class="lui-topbar-client-item ${position}"><a href="javascript:void(0)" ng-click="callback($event)" ng-transclude></a></div>`;
    }

    function generateStandardTemplate(config) {
        var additionalCls = Array.isArray(config.clses) ? config.clses.join(' ') : '';
        return [
            `<div class="lui-topbar-client-item ${config.position} ${additionalCls}">`,
            `<a href="${hrefOverride}" ng-click="callback($event)">`,
            !!config.icon ? `<i class="lic lic-${config.icon}" ng-if="icon!==false"></i>` : '',
            `<span class="title">${config.title}</span>`,
            '</a>',
            '</div>'
        ].join('');
    }

    function wrapCallback(callback, ...params) {
        return function () {
            return callback(...params);
        };
    }

    return {
        priority: 1,
        scope: {
            hook: '=',
            icon: '='
        },
        require: '^luiTopbarClient',
        restrict: 'E',
        template: function (tElement, tAttrs) {
            var tplName = tAttrs['action'];
            if (tplName) {
                var action = $luiTopbarClientActions.getAction(tplName);
                if (action) {
                    return generateStandardTemplate(action.template);
                } else {
                    return getDefaultTemplate(tAttrs['position']);
                }
            } else {
                return getDefaultTemplate(tAttrs['position']);
            }
        },
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs, topbarCtrl) {
            var href = iAttrs['href'];
            var action = iAttrs['action'];
            var hook = scope.hook;

            var actionDisable = iAttrs['disabled'] == 'true';
            if (actionDisable) {
                iElm.addClass('disable');
            } else {
                // add ink ripple effect
                var rippleCtrl = $mdInkRipple.attach(scope.$new(true), iElm, { center: false, fitRipple: true });
                rippleCtrl.color('#9c9c9c');
            }

            if (!actionDisable) {
                if (!angular.isFunction(hook)) {
                    hook = null;
                }

                var actionConfig = $luiTopbarClientActions.getAction(action);
                var actionCallback = (actionConfig && actionConfig.callback) || null;
                if (!actionCallback && href) {
                    actionCallback = function () {
                        $luiHref.goto(href);
                    };
                }

                if (actionCallback) {
                    actionCallback = wrapCallback(actionCallback, iAttrs);

                    if (hook) {
                        scope.callback = wrapCallback(hook, actionCallback);
                    } else {
                        scope.callback = actionCallback;
                    }
                } else {
                    if (hook) {
                        scope.callback = wrapCallback(hook);
                    }
                }
            }
        }
    };
}])

.directive('luiTopbarClientTitle', [function () {
    var template = '<div class="topbar-text-info lui-topbar-client-item left" ng-transclude></div>';

    return {
        priority: 1,
        scope: {},
        require: '^luiTopbarClient',
        restrict: 'E',
        template: template,
        replace: true,
        transclude: true
    };
}])

.directive('luiTopbarClientDate', [function () {
    var template = '<div class="topbar-text-info lui-topbar-client-item right"></div>';

    var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    function formatNumber(number) {
        if (number < 10) {
            return '0' + number;
        } else {
            return String(number);
        }
    }

    function formatDate(date) {
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var weekDay = weekDays[date.getDay()];
        var hour = date.getHours();
        var minute = date.getMinutes();
        var isAM = hour <= 12;

        if (!isAM) {
            hour -= 12;
        }

        return `${month}月${day}日 ${weekDay} ${isAM ? '上午' : '下午'} ${formatNumber(hour)}:${formatNumber(minute)}`;
    }

    function formatDateShort(date) {
        var hour = date.getHours();
        var minute = date.getMinutes();
        var isAM = hour <= 12;

        if (!isAM) {
            hour -= 12;
        }

        return `${isAM ? '上午' : '下午'} ${formatNumber(hour)}:${formatNumber(minute)}`;
    }

    return {
        priority: 1,
        scope: {
            formatter: '@'
        },
        require: '^luiTopbarClient',
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        link: function(scope, iElm, iAttrs, topbarCtrl) {
            var formatter = (scope.formatter == 'short') ? formatDateShort : formatDate;

            function updateTime(initDelay) {
                var now = new Date();
                var timeStr = formatter(now);

                iElm.text(timeStr);

                var delay = !!initDelay ? initDelay * 1000 : 60000;

                topbarCtrl.schedule(updateTime, delay);
            }

            var currentSecond = (new Date()).getSeconds();
            updateTime(60 - currentSecond);
        }
    };
}])

.directive('luiTopbarClientTimer', [function () {
    var template = [
        '<div class="topbar-text-info lui-topbar-client-item right topbar-timer">',
        '<span class="title" ng-bind="title"></span>',
        '<span class="time" ng-bind="$seconds|periodFormatFilter:true"></span>',
        '</div>'
    ].join('');

    return {
        priority: 1,
        scope: {
            initSeconds: '=',
            countDown: '=',
            title: '@'
        },
        require: '^luiTopbarClient',
        restrict: 'E',
        template: template,
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs, topbarCtrl) {
            scope.$seconds = 0;

            var offset = scope.countDown ? -1 : 1;
            var interval = 1000;

            var currentTask = null;

            function updateTime() {
                scope.$seconds += offset;
                if (scope.$seconds < 0) {
                    scope.$seconds = 0;
                }

                scope.$apply();

                currentTask = topbarCtrl.schedule(updateTime, interval);
            }

            scope.$watch('initSeconds', function (newValue) {
                var time = Number(newValue);
                if (isNaN(time)) {
                    scope.$seconds = 0;
                } else {
                    scope.$seconds = time;
                }

                if (currentTask) {
                    currentTask.discard();
                }

                currentTask = topbarCtrl.schedule(updateTime, interval);
            });
        }
    };
}]);

}());