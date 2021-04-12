(function () {
'use strict';
angular.module('LINDGE-UI-Core', ['LINDGE.UI-Core.Control.BindHtml', 'LINDGE.UI-Core.Graphics.Canvas', 'LINDGE.UI-Core.Graphics.Model', 'LINDGE.UI-Core.Control.Echarts', 'LINDGE.UI-Core.Control.Dialog', 'LINDGE.UI-Core.Control.FileDialog', 'LINDGE.UI-Core.Control.ImageFileDialog', 'LINDGE.UI-Core.Control.Icon', 'LINDGE.UI-Core.Control.Modal', 'LINDGE.UI-Core.Control.NgTable', 'LINDGE.UI-Core.Control.NgTableSupport', 'LINDGE.UI-Core.Control.NgTableControl', 'LINDGE.UI-Core.Control.Outscope', 'LINDGE.UI-Core.Control.Popover', 'LINDGE.UI-Core.scrollStick', 'LINDGE.UI-Core.Control.RightClick', 'LINDGE.UI-Core.Control.ProgressLinear', 'LINDGE.UI-Core.Control.Slider', 'LINDGE.UI-Core.Control.ScrollView', 'LINDGE.UI-Core.Control.TreeView', 'LINDGE.UI-Core.Control.Waiting', 'LINDGE.UI-Core.Filter.DOMTextFilter', 'LINDGE.UI-Core.Filter.Gender', 'LINDGE.UI-Core.Filter.Numbers', 'LINDGE.UI-Core.Filter.PlatformImage', 'LINDGE.UI-Core.Filter.TimeDisplayFilter', 'LINDGE.UI-Core.Filter.UnitsConversion', 'LINDGE.UI-Core.Service.DOMService', 'LINDGE.UI-Core.Service.Drag', 'LINDGE.UI-Core.Service.DragDrop', 'LINDGE.UI-Core.Service.GlobalClock', 'LINDGE.UI-Core.Service.HttpInterceptor', 'LINDGE.UI-Core.Initiate', 'LINDGE.UI-Core.Service.NgUtil', 'LINDGE.UI-Core.Constants.Scenario', 'LINDGE.UI-Core.Scroll', 'LINDGE.UI-Core.Service.SelectionControl', 'LINDGE.UI-Core.Service.SystemConfig', 'LINDGE.UI-Core.Timer', 'LINDGE.UI-Core.Service.UserInfo']);
angular.module('LINDGE.UI-Core.Control.BindHtml', [])

.directive('bindHtmlUnsafe', function() {
    return function(scope, element, attr) {
        element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
        scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
            element.html(value || '');
        });
    };
})

.directive('bindStyledHtml', ['$parse', function ($parse) {
    var styleTags = ['SPAN', 'B', 'I', 'U', 'UNDERLINE', 'SUP', 'DEL', 'BR', 'CODE'];

    return {
        priority: 1,
        restrict: 'A',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs) {
            var bindHTMLGetter = $parse(iAttrs['bindStyledHtml']);

            var offScreenNode = document.createElement('div');

            scope.$watch(bindHTMLGetter, function (newValue) {
                if (newValue) {
                    offScreenNode.innerHTML = newValue;
                    var fragment = document.createDocumentFragment();

                    var childNodes = offScreenNode.childNodes;
                    var i = 0;
                    while (i < childNodes.length) {
                        var node = childNodes[i];
                        if (node.nodeType == HTMLElement.TEXT_NODE) {
                            fragment.appendChild(node);
                        } else if (node.nodeType == HTMLElement.ELEMENT_NODE) {
                            if (styleTags.indexOf(node.tagName) >= 0) {
                                fragment.appendChild(node);
                            } else {
                                i++;
                            }
                        } else {
                            i++;
                        }
                    }

                    iElm.empty();
                    iElm.append(fragment);
                } else {
                    iElm.empty();
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Graphics.Canvas', [])

.factory('luiCanvas2d', [function (){
    var CTX_2D_TYPE = window.CanvasRenderingContext2D;
    var CANVAS_SUPPORTED = !!CTX_2D_TYPE;

    var CANVAS_2D_MARK = '2d';

    function isCanvasNode (node) {
        return (node instanceof window.Element) &&
               (node.tagName.toLowerCase() == 'canvas') &&
               (typeof node.getContext == 'function');
    }

    function createCanvas() {
        return document.createElement('canvas');
    }

    var STYLE_CONSTANTS = {
        LINE_CAP: {
            Butt: 'butt',
            Round: 'round',
            Square: 'square'
        },
        LINE_JOIN: {
            Bevel: 'bevel',
            Round: 'round',
            Miter: 'miter'
        },
        TEXT_ALIGN: {
            Left: 'left',
            Right: 'right',
            Center: 'center',
            Start: 'start',
            End: 'end'
        },
        TEXT_BASELINE: {
            Top: 'top',
            Hanging: 'hanging',
            Middle: 'middle',
            Alphabetic: 'alphabetic',
            Ideographic: 'ideographic',
            Bottom: 'bottom',
        },
        TEXT_DIRECTION: {
            LeftToRight: 'ltr',
            RightToLeft: 'rtl',
            InheritCss: 'inherit'
        }
    };

    /**
     * canvas wrapper
     *
     * @class      CanvasWrapper
     * @param      {HTMLCanvasElement=|CanvasRenderingContext2D=}  node
     */
    function CanvasWrapper (node){
        if (!CANVAS_SUPPORTED) {
            throw new Error('Canvas is not supported');
        } else {
            if (node === null || node === undefined) {
                this.canvas = createCanvas();
                this.ctx = this.canvas.getContext(CANVAS_2D_MARK);
            } else if (isCanvasNode(node)) {
                this.ctx = node.getContext(CANVAS_2D_MARK);
                this.canvas = node;
            } else if (node instanceof CTX_2D_TYPE) {
                this.ctx = node;
                this.canvas = node.canvas;
            } else {
                throw new TypeError('Expect canvas node or canvas 2d rendering for initialization');
            }
        }
    }

    // miscellaneous methods //

    CanvasWrapper.prototype.addClass = function() {
        if (arguments.length > 0) {
            var cls = Array.prototype.join.call(arguments, ' ');
            this.canvas.className += cls;
        }
    };

    CanvasWrapper.prototype.getSize = function() {
        var canvas = this.canvas;
        return [canvas.width, canvas.height];
    };

    CanvasWrapper.prototype.getBoundingRect = function() {
        var canvas = this.canvas;
        return canvas.getBoundingClientRect();
    };

    CanvasWrapper.prototype.resize = function(width, height, offsetX, offsetY) {
        var canvas = this.canvas;
        canvas.width = width + (offsetX || 0);
        canvas.height = height + (offsetY || 0);
    };

    CanvasWrapper.prototype.resizeToParent = function (offsetX, offsetY) {
        var canvas = this.canvas;
        var parentElm = canvas.parentElement;
        if (parentElm) {
            var parentWidth = parentElm.offsetWidth,
                parentHeight = parentElm.offsetHeight;

            this.resize(parentWidth, parentHeight, offsetX, offsetY);
        }
    };

    // style managing methods //

    CanvasWrapper.prototype.newDrawingState = function() {
        this.ctx.save();
    };

    CanvasWrapper.prototype.discardDrawingState = function() {
        this.ctx.restore();
    };

    // drawing methods //

    CanvasWrapper.prototype.clearRegion = function(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
    };

    CanvasWrapper.prototype.clear = function() {
        var currentSize = this.getSize();
        this.clearRegion(0, 0, currentSize[0], currentSize[1]);
    };

    CanvasWrapper.prototype.fillRegion = function(x, y, width, height, color) {
        if (color) {
            this.newDrawingState();
            this.ctx.fillStyle = String(color);
        }

        this.ctx.fillRect(0, 0, width, height);

        if (color) {
            this.discardDrawingState();
        }
    };

    CanvasWrapper.prototype.fillBg = function(color) {
        var currentSize = this.getSize();
        this.fillRegion(0, 0, currentSize[0], currentSize[1], color);
    };

    CanvasWrapper.prototype.drawLine = function(x1, y1, x2, y2, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        if (color) {
            this.newDrawingState();
            this.ctx.strokeStyle = String(color);
        }

        this.ctx.stroke();

        if (color) {
            this.discardDrawingState();
        }
    };

    CanvasWrapper.prototype.drawText = function(text, x, y, fill, fillColor, stroke, strokeColor) {
        if (typeof text != 'string') {
            throw new TypeError('invalid text to draw');
        }

        if (text.length === 0) {
            return;
        }

        if (fill === undefined) {
            fill = true;
        }

        var isolateState = (fill && !!fillColor) || (stroke && !!strokeColor);

        if (isolateState) {
            this.newDrawingState();

            if (fillColor) {
                this.ctx.fillStyle = String(fillColor);
            }

            if (strokeColor) {
                this.ctx.strokeStyle = String(strokeColor);
            }
        }

        if (fill) {
            this.ctx.fillText(text, x, y);
        }

        if (stroke) {
            this.ctx.strokeText(text, x, y);
        }

        if (isolateState) {
            this.discardDrawingState();
        }
    };

    // extension methods //

    CanvasWrapper.prototype.usePainter = function(painter) {
        if (!painter) {
            throw new Error('painter is null');
        }

        if (!(painter instanceof CanvasPainter)) {
            throw new TypeError('invalid painter');
        }

        var isolateState = painter.requireNewState();

        if (isolateState) {
            this.newDrawingState();
        }

        try {
            painter.prepare(this);

            try {
                var sizes = this.getSize();
                painter.draw(this, sizes[0], sizes[1]);
            } finally {
                painter.clean(this);
            }
        } finally {
            if (isolateState) {
                this.discardDrawingState();
            }
        }
    };

    // static methods //

    CanvasWrapper.supported = function () {
        return CANVAS_SUPPORTED;
    };

    CanvasWrapper.createCanvasElement = function (width, height) {
        var canvas = createCanvas();

        if (width > 0) {
            canvas.width = width;
        }

        if (height > 0) {
            canvas.height = height;
        }

        return canvas;
    };

    /**
     * canvas painter
     *
     * @class      CanvasPainter
     */
    function CanvasPainter () {
        return;
    }

    CanvasPainter.prototype.prepare = function(canvas) {
        return;
    };

    CanvasPainter.prototype.clean = function(canvas) {
        return;
    };

    CanvasPainter.prototype.draw = function(canvas, cWidth, cHeight) {
        throw new Error('CanvasPainter.draw is not implemented');
    };

    CanvasPainter.prototype.requireNewState = function() {
        return false;
    };

    return {
        Canvas: CanvasWrapper,
        CanvasPainter: CanvasPainter,
        STYLES: STYLE_CONSTANTS
    };
}]);
(function ()
{

'use strict';

angular.module('LINDGE.UI-Core.Graphics.Model', [])

.factory('luiGraphics', [function () {
    function Color(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;

        if (a === undefined) {
            this.a = 1.0;
        } else {
            this.a = a;
        }
    }

    Color.prototype.toString = function() {
        if (this.a < 1.0) {
            return ['rgba(', this.r, ',', this.g, ',', this.b, ',', this.a, ')'].join('');
        } else {
            return ['rgb(', this.r, ',', this.g, ',', this.b, ')'].join('');
        }
    };

    return {
        Color: Color
    };
}]);

}());
angular.module('LINDGE.UI-Core.Control.Echarts', ['LINDGE-Service'])

.config(['$moduleManagerProvider', function ($moduleManagerProvider) {
    $moduleManagerProvider.defineModule({
        id: 'echarts',
        components: [{
            id: 'echarts.js',
            path: '/CDN/Chart/echarts/4.0/echarts.min.js',
            type: $moduleManagerProvider.COMPONENT_TYPE.SCRIPT,
            scopeChecker: function () {
                return !!window.echarts;
            }
        }]
    });
}])

.factory('$chartUtilities', [function () {
    return {
        isAbsoluteStyle: function (style) {
            if (style) {
                return /^[\-+]?\d+(\.\d+)?px$/.test(style);
            } else {
                return false;
            }
        }
    };
}])

.service('$echartsManager', ['$rootScope', function ($rootScope) {
    var charts = [];

    function useChartControlById(id, callback) {
        if (id === null) {
            charts.forEach(function (item) {
                callback(item.control);
            });
        } else {
            charts.forEach(function (item) {
                if (item.key && item.key == id) {
                    callback(item.control);
                }
            });
        }
    }

    this.registerChart = function (key, chartControl) {
        if (!chartControl) {
            throw new Error('chart control is null');
        }

        var isValidKey = angular.isString(key) && key.length > 0;
        if (!isValidKey) {
            key = null;
        }

        charts.push({
            key: key,
            control: chartControl
        });
    };

    this.unregisterChart = function (chartControl) {
        for (var i = 0; i < charts.length; i++) {
            if (charts[i].control === chartControl) {
                charts.splice(i, 1);
                return;
            }
        }
    };

    this.init = function () {
        $rootScope.$on('echarts-force-redrawing', function (evt, id) {
            useChartControlById(id, function (control) {
                control.redraw();
            });
        });

        $rootScope.$on('echarts-force-resize', function (evt, id) {
            useChartControlById(id, function (control) {
                control.resize();
            });
        });
    };
}])

.directive('luiEcharts', ['$window', '$rootScope', '$chartUtilities', '$echartsManager', '$moduleManager', 'ElementStateMonitor',
function ($window, $rootScope, utilities, $echartsManager, $moduleManager, ElementStateMonitor) {
    var echarts = null;
    var echartsLoadHandle = $moduleManager.loadModule('echarts');

    echartsLoadHandle.then(function () {
        echarts = window.echarts;
        $echartsManager.init();
    });

    return {
        priority: 1,
        scope: {
            chartId: '=',
            options: '=',
            cornerPin: '=',
            noInterp: '=',
            domSize: '=',
            width: '@',
            height: '@',
            theme: '@',
            smartResize: '=',
            eventHandles: '='
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            var defaultTheme = 'lindge-default';
            var containerElm = $element.children().eq(0);

            function createChart (elm, theme) {
                if (theme) {
                    return echarts.init(elm, theme);
                } else {
                    return echarts.init(elm, defaultTheme);
                }
            }

            function pinElement (elm) {
                elm.css({
                    position: 'absolute',
                    left: '0px',
                    right: '0px',
                    top: '0px',
                    bottom: '0px'
                });
            }

            // initialize element position
            if ($scope.cornerPin) {
                pinElement(containerElm);
            } else {
                var initWidth = $scope.width || '100%';
                var initHeight = $scope.height || '100%';

                containerElm.css({ width: initWidth, height: initHeight });
            }

            // hide transclude element
            $element.children().eq(1).css('display', 'none');

            // initialize echart
            this.chartInstance = null;

            this.createChart = function () {
                if (this.chartInstance) {
                    return this.chartInstance;
                } else {
                    this.chartInstance = createChart(containerElm[0], $scope.theme);
                    return this.chartInstance;
                }
            };
        }],
        restrict: 'EA',
        template: '<div class="echarts"></div><div ng-transclude></div>',
        replace: false,
        transclude: true,
        link: function (scope, iElm, iAttrs, ctrl) {
            var chart = null;
            var currentEventHandles = null;
            var sizeWatcher = null;

            scope.isLoading = true;

            function updateChart() {
                if (!!scope.noInterp) {
                    chart.clear();
                }

                if (!!scope.domSize) {
                    chart.resize();
                }

                chart.setOption(scope.options, {
                    notMerge: true
                });
            }

            var chartControl = {
                redraw: function () {
                    scope.$evalAsync(updateChart);
                },
                resize: function () {
                    scope.$evalAsync(function () {
                        chart.resize();
                    });
                }
            };

            function createSizeWatcher() {
                var container = iElm.parent()[0];

                // only trigger resizing when size changing is stabilized,
                // this strategy makes sure resize() won't interfer with container animation
                var sizeChecker = new ElementStateMonitor.SizeChecker(container, true);
                sizeChecker.addCallback(function (newSize) {
                    chart.resize();
                });

                var monitor = new ElementStateMonitor.ElementStateMonitor();
                monitor.addChecker(sizeChecker);

                return monitor;
            }

            function readEventHandles(newHandle) {
                function iterEventParams(registerObj, callback) {
                    var names = Object.keys(registerObj);
                    for (var i = 0; i < names.length; i++) {
                        var evtName = names[i];
                        var handles = registerObj[evtName];
                        if (!Array.isArray(handles)) {
                            handles = [handles];
                        }

                        for (var j = 0; j < handles.length; j++) {
                            var handle = handles[j];
                            callback(evtName, handle);
                        }
                    }
                }

                if (currentEventHandles) {
                    iterEventParams(currentEventHandles, function (evtName, handler) {
                        chart.off(evtName, handler);
                    });

                    currentEventHandles = null;
                }

                if (newHandle) {
                    var handleCache = {};
                    iterEventParams(newHandle, function (evtName, params) {
                        if (!params) {
                            return;
                        }

                        if (typeof params == 'function') {
                            chart.on(evtName, params);
                        } else if (typeof params == 'object') {
                            var handler = params.handler;
                            if (typeof handler == 'function') {
                                chart.on(
                                    evtName,
                                    params.query ? params.query : '',
                                    handler,
                                    params.context ? params.context : null
                                );

                                if (handleCache.hasOwnProperty(evtName)) {
                                    handleCache[evtName].push(handler);
                                } else {
                                    handleCache[evtName] = [handler];
                                }
                            }
                        }
                    });

                    currentEventHandles = handleCache;
                }
            }

            function init() {
                $echartsManager.registerChart(scope.chartId, chartControl);

                scope.$watch('options', function (value) {
                    if (value) {
                        scope.$evalAsync(updateChart);
                    }
                }, true);

                scope.$watch('eventHandles', readEventHandles);

                if (scope.smartResize) {
                    sizeWatcher = createSizeWatcher();
                    sizeWatcher.beginWatch();
                } else {
                    if (scope.cornerPin ||
                        (!utilities.isAbsoluteStyle(scope.width) || !utilities.isAbsoluteStyle(scope.height))) {
                        angular.element($window).on('resize', function () {
                            chart.resize();
                        });
                    }
                }

                chart.resize();

                scope.$on('$destroy', function () {
                    $echartsManager.unregisterChart(chartControl);

                    if (sizeWatcher) {
                        sizeWatcher.stopWatch();
                    }
                });
            }

            echartsLoadHandle.then(function () {
                chart = ctrl.createChart();
                scope.isLoading = false;
                scope.$evalAsync(init);
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Dialog', ['LINDGE.UI-Core.Control.Modal'])

.controller('$luiDialogCtrl', ['mdPanelRef', 'setting', function (panelRef, setting) {
    this.setting = setting;

    this.cancel = function () {
        panelRef.$cancel();
    };

    this.confirm = function () {
        panelRef.$resolve();
    };
}])

.controller('$luiButtonDialogCtrl', ['mdPanelRef', 'setting', function (panelRef, setting) {
    this.setting = setting;

    if (Array.isArray(setting.buttons)) {
        this.buttons = setting.buttons.map((btn, index) => ({
            label: btn.label,
            class: btn.class,
            index: index
        }));
    } else {
        this.buttons = [];
    }

    this.onButtonClick = function (index) {
        panelRef.$resolve(index);
    };
}])

.controller('$luiInputDialogCtrl', ['mdPanelRef', 'setting', '$scope', function (panelRef, setting, $scope) {
    // form: inputDialogForm

    this.setting = setting;
    this.validation = setting.validation;

    this.input = {
        value: setting.default
    };

    this.cancel = function () {
        panelRef.$cancel();
    };

    this.confirmKey = function (evt) {
        if (this.setting.keyConfirm && evt.keyCode == 13) {
            evt.preventDefault();
            this.confirm();
        }
    };

    this.confirm = function () {
        if ($scope.inputDialogForm && $scope.inputDialogForm.$invalid) {
            $scope.inputDialogForm.$getControls()
                .forEach(function (ctrl) {
                    ctrl.$setTouched();
                });
            return;
        }

        panelRef.$resolve(this.input.value);
    };
}])

.provider('$luiDialog', [function () {
    const MSG_TYPES = {
        'info': 'info-circle'
    };

    var confirmTemplate = '';
    var alertTemplate = '';
    var inputTemplate = '';

    var buttonDialogConfig = {
        template: '',
        buttonConverter: null
    };

    var defaultConfirmLabel = '确认';
    var defaultCancelLabel = '取消';

    var maxQueueSize = 20;

    function validTemplate(template) {
        if (typeof template != 'string' || !template) {
            throw new Error('invalid template');
        }
    }

    this.registerMessageType = function (typeName, icon) {
        if (typeof typeName != 'string' || !typeName) {
            throw new Error('invalid type name');
        }

        if (!icon) {
            icon = '';
        }

        MSG_TYPES[typeName] = icon;
    };

    this.configConfirmDialog = function (template) {
        validTemplate(template);
        confirmTemplate = template;
    };

    this.configAlertDialog = function (template) {
        validTemplate(template);
        alertTemplate = template;
    };

    this.configButtonDialog = function (template, buttonConverter) {
        validTemplate(template);
        buttonDialogConfig.template = template;

        if (buttonConverter) {
            buttonDialogConfig.buttonConverter = buttonConverter;
        }
    };

    this.configInputDialog = function (template) {
        validTemplate(template);
        inputTemplate = template;
    };

    this.setMaxQueueSize = function (size) {
        if (size >= 1) {
            maxQueueSize = Math.floor(size);
        } else {
            throw new Error('queue size must be greater than 1');
        }
    };

    // service //
    function luiDialog($luiModal) {
        var instanceQueue = [];

        function createDialogSetting (title, content, userSetting) {
            var setting = {
                type: userSetting.msgType ? userSetting.msgType.trim() : 'info',
                typeIcon: '',
                title: title || '',
                textContent: '',
                styledContent: '',
                confirmLabel: userSetting.confirmLabel || defaultConfirmLabel,
                cancelLabel: userSetting.cancelLabel || defaultCancelLabel
            };

            if (userSetting.contentType == 'styled') {
                setting.styledContent = content;
            } else {
                setting.textContent = content;
            }

            if (setting.type && MSG_TYPES[setting.type]) {
                setting.typeIcon = `lic lic-${MSG_TYPES[setting.type]}`;
            }

            return setting;
        }

        function showModal(template, setting, dialogSetting, controller) {
            if (instanceQueue.length >= maxQueueSize) {
                throw new Error('too much waiting dialogs');
            }

            var modalSetting = {
                template: template,
                controller: controller,
                controllerAs: 'ctrl',
                locals: {
                    setting: dialogSetting
                },
                cssClass: 'lui-dialog',
                disableParentScroll: true,
                clickOutsideToClose: !!setting.clickOutsideToClose,
                layoutFeatures: $luiModal.$layout.SCREENCENTER,
                containerFixed: false
            };

            var modalInfo = $luiModal.create(modalSetting);
            var panel = modalInfo.panelRef;

            instanceQueue.push(panel);
            
            panel.$onClose(function () {
                instanceQueue.shift();
                if (instanceQueue.length > 0) {
                    instanceQueue[0].open();
                }
            });

            if (instanceQueue.length == 1) {
                panel.open();
            }

            return modalInfo.result;
        }

        return {
            alert: function (title, message, config) {
                config = config || {};
                var dialogSetting = createDialogSetting(title, message, config);
                return showModal(alertTemplate, config, dialogSetting, '$luiDialogCtrl');
            },
            confirm: function (title, message, config) {
                config = config || {};
                var dialogSetting = createDialogSetting(title, message, config);
                return showModal(confirmTemplate, config, dialogSetting, '$luiDialogCtrl');
            },
            showButtonDialog: function (title, message, config) {
                function convertButton(button) {
                    var btn;
                    if (typeof button == 'string') {
                        btn = {
                            label: button,
                            class: '',
                            role: null
                        };
                    } else {
                        btn = {
                            label: button.label,
                            class: button.class || '',
                            role: button.role || null
                        };
                    }

                    if (buttonDialogConfig.buttonConverter) {
                        btn = buttonDialogConfig.buttonConverter(btn);
                    }

                    return btn;
                }

                if (!buttonDialogConfig.template) {
                    throw new Error('button dialog is not support in current environment');
                }

                if (!config || !Array.isArray(config.buttons)) {
                    throw new Error('invalid button dialog config');
                }

                var dialogSetting = createDialogSetting(title, message, config);
                dialogSetting.buttons = config.buttons.map(convertButton);
                return showModal(buttonDialogConfig.template, config, dialogSetting, '$luiButtonDialogCtrl');
            },
            showInputDialog: function (title, message, config) {
                config = config || {};
                var dialogSetting = createDialogSetting(title, message, config);

                dialogSetting.inputLabel = config.inputLabel || '';
                dialogSetting.placeholder = config.placeholder || '';
                dialogSetting.default = config.default || '';
                dialogSetting.keyConfirm = !!config.keyConfirm;
                dialogSetting.validation = {
                    required: config.required || null
                };

                return showModal(inputTemplate, config, dialogSetting, '$luiInputDialogCtrl');
            }
        };
    }

    this.$get = ['$luiModal', luiDialog];
}]);
angular.module('LINDGE.UI-Core.Control.FileDialog', [])

.service('$luiFileDialog', [function () {
    // create a file input node
    function createInputInstance(id, parentNode) {
        var fileInputNode = document.createElement('input');
        fileInputNode.type = 'file';

        if (id) {
            fileInputNode.id = id;
        }

        fileInputNode.style.display = 'none';
        if (parentNode) {
            parentNode.appendChild(fileInputNode);
        } else {
            document.body.appendChild(fileInputNode);
        }

        return fileInputNode;
    }

    // helper function to active file input dialog
    function triggerFileInput (fileInput, selectionConfig) {
        initSelectionAttrs(fileInput, selectionConfig);

        fileInput.style.opacity = 0;
        fileInput.style.display = 'block';
        fileInput.focus();
        fileInput.click();
        fileInput.style.display = 'none';
    }

    // helper function to reset file input dialog
    function resetFileInput (fileInput) {
        fileInput.value = '';
    }

    // helper function to set/reset selection related attributes on input
    function initSelectionAttrs(fileInput, config) {
        if (!config) {
            return;
        }

        fileInput.multiple = !!config.multiple;
        fileInput.accept = config.accept || '';
    }

    function resetSelectionAttrs(fileInput) {
        fileInput.multiple = false;
        fileInput.accept = '';
    }

    // create default global file input
    var gFileInput = createInputInstance('g-file-dialog');
    var gFileHandler = null;

    gFileInput.addEventListener('change', function (e) {
        if (gFileHandler) {
            try {
                gFileHandler(gFileInput.files, gFileInput.files.length);
            } finally {
                gFileHandler = null;
                resetFileInput(gFileInput);
                resetSelectionAttrs(gFileInput);
            }
        }
    });

    function attachGlobalEvent (callback) {
        gFileHandler = callback;
    }

    // attach file dialog action to the global file selector
    function bindGlobalInputEvent(node, nevent, callback, selectionConfig) {
        node.addEventListener(nevent, function(e) {
            e.preventDefault();
            attachGlobalEvent(callback);
            triggerFileInput(gFileInput, selectionConfig);
        }, false);
    }

    // attach file dialog action to a file selector
    function bindLocalInputEvent(node, nevent, callback, selectionConfig) {
        var fileInput = createInputInstance(null, null);

        function changeCallback(e) {
            try {
                callback(fileInput.files, fileInput.files.length);
            } finally {
                resetFileInput(fileInput);
            }
        }

        fileInput.addEventListener('change', changeCallback);

        node.addEventListener(nevent, function(e) {
            e.preventDefault();
            triggerFileInput(fileInput);
        }, false);

        initSelectionAttrs(fileInput, selectionConfig);

        return fileInput;
    }

    return {
        /**
         * bind an event to a file selector
         * 
         * @param  {HTMLElement}    node            the node to attach the file select event
         * @param  {String}         nevent          name of the node's event
         * @param  {Function}       callback        the event handler
         * @param  {Boolean=}       createNewInput  whether create a new file selector, otherwise use the builtin global selector
         * @param  {Object=}        selectionConfig selection configuration (multiple selection, accept types, etc.)
         * 
         * @returns {HTMLElement}                   if a new file selector is created, return the created node
         */
        bindInputEvent: function(node, nevent, callback, createNewInput, selectionConfig) {
            if (!(node instanceof HTMLElement)) {
                throw new TypeError('Node must be HTMLElement');
            } else if (!angular.isFunction(callback)) {
                throw new TypeError('callback must be function');
            } else {
                if (!!createNewInput) {
                    return bindLocalInputEvent(node, nevent, callback, selectionConfig);
                } else {
                    bindGlobalInputEvent(node, nevent, callback, selectionConfig);
                    return null;
                }
            }
        },

        /**
         * trigger global file dialog directly
         * 
         * @param  {Function} callback
         * @pram   {Object=}  selectionConfig
         */
        triggerGlobalInput: function (callback, selectionConfig) {
            attachGlobalEvent(callback);
            triggerFileInput(gFileInput, selectionConfig);
        }
    };
}])

.directive('fileDialog', ['$luiFileDialog', function (fileDialog) {
    return {
        priority: 1,
        scope: false,
        restrict: 'A',
        replace: false,
        link: function(scope, iElm, iAttrs, controller) {
            var node = iElm[0];
            var bindInfo = iAttrs['fileDialog'];
            var accept = iAttrs['fileAccept'];
            var multiple = angular.isDefined(multiple);

            var event, callback;
            var configParts = bindInfo.split(';');
            if (configParts.length == 1) {
                event = 'click';
                callback = scope.$eval(configParts[0].trim());
            } else if (configParts.length == 2) {
                event = configParts[0].trim();
                callback = scope.$eval(configParts[1].trim());
            } else {
                return;
            }

            if (!angular.isFunction(callback)) {
                return;
            }

            var inputNode = fileDialog.bindInputEvent(
                node,
                event,
                function () {
                    callback.apply(null, arguments);
                    scope.$apply();
                },
                true,
                { multiple: multiple, accept: accept }
            );

            iElm.after(inputNode);
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.ImageFileDialog', ['LINDGE.UI-Core.Control.FileDialog'])

.constant('IMAGE_SELECTOR_EVENTS', {
    OVER_BIT_SIZE: 'image_to_large',
    OVER_SIZE: 'image_over_size',
    OVER_ASPECT_RATIO: 'image_over_aspect_ratio',
    INSUFFICIENT_SIZE: 'image_insufficient_size',
    INVALID_IMAGE_TYPE: 'not_support_image_type',
    IMGAE_UPDATE: 'image_select_success'
})

.service('$luiImageFileSelector', ['$luiFileDialog', 'IMAGE_SELECTOR_EVENTS', '$q', function (fileDialog, eventNames, $q) {
    function ImageConstraints() {
        this.maxFileSize = -1;
        this.maxWidth = -1;
        this.maxHeight = -1;
        this.minWidth = -1;
        this.minHeight = -1;
        this.maxRatio = Infinity;
    }

    ImageConstraints.prototype.readOptions = function(fSize, maxW, maxH, minW, minH, ratio) {
        var vfSize = parseFloat(fSize);
        if (!isNaN(vfSize)){
            this.maxFileSize = vfSize;
        }

        var vmaxW = parseInt(maxW);
        if (!isNaN(vmaxW)){
            this.maxWidth = vmaxW;
        }

        var vmaxH = parseInt(maxH);
        if (!isNaN(vmaxH)){
            this.maxHeight = vmaxH;
        }

        var vminW = parseInt(minW);
        if (!isNaN(vminW)){
            this.minWidth = vminW;
        }

        var vminH = parseInt(minH);
        if (!isNaN(vminH)){
            this.minHeight = vminH;
        }

        var aspectRatio = parseInt(ratio);
        if (!isNaN(aspectRatio)){
            this.maxRatio = aspectRatio;
        }
    };

    function ImageInfo(img) {
        if (img) {
            this.image = img;
            this.width = img.width;
            this.height = img.height;
        } else {
            this.image = null;
            this.width = 0;
            this.height = 0;
        }
        
        this.size = 0;
        this.type = '';
        this.err = null;
    }

    ImageInfo.prototype.setFileInfo = function(file) {
        this.size = file.size;
        this.type = file.type;
    };

    // image type validation
    function isImageType (type) {
        return (/^image\/.+/i).test(type);
    }

    function readImage (reader, file, constraint) {
        var defer = $q.defer();

        reader.onload = function (evt) {
            var dataUri = evt.target.result;
            var image = new Image();

            image.onload = function () {
                var result = new ImageInfo(image);
                result.setFileInfo(file);
                if ((constraint.maxWidth > 0 && image.width > constraint.maxWidth) ||
                    (constraint.maxHeight > 0 && image.height > constraint.maxHeight)) {
                    result.err = eventNames.OVER_SIZE;
                } else if (image.width < constraint.minWidth || image.height < constraint.minHeight) {
                    result.err = eventNames.INSUFFICIENT_SIZE;
                } else {
                    result.err = null;
                }

                defer.resolve(result);
            };

            image.src = dataUri;
        };

        reader.readAsDataURL(file);
        return defer.promise;
    }

    function bindTriggerElement (elm, constraints, reader, callback) {
        var imgConstraint = new ImageConstraints();
        if (constraints) {
            imgConstraint.readOptions(
                constraints.maxSize,
                constraints.maxWidth,
                constraints.maxHeight,
                constraints.minWidth,
                constraints.minHeight,
                constraints.ratio
            );
        }

        if (!reader) {
            reader = new FileReader();
        }

        fileDialog.bindInputEvent(elm, 'click', function (files, fileCount) {
            if (fileCount > 0) {
                var imgFile = files[0];

                var result;
                if (!isImageType(imgFile.type)) {
                    result = new ImageInfo();
                    result.err = eventNames.INVALID_IMAGE_TYPE;
                } else if (imgConstraint.maxFileSize > 0 && imgFile.size > imgConstraint.maxFileSize) {
                    result = new ImageInfo();
                    result.err = eventNames.OVER_BIT_SIZE;
                } else {
                    result = null;
                }

                if (result) {
                    result.setFileInfo(imgFile);
                    callback(result);
                } else {
                    readImage(reader, imgFile, imgConstraint).then(function (result) {
                        callback(result);
                    });
                }
            }
        }, true);
    }

    this.bindTriggerElement = bindTriggerElement;
}])

.directive('imageFileSelector', ['$luiImageFileSelector', '$rootScope', function (imageFileSelector, $rootScope) {
    return {
        priority: 1,
        scope: false,
        restrict: 'A',
        replace: false,
        link: function(scope, iElm, iAttrs, controller) {
            var handler = scope[iAttrs.handler];
            if (!angular.isFunction(handler)) {
                return;
            }

            var constraints = {
                maxSize: iAttrs.maxSize
            };
            var options = scope[iAttrs.options];
            if (options) {
                angular.extend(constraints, options);
            }

            var reader = new FileReader();

            imageFileSelector.bindTriggerElement(iElm[0], constraints, reader, function (result) {
                handler(result);
                if (!$rootScope.$$phase) {
                    scope.$apply();
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Icon', [])

.provider('$luiIcon', function () {
    /**
     * {
     *     name: String
     *     type: image|svg,
     *     src: local|remote,
     *     content: String,
     *     url: ''
     * }
     */
    var icons = {};

    var requests = {};

    var ICON_TYPE = {
        IMG: 'image',
        SVG: 'svg'
    };

    var ICON_SRC = {
        LOCAL: 'local',
        REMOTE: 'remote'
    };

    this.registerIcon = function (name, config) {
        if (!name || !config) {
            throw new Error('invalid icon');
        }

        var iconConfig = {
            name: name,
            type: '',
            src: '',
            content: '',
            url: '',
            cache: null
        };

        angular.extend(iconConfig, config);
        icons[name] = iconConfig;
    };

    function service($http, $q) {
        return {
            ICON_TYPE: ICON_TYPE,
            ICON_SRC: ICON_SRC,

            get: function (name) {
                var iconInfo = icons[name];
                if (iconInfo) {
                    return iconInfo;
                } else {
                    return null;
                }
            },

            download: function (iconInfo) {
                if (requests.hasOwnProperty(iconInfo.name)) {
                    return requests[iconInfo.name];
                } else {
                    var promise = $http.get(iconInfo.url)
                        .finally(function () {
                            delete requests[iconInfo.name];
                        });
                    requests[iconInfo.name] = promise;

                    return promise;
                }
            },

            listIcon: function () {
                return Object.keys(icons);
            }
        };
    }

    this.$get = ['$http', '$q', service];
})

.directive('luiIcon', ['$luiIcon', '$q', function ($luiIcon, $q) {
    var ICON_TYPE = $luiIcon.ICON_TYPE;
    var ICON_SRC = $luiIcon.ICON_SRC;

    var DOC_DECL_REG = /<\?xml.+?\?>/;

    function loadSVGIcon(iElm, iconInfo) {
        function instantiateSvg(iconInfo) {
            var virtualRoot = document.createElement('div');
            virtualRoot.innerHTML = iconInfo.content;       // TBD: load icon from remote
            var svgElm = virtualRoot.children[0];
            if (svgElm.tagName.toUpperCase() == 'SVG') {
                svgElm.setAttribute('width', '100%');
                svgElm.setAttribute('height', '100%');
                svgElm.setAttribute('focusable', 'false');

                iconInfo.cache = svgElm;
            }

            return iconInfo;
        }

        function showSVGIcon(iconInfo) {
            iElm.append(iconInfo.cache.cloneNode(true));
        }

        if (!!iconInfo.cache) {
            showSVGIcon(iconInfo);
        } else {
            if (iconInfo.src == ICON_SRC.REMOTE) {
                $luiIcon.download(iconInfo)
                    .then(function (result) {
                        var data = result.data;
                        if (typeof data == 'string') {
                            if (data.startsWith('<?xml')) {
                                data = data.replace(DOC_DECL_REG, '');
                            }

                            iconInfo.content = data;
                            instantiateSvg(iconInfo);
                            showSVGIcon(iconInfo);
                        } else {
                            return $q.reject('invalid download data');
                        }
                    });
            } else {
                instantiateSvg(iconInfo);
                showSVGIcon(iconInfo);
            }
        }
    }

    return {
        priority: 1,
        scope: false,
        restrict: 'E',
        replace: false,
        transclude: false,
        link: function(scope, iElm, iAttrs) {
            var iconName = iAttrs.icon;

            if (!iconName) {
                return;
            }

            var iconInfo = $luiIcon.get(iconName);

            if (!iconInfo) {
                return;
            }

            switch (iconInfo.type) {
                case ICON_TYPE.SVG:
                    loadSVGIcon(iElm, iconInfo);
                    break;
                // TBD
            }
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Modal', [])

.service('$luiModal', ['$q', '$mdPanel', function ($q, $mdPanel) {
    var classMapping = {
        SMALL: 'lui-modal modal-small',
        MEDIUM: 'lui-modal',
        DEFAULT: 'lui-modal'
    };

    var layoutEnums = {
        NONE: 0x0,
        SCROLLABLE: 0x01,
        SCREENCENTER: 0x02,
        CONTAINERFIXED: 0x04
    };

    function createModal (userConfig, modalCls) {
        var position = $mdPanel.newPanelPosition().absolute();
        var parent = document.body;

        // scrolling control
        var disableScroll = false;
        var currentOverflow = '';
        if (userConfig.disableParentScroll) {
            disableScroll = true;
            userConfig.disableParentScroll = false;
            currentOverflow = parent.style.overflow;
            parent.style.overflow = 'hidden';
        }

        if (!modalCls) {
            modalCls = '';
        }

        if (userConfig.cssClass) {
            modalCls += userConfig.cssClass;
        }

        var config = {
            attachTo: angular.element(parent),
            disableParentScroll: false,
            controllerAs: 'ctrl',
            hasBackdrop: true,
            panelClass: modalCls,
            position: position,
            trapFocus: true,
            clickOutsideToClose: true,
            escapeToClose: true,
            focusOnOpen: true,
            layoutFeatures: layoutEnums.NONE,
            containerFixed: false,
            zIndex: 1050,
            onDomAdded: function (panels) {
                var actualPanel = panels[1];
                var container = actualPanel.panelContainer;

                var layoutFeatures = config.layoutFeatures;

                // manage container and modal layout according to layout features
                if (layoutFeatures & layoutEnums.SCROLLABLE) {
                    container.css('overflow', 'auto').addClass('narrow-scroll');
                } else {
                    container.css('overflow', 'hidden');
                }

                if (layoutFeatures & layoutEnums.SCREENCENTER) {
                    container.addClass('layout-column');
                    var panelEl = container[0].querySelector('.md-panel');
                    if (panelEl) {
                        angular.element(panelEl).css({
                            'margin': 'auto',
                            'position': 'static'
                        });
                    }
                }

                if (layoutFeatures & layoutEnums.CONTAINERFIXED) {
                    panels[0].panelContainer.css('position', 'fixed');
                    container.css('position', 'fixed');
                }

                // call custom dom added function if provided
                if (angular.isFunction(userConfig.onDomAdded)) {
                    userConfig.onDomAdded(panels);
                }
            }
        };

        angular.extend(config, userConfig);

        config.layoutFeatures = layoutEnums.NONE | config.layoutFeatures;

        // handler
        var handlers = {
            'close': []
        };

        function execHandlers (name) {
            var list = handlers[name];
            if (list && list.length > 0) {
                for (var i = 0; i < list.length; i++) {
                    list[i]();
                }
            }
        }

        var userActionFlag = false;
        var defer = $q.defer();

        config.onDomRemoved = function () {
            if (!userActionFlag) {
                defer.reject(null);
            }

            if (disableScroll) {
                document.body.style.overflow = currentOverflow;
            }

            execHandlers('close');
        };

        function assamblePanel (panelRef) {
            panelRef.$resolve = function (value) {
                userActionFlag = true;
                panelRef.close().then(function () {
                    defer.resolve(value);
                });
            };

            panelRef.$cancel = function (value) {
                userActionFlag = true;
                panelRef.close().then(function () {
                    defer.reject(value);
                });
            };

            panelRef.$onClose = function (callback) {
                if (typeof callback == 'function') {
                    handlers['close'].push(callback);
                }
            };
        }

        var panelRef = $mdPanel.create(config);
        assamblePanel(panelRef);

        return {
            panelRef: panelRef,
            result: defer.promise
        };
    }

    this.open = function (config, sizeCls) {
        if (!config) {
            config = {};
        }

        var modalInfo = createModal(config, sizeCls);
        modalInfo.panelRef.open();

        return modalInfo;
    };

    this.create = function (config, sizeCls) {
        if (!config) {
            config = {};
        }

        return createModal(config, sizeCls);
    };

    this.$size = classMapping;
    this.$layout = layoutEnums;
}]);
(function(angular, factory) {
    'use strict';

    return factory(angular);
}(angular || null, function(angular) {
    'use strict';
/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

/**
 * @ngdoc module
 * @name ngTable
 * @description ngTable: Table + Angular JS
 * @example
 <doc:example>
 <doc:source>
 <script>
 var app = angular.module('myApp', ['LINDGE.UI-Core.Control.NgTable']);
 app.controller('MyCtrl', function($scope) {
                    $scope.users = [
                        {name: "Moroni", age: 50},
                        {name: "Tiancum", age: 43},
                        {name: "Jacob", age: 27},
                        {name: "Nephi", age: 29},
                        {name: "Enos", age: 34}
                    ];
                });
 </script>
 <table ng-table class="table">
 <tr ng-repeat="user in users">
 <td data-title="'Name'">{{user.name}}</td>
 <td data-title="'Age'">{{user.age}}</td>
 </tr>
 </table>
 </doc:source>
 </doc:example>
 */
var app = angular.module('LINDGE.UI-Core.Control.NgTable', []);
/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

 /**
 * @ngdoc value
 * @name ngTable.value:ngTableDefaultParams
 * @description Default Parameters for ngTable
 */
app.value('ngTableDefaults', {
    params: {},
    settings: {}
});

/**
 * @ngdoc service
 * @name ngTable.factory:ngTableParams
 * @description Parameters manager for ngTable
 */
app.factory('ngTableParams', ['$q', '$log', 'ngTableDefaults', function ($q, $log, ngTableDefaults) {
    var isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    var ngTableParams = function (baseParameters, baseSettings) {
        var self = this,
            log = function () {
                if (settings.debugMode && $log.debug) {
                    $log.debug.apply(this, arguments);
                }
            };

        this.data = [];

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#parameters
         * @methodOf ngTable.factory:ngTableParams
         * @description Set new parameters or get current parameters
         *
         * @param {string} newParameters      New parameters
         * @param {string} parseParamsFromUrl Flag if parse parameters like in url
         * @returns {Object} Current parameters or `this`
         */
        this.parameters = function (newParameters, parseParamsFromUrl) {
            parseParamsFromUrl = parseParamsFromUrl || false;
            if (angular.isDefined(newParameters)) {
                for (var key in newParameters) {
                    var value = newParameters[key];
                    if (parseParamsFromUrl && key.indexOf('[') >= 0) {
                        var keys = key.split(/\[(.*)\]/).reverse();
                        var lastKey = '';
                        for (var i = 0, len = keys.length; i < len; i++) {
                            var name = keys[i];
                            if (name !== '') {
                                var v = value;
                                value = {};
                                value[lastKey = name] = (isNumber(v) ? parseFloat(v) : v);
                            }
                        }
                        if (lastKey === 'sorting') {
                            params[lastKey] = {};
                        }
                        params[lastKey] = angular.extend(params[lastKey] || {}, value[lastKey]);
                    } else {
                        params[key] = (isNumber(newParameters[key]) ? parseFloat(newParameters[key]) : newParameters[key]);
                    }
                }
                log('ngTable: set parameters', params);
                return this;
            }
            return params;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#settings
         * @methodOf ngTable.factory:ngTableParams
         * @description Set new settings for table
         *
         * @param {string} newSettings New settings or undefined
         * @returns {Object} Current settings or `this`
         */
        this.settings = function (newSettings) {
            if (angular.isDefined(newSettings)) {
                if (angular.isArray(newSettings.data)) {
                    //auto-set the total from passed in data
                    newSettings.total = newSettings.data.length;
                }
                settings = angular.extend(settings, newSettings);
                log('ngTable: set settings', settings);
                return this;
            }
            return settings;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#page
         * @methodOf ngTable.factory:ngTableParams
         * @description If parameter page not set return current page else set current page
         *
         * @param {string} page Page number
         * @returns {Object|Number} Current page or `this`
         */
        this.page = function (page) {
            return angular.isDefined(page) ? this.parameters({'page': page}) : params.page;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#total
         * @methodOf ngTable.factory:ngTableParams
         * @description If parameter total not set return current quantity else set quantity
         *
         * @param {string} total Total quantity of items
         * @returns {Object|Number} Current page or `this`
         */
        this.total = function (total) {
            return angular.isDefined(total) ? this.settings({'total': total}) : settings.total;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#count
         * @methodOf ngTable.factory:ngTableParams
         * @description If parameter count not set return current count per page else set count per page
         *
         * @param {string} count Count per number
         * @returns {Object|Number} Count per page or `this`
         */
        this.count = function (count) {
            // reset to first page because can be blank page
            return angular.isDefined(count) ? this.parameters({'count': count, 'page': 1}) : params.count;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#filter
         * @methodOf ngTable.factory:ngTableParams
         * @description If parameter page not set return current filter else set current filter
         *
         * @param {string} filter New filter
         * @returns {Object} Current filter or `this`
         */
        this.filter = function (filter) {
            return angular.isDefined(filter) ? this.parameters({'filter': filter, 'page': 1}) : params.filter;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#sorting
         * @methodOf ngTable.factory:ngTableParams
         * @description If 'sorting' parameter is not set, return current sorting. Otherwise set current sorting.
         *
         * @param {string} sorting New sorting
         * @returns {Object} Current sorting or `this`
         */
        this.sorting = function (sorting) {
            if (arguments.length == 2) {
                var sortArray = {};
                sortArray[sorting] = arguments[1];
                this.parameters({'sorting': sortArray});
                return this;
            }
            return angular.isDefined(sorting) ? this.parameters({'sorting': sorting}) : params.sorting;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#isSortBy
         * @methodOf ngTable.factory:ngTableParams
         * @description Checks sort field
         *
         * @param {string} field     Field name
         * @param {string} direction Direction of sorting 'asc' or 'desc'
         * @returns {Array} Return true if field sorted by direction
         */
        this.isSortBy = function (field, direction) {
            return angular.isDefined(params.sorting[field]) && angular.equals(params.sorting[field], direction);
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#orderBy
         * @methodOf ngTable.factory:ngTableParams
         * @description Return object of sorting parameters for angular filter
         *
         * @returns {Array} Array like: [ '-name', '+age' ]
         */
        this.orderBy = function () {
            var sorting = [];
            for (var column in params.sorting) {
                sorting.push((params.sorting[column] === 'asc' ? '+' : '-') + column);
            }
            return sorting;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#getData
         * @methodOf ngTable.factory:ngTableParams
         * @description Called when updated some of parameters for get new data
         *
         * @param {Object} $defer promise object
         * @param {Object} params New parameters
         */
        this.getData = function ($defer, params) {
            if (angular.isArray(this.data) && angular.isObject(params)) {
                $defer.resolve(this.data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            } else {
                $defer.resolve([]);
            }
            return $defer.promise;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#getGroups
         * @methodOf ngTable.factory:ngTableParams
         * @description Return groups for table grouping
         */
        this.getGroups = function ($defer, column) {
            var defer = $q.defer();

            defer.promise.then(function (data) {
                var groups = {};
                angular.forEach(data, function (item) {
                    var groupName = angular.isFunction(column) ? column(item) : item[column];

                    groups[groupName] = groups[groupName] || {
                        data: []
                    };
                    groups[groupName]['value'] = groupName;
                    groups[groupName].data.push(item);
                });
                var result = [];
                for (var i in groups) {
                    result.push(groups[i]);
                }
                log('ngTable: refresh groups', result);
                $defer.resolve(result);
            });
            return this.getData(defer, self);
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#generatePagesArray
         * @methodOf ngTable.factory:ngTableParams
         * @description Generate array of pages
         *
         * @param {boolean} currentPage which page must be active
         * @param {boolean} totalItems  Total quantity of items
         * @param {boolean} pageSize    Quantity of items on page
         * @returns {Array} Array of pages
         */
        this.generatePagesArray = function (currentPage, totalItems, pageSize) {
            var maxBlocks, maxPage, maxPivotPages, minPage, numPages, pages;
            maxBlocks = 11;
            pages = [];
            numPages = Math.ceil(totalItems / pageSize);
            if (numPages > 1) {
                pages.push({
                    type: 'prev',
                    number: Math.max(1, currentPage - 1),
                    active: currentPage > 1
                });
                pages.push({
                    type: 'first',
                    number: 1,
                    active: currentPage > 1,
                    current: currentPage === 1
                });
                maxPivotPages = Math.round((maxBlocks - 5) / 2);
                minPage = Math.max(2, currentPage - maxPivotPages);
                maxPage = Math.min(numPages - 1, currentPage + maxPivotPages * 2 - (currentPage - minPage));
                minPage = Math.max(2, minPage - (maxPivotPages * 2 - (maxPage - minPage)));
                var i = minPage;
                while (i <= maxPage) {
                    if ((i === minPage && i !== 2) || (i === maxPage && i !== numPages - 1)) {
                        pages.push({
                            type: 'more',
                            active: false
                        });
                    } else {
                        pages.push({
                            type: 'page',
                            number: i,
                            active: currentPage !== i,
                            current: currentPage === i
                        });
                    }
                    i++;
                }
                pages.push({
                    type: 'last',
                    number: numPages,
                    active: currentPage !== numPages,
                    current: currentPage === numPages
                });
                pages.push({
                    type: 'next',
                    number: Math.min(numPages, currentPage + 1),
                    active: currentPage < numPages
                });
            }
            return pages;
        };

        this.generatePageConfig = function (current, total, pageSize) {
            var pageCount = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

            return {
                totalCount: pageCount,
                steps: 5,
                current: current
            };
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#url
         * @methodOf ngTable.factory:ngTableParams
         * @description Return groups for table grouping
         *
         * @param {boolean} asString flag indicates return array of string or object
         * @returns {Array} If asString = true will be return array of url string parameters else key-value object
         */
        this.url = function (asString) {
            asString = asString || false;
            var pairs = (asString ? [] : {});
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var item = params[key],
                        name = encodeURIComponent(key);
                    if (typeof item === 'object') {
                        for (var subkey in item) {
                            if (!angular.isUndefined(item[subkey]) && item[subkey] !== '') {
                                var pname = name + '[' + encodeURIComponent(subkey) + ']';
                                if (asString) {
                                    pairs.push(pname + '=' + item[subkey]);
                                } else {
                                    pairs[pname] = item[subkey];
                                }
                            }
                        }
                    } else if (!angular.isFunction(item) && !angular.isUndefined(item) && item !== '') {
                        if (asString) {
                            pairs.push(name + '=' + encodeURIComponent(item));
                        } else {
                            pairs[name] = encodeURIComponent(item);
                        }
                    }
                }
            }
            return pairs;
        };

        /**
         * @ngdoc method
         * @name ngTable.factory:ngTableParams#reload
         * @methodOf ngTable.factory:ngTableParams
         * @description Reload table data
         */
        this.reload = function () {
            var $defer = $q.defer(),
                self = this,
                pData = null;

            if (!settings.$scope) {
                return;
            }

            settings.$loading = true;
            if (settings.groupBy) {
                pData = settings.getGroups($defer, settings.groupBy, this);
            } else {
                pData = settings.getData($defer, this);
            }
            log('ngTable: reload data');

            if (!pData) {
                // If getData resolved the $defer, and didn't promise us data,
                //   create a promise from the $defer. We need to return a promise.
                pData = $defer.promise;
            }
            return pData.then(function (data) {
                settings.$loading = false;
                log('ngTable: current scope', settings.$scope);
                if (settings.groupBy) {
                    self.data = data;
                    if (settings.$scope) {
                        settings.$scope.$groups = data;
                    }
                } else {
                    self.data = data;
                    if (settings.$scope) {
                        settings.$scope.$data = data;
                    }
                }
                if (settings.$scope) {
                    // settings.$scope.pages = self.generatePagesArray(self.page(), self.total(), self.count());
                    settings.$scope.pageInfo = self.generatePageConfig(self.page(), self.total(), self.count());
                }
                settings.$scope.$emit('ngTableAfterReloadData');
                return data;
            });
        };

        this.reloadPages = function () {
            var self = this;
            // settings.$scope.pages = self.generatePagesArray(self.page(), self.total(), self.count());
            settings.$scope.pageInfo = self.generatePageConfig(self.page(), self.total(), self.count());
        };

        var params = this.$params = {
            page: 1,
            count: 1,
            filter: {},
            sorting: {},
            group: {},
            groupBy: null
        };
        angular.extend(params, ngTableDefaults.params);

        var settings = {
            $scope: null, // set by ngTable controller
            $loading: false,
            data: null, //allows data to be set when table is initialized
            total: 0,
            defaultSort: 'desc',
            filterDelay: 750,
            counts: [10, 25, 50, 100],
            getGroups: this.getGroups,
            getData: this.getData
        };
        angular.extend(settings, ngTableDefaults.settings);

        this.settings(baseSettings);
        this.parameters(baseParameters, true);
        return this;
    };
    return ngTableParams;
}]);

/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

/**
 * @ngdoc object
 * @name ngTable.directive:ngTable.ngTableController
 *
 * @description
 * Each {@link ngTable.directive:ngTable ngTable} directive creates an instance of `ngTableController`
 */
var ngTableController = ['$scope', 'ngTableParams', '$timeout', function ($scope, ngTableParams, $timeout) {
    var isFirstTimeLoad = true;
    $scope.$loading = false;

    if (!$scope.hasOwnProperty('params')) {
        $scope.params = new ngTableParams();
        $scope.params.isNullInstance = true;
    }
    $scope.params.settings().$scope = $scope;

    var delayFilter = (function () {
        var timer = 0;
        return function (callback, ms) {
            $timeout.cancel(timer);
            timer = $timeout(callback, ms);
        };
    })();

    function resetPage() {
        $scope.params.$params.page = 1;
    }

    $scope.$watch('params.$params', function (newParams, oldParams) {

        if (newParams === oldParams) {
            return;
        }

        $scope.params.settings().$scope = $scope;

        if (!angular.equals(newParams.filter, oldParams.filter)) {
            var maybeResetPage = isFirstTimeLoad ? angular.noop : resetPage;
            delayFilter(function () {
                maybeResetPage();
                $scope.params.reload();
            }, $scope.params.settings().filterDelay);
        } else {
            $scope.params.reload();
        }

        if (!$scope.params.isNullInstance) {
            isFirstTimeLoad = false;
        }

    }, true);

    $scope.sortBy = function (column, event) {
        var parsedSortable = $scope.parse(column.sortable);
        if (!parsedSortable) {
            return;
        }
        var defaultSort = $scope.params.settings().defaultSort;
        var inverseSort = (defaultSort === 'asc' ? 'desc' : 'asc');
        var sorting = $scope.params.sorting() && $scope.params.sorting()[parsedSortable] && ($scope.params.sorting()[parsedSortable] === defaultSort);
        var sortingParams = (event.ctrlKey || event.metaKey) ? $scope.params.sorting() : {};
        sortingParams[parsedSortable] = (sorting ? inverseSort : defaultSort);
        $scope.params.parameters({
            sorting: sortingParams
        });
    };
}];

/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

app.provider('$ngTableConfig', [function () {
    var pagerTemplate = '';

    this.setPagerTemplateUrl = function (templateUrl) {
        templateUrl = templateUrl.trim();
        if (!templateUrl) {
            throw new Error('templateUrl is empty');
        }

        pagerTemplate = templateUrl;
    };

    this.$get = [function () {
        return {
            pagerTemplate: pagerTemplate
        };
    }];
}]);

/**
 * @ngdoc directive
 * @name ngTable.directive:ngTable
 * @restrict A
 *
 * @description
 * Directive that instantiates {@link ngTable.directive:ngTable.ngTableController ngTableController}.
 */
app.directive('ngTable', ['$compile', '$q', '$parse', '$ngTableConfig',
    function ($compile, $q, $parse, $ngTableConfig) {
        return {
            restrict: 'A',
            priority: 1001,
            scope: true,
            controller: ngTableController,
            compile: function (element) {
                var columns = [], i = 0, row = null;

                // custom header
                var thead = element.find('thead');

                // IE 8 fix :not(.ng-table-group) selector
                angular.forEach(angular.element(element.find('tr')), function (tr) {
                    tr = angular.element(tr);
                    if (!tr.hasClass('ng-table-group') && !row) {
                        row = tr;
                    }
                });
                if (!row) {
                    return;
                }
                angular.forEach(row.find('td'), function (item) {
                    var el = angular.element(item);
                    if (el.attr('ignore-cell') && 'true' === el.attr('ignore-cell')) {
                        return;
                    }
                    var parsedAttribute = function (attr, defaultValue) {
                        return function (scope) {
                            return $parse(el.attr('x-data-' + attr) || el.attr('data-' + attr) || el.attr(attr))(scope, {
                                $columns: columns
                            }) || defaultValue;
                        };
                    };

                    var parsedTitle = parsedAttribute('title', ' '),
                        headerTemplateURL = parsedAttribute('header', false),
                        filter = parsedAttribute('filter', false)(),
                        filterTemplateURL = false,
                        filterName = false;

                    if (filter && filter.$$name) {
                        filterName = filter.$$name;
                        delete filter.$$name;
                    }
                    if (filter && filter.templateURL) {
                        filterTemplateURL = filter.templateURL;
                        delete filter.templateURL;
                    }

                    el.attr('data-title-text', parsedTitle()); // this used in responsive table
                    columns.push({
                        id: i++,
                        title: parsedTitle,
                        sortable: parsedAttribute('sortable', false),
                        'class': el.attr('x-data-header-class') || el.attr('data-header-class') || el.attr('header-class'),
                        filter: filter,
                        filterTemplateURL: filterTemplateURL,
                        filterName: filterName,
                        headerTemplateURL: headerTemplateURL,
                        filterData: (el.attr('filter-data') ? el.attr('filter-data') : null),
                        show: (el.attr('ng-show') ? function (scope) {
                            return $parse(el.attr('ng-show'))(scope);
                        } : function () {
                            return true;
                        })
                    });
                });
                return function (scope, element, attrs) {
                    scope.$loading = false;
                    scope.$columns = columns;
                    scope.$filterRow = {};

                    scope.$watch(attrs.ngTable, function (params) {
                        if (angular.isUndefined(params)) {
                            return;
                        }
                        scope.paramsModel = $parse(attrs.ngTable);
                        scope.params = params;
                    }, true);
                    scope.parse = function (text) {
                        return angular.isDefined(text) ? text(scope) : '';
                    };
                    if (attrs.showFilter) {
                        scope.$parent.$watch(attrs.showFilter, function (value) {
                            scope.show_filter = value;
                        });
                    }
                    if (attrs.disableFilter) {
                        scope.$parent.$watch(attrs.disableFilter, function (value) {
                            scope.$filterRow.disabled = value;
                        });
                    }
                    angular.forEach(columns, function (column) {
                        var def;
                        if (!column.filterData) {
                            return;
                        }
                        def = $parse(column.filterData)(scope, {
                            $column: column
                        });
                        // if we're working with a deferred object, let's wait for the promise
                        if((angular.isObject(def) && angular.isObject(def.promise))){
                            delete column.filterData;
                            return def.promise.then(function (data) {
                                // our deferred can eventually return arrays, functions and objects
                                if (!angular.isArray(data) && !angular.isFunction(data) && !angular.isObject(data)) {
                                    // if none of the above was found - we just want an empty array
                                    data = [];
                                } else if(angular.isArray(data)) {
                                    data.unshift({
                                        title: '-',
                                        id: ''
                                    });
                                }
                                column.data = data;
                            });
                        }
                        // otherwise, we just return what the user gave us. It could be a function, array, object, whatever
                        else {
                            return column.data = def;
                        }
                    });
                    if (!element.hasClass('ng-table')) {
                        scope.templates = {
                            header: (attrs.templateHeader ? attrs.templateHeader : 'lui-tpl/NgTable/header.tmpl.html'),
                            pagination: (attrs.templatePagination ? attrs.templatePagination : $ngTableConfig.pagerTemplate)
                        };

                        if (!scope.templates.pagination) {
                            scope.templates.pagination = 'lui-tpl/NgTable/pager.tmpl.html';
                        }

                        var headerTemplate = thead.length > 0 ? thead : angular.element(document.createElement('thead')).attr('ng-include', 'templates.header');
                        var paginationTemplate = angular.element(document.createElement('div')).attr({
                            'ng-table-pagination': 'params',
                            'template-url': 'templates.pagination'
                        });

                        element.find('thead').remove();

                        element.addClass('ng-table')
                            .prepend(headerTemplate)
                            .after(paginationTemplate);

                        $compile(headerTemplate)(scope);
                        $compile(paginationTemplate)(scope);
                    }
                };
            }
        };
    }
]);

/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

/**
 * @ngdoc directive
 * @name ngTable.directive:ngTablePagination
 * @restrict A
 */
app.directive('ngTablePagination', ['$compile',
    function ($compile) {
        return {
            restrict: 'A',
            scope: {
                'params': '=ngTablePagination',
                'templateUrl': '='
            },
            replace: false,
            link: function (scope, element, attrs) {
                scope.params.settings().$scope.$on('ngTableAfterReloadData', function () {
                    scope.pages = scope.params.generatePagesArray(scope.params.page(), scope.params.total(), scope.params.count());
                    scope.pageInfo = scope.params.generatePageConfig(scope.params.page(), scope.params.total(), scope.params.count());
                }, true);

                scope.$watch('templateUrl', function(templateUrl) {
                    if (angular.isUndefined(templateUrl)) {
                        return;
                    }
                    var template = angular.element(document.createElement('div'));
                    template.attr({
                        'ng-include': 'templateUrl'
                    });
                    element.append(template);
                    $compile(template)(scope);
                });

                scope.onPageChange = function () {
                    scope.params.page(scope.pageInfo.current);
                };
            }
        };
    }
]);
return app;
}));
angular.module('LINDGE.UI-Core.Control.NgTableSupport', ['LINDGE.UI-Core.Control.NgTable'])

.factory('$ngTableFactory', ['ngTableParams', '$filter', '$SDK', function (ngTableParams, $filter, $SDK) {

// data loader implements //
function creatDataLoadParam(table, ngTableParam) {
    return {
        page: ngTableParam.page() - 1,
        pageSize: table.pageSize(),
        sort: ngTableParam.orderBy(),
        filter: table.currentFilter()
    };
}

/**
 * filter, order, page data automatically
 * @param {Function} dataProvider
 */
function AutoDataLoader(dataProvider) {
    this._provider = dataProvider;
}

AutoDataLoader.prototype.load = function(table, ngTableParam, success, fail) {
    this._provider.call(
        null,
        null,
        (total, data) => {
            var param = creatDataLoadParam(table, ngTableParam);
            var needSort = param.sort.length > 0;

            if (typeof param.filter == 'function') {
                data = data.filter(param.filter);
            } else if (needSort) {
                data = data.slice();
            }

            if (needSort) {
                var sorters = param.sort.map(key => table.getSorter(key) || key);

                var tempData = data.map((d, i) => ({ value: d, index: i }));
                data = tempData
                    .sort((v1, v2) => {
                        for (var i = 0; i < sorters.length; i++) {
                            var sorter = sorters[i];
                            if (sorter) {
                                try {
                                    var cmp = sorter(v1.value, v2.value);
                                    if (cmp !== 0) {
                                        return cmp;
                                    }
                                } catch (err) {
                                    // ignore compare error
                                }
                                
                            }
                        }

                        return v1.index < v2.index ? -1 : 1;
                    })
                    .map(d => d.value);
            }

            var pageData = param.pageSize >= 0 ? 
                           data.slice(param.page * param.pageSize, (param.page + 1) * param.pageSize) :
                           data;
            success(data.length, pageData);
        },
        fail
    );
};

/**
 * load data in memory directly 
 * @param {Function} dataProvider
 */
function MemoryDataLoader(dataProvider) {
    this._provider = dataProvider;
}

MemoryDataLoader.prototype.load = function(table, ngTableParam, success, fail) {
    this._provider.call(
        null,
        creatDataLoadParam(table, ngTableParam),
        success,
        fail
    );
};

/**
 * load data async
 * @param {Function} dataProvider
 */
function AsyncDataLoader(dataProvider) {
    this._provider = dataProvider;
    this._loadIndex = 0;
}

AsyncDataLoader.prototype.load = function(table, ngTableParam, success, fail) {
    this._loadIndex++;
    var loadIndex = this._loadIndex;

    table.markDataLoading(true);
    this._provider.call(
        null,
        creatDataLoadParam(table, ngTableParam),
        (total, data) => {
            if (this._loadIndex === loadIndex) {
                success(total, data);
                table.markDataLoading(false);
            }
        },
        err => {
            if (this._loadIndex === loadIndex) {
                table.markDataLoading(false);
                fail(err);
            }
        }
    );
};

// selection manager implements //
var defaultSelectionConverter = (a => a);

/**
 * AbstractSelectionManager
 *
 * @param {Function} selComparator
 * @param {Function} selConverter
 */
function AbstractSelectionManager(selComparator, selConverter) {
    this._selComparator = selComparator;
    this._selConverter = selConverter;
}

AbstractSelectionManager.prototype._toSelectionId = function(obj) {
    if (!!this._selConverter && !this._selComparator) {
        return this._selConverter.call(null, obj);
    } else {
        return obj;
    }
};


/**
 * single selection
 *
 * @param {Function} selComparator
 * @param {Function} selConverter
 * @param {Object} setting
 */
function SingleSelectionManager(selComparator, selConverter, setting) {
    AbstractSelectionManager.call(this, selComparator, selConverter);

    this._selComparator = selComparator;
    this._selConverter = selConverter;
    this._setting = setting;

    this._current = null;
}

$SDK.Lang.inherits(SingleSelectionManager, AbstractSelectionManager);

SingleSelectionManager.prototype.select = function(data) {
    if (this.isSelected(data)) {
        if (this._setting.allowToggle) {
            this._current = null;
        }
    } else {
        this._current = this._toSelectionId(data);
    }
};

SingleSelectionManager.prototype.deselect = function(data) {
    if (this.isSelected(data)) {
        this._current = null;
    }
};

SingleSelectionManager.prototype.isSelected = function(data) {
    if (this._current !== null) {
        if (!!this._selComparator) {
            return this._selComparator.call(null, data, this._current);
        } else {
            return this._toSelectionId(data) == this._current;
        }
    } else {
        return false;
    }
};

SingleSelectionManager.prototype.hasSelection = function() {
    return this._current !== null;
};

SingleSelectionManager.prototype.getSelection = function() {
    if (this._current === null) {
        return null;
    } else {
        if (!!this._selComparator && !!this._selConverter) {
            return this._selConverter.call(null, this._current);
        } else {
            return this._current;
        }
    }
};

SingleSelectionManager.prototype.clearSelection = function() {
    this._current = null;
};

/**
 * multi selection
 *
 * @param {Function} selComparator
 * @param {Function} selConverter
 * @param {Object} setting
 */
function MultiSelectionManager(selComparator, selConverter, setting) {
    AbstractSelectionManager.call(this, selComparator, selConverter);

    this._selConverter = selConverter;
    this._setting = setting;

    this._selection = new Set();
}

$SDK.Lang.inherits(MultiSelectionManager, AbstractSelectionManager);

MultiSelectionManager.prototype._getMatchFromSelection = function(data) {
    if (!!this._selComparator) {
        for (let item of this._selection) {
            if (this._selComparator.call(null, item, data)) {
                return item;
            }
        }

        return null;
    } else {
        var selId = this._toSelectionId(data);
        return this._selection.has(selId) ? selId : null;
    }
};

MultiSelectionManager.prototype.select = function(data) {
    var selected = this._getMatchFromSelection(data);
    if (selected === null) {
        var selId = this._toSelectionId(data);
        this._selection.add(selId);
    } else {
        if (this._setting.allowToggle) {
            this._selection.delete(selected);
        }
    }
};

MultiSelectionManager.prototype.deselect = function(data) {
    var selected = this._getMatchFromSelection(data);
    if (selected !== null) {
        this._selection.delete(selected);
    }
};

MultiSelectionManager.prototype.isSelected = function(data) {
    return this._getMatchFromSelection(data) !== null;
};

MultiSelectionManager.prototype.hasSelection = function() {
    return this._selection.size > 0;
};

MultiSelectionManager.prototype.getSelection = function() {
    if (this.hasSelection()) {
        var arr = Array.from(this._selection);
        if (!!this._selComparator && !!this._selConverter) {
            return arr.map(this._selConverter);
        } else {
            return arr;
        }
    } else {
        return [];
    }
};

MultiSelectionManager.prototype.clearSelection = function() {
    this._selection = new Set();
};

// policies //

var DATA_LOAD_POLICY = {
    AUTO: 0x01,
    SYNC: 0x02,
    ASYNC: 0x03
};

var SELECTION_POLICY = {
    NONE: 0x00,
    SINGLE: 0x01,
    MULTI: 0x02
};


// table filter //

/**
 * table filter
 * @param {String} key
 * @param {Function} filter
 */
function TableFilter(key, filter) {
    this.key = key;
    this.filter = filter;
}


// table service implementation //

/**
 * TableService
 */
function TableService(dataLoader, setting, selectionManager) {
    // components
    this._dataLoader = dataLoader;
    this._selectionManager = selectionManager;
    this._filter = '';
    this._sorting = setting.sorting || {};

    // setting
    this._setting = setting;

    // states
    this._loadingState = false;

    this._table = {
        baseParam: null,
        baseSetting: null,
        table: null
    };

    this._initTable(setting);
}

TableService.prototype._processData = function(data) {
    if (this._setting.addDisplayIndex) {
        var pageSize = this._setting.pageSize;
        if (pageSize >= 0) {
            data.forEach((item, index) => {
                item.$index = this.page() * pageSize + index + 1;
            });
        } else {
            data.forEach((item, index) => {
                item.$index = index + 1;
            });
        }            
    }
};

TableService.prototype._initTable = function(setting) {
    var baseParam = {
        page: 1,
        count: setting.pageSize,
        filter: {},
        sorting: null
    };

    var sorting = setting.initSorting;
    if (sorting) {
        if (typeof sorting == 'string') {
            baseParam.sorting = { [sorting]: 'asc' };
        } else {
            baseParam.sorting = sorting;
        }
    } else {
        baseParam.sorting = {};
    }

    var baseSetting = {
        counts: [],
        getData: ($defer, params) => {
            this._dataLoader.load(
                this,
                params,
                (total, data) => {
                    params.total(total);
                    this._processData(data);
                    $defer.resolve(data);
                },
                angular.noop
            );
        }
    };

    var table = new ngTableParams(baseParam, baseSetting);

    this._table.baseParam = baseParam;
    this._table.baseSetting = baseSetting;
    this._table.table = table;
};

TableService.prototype.pageSize = function() {
    return this._setting.pageSize;
};

TableService.prototype.currentFilter = function() {
    if (this._filter instanceof TableFilter) {
        return this._filter.filter;
    } else {
        return this._filter;
    }
};

TableService.prototype.setFilter = function(filter) {
    var isSameFilter;
    if (this._filter instanceof TableFilter &&
        filter instanceof TableFilter) {
        isSameFilter = (this._filter.key == filter.key);
    } else {
        isSameFilter = this._filter === filter;
    }

    if (!isSameFilter) {
        this._filter = filter;

        var table = this._table.table;
        if (table.page() != 1) {
            table.page(1);
        } else {
            table.reload();
        }
    }
};

TableService.prototype.currentSorter = function() {
    if (!!this._sorter) {
        return this._sorter.sorter;
    } else {
        return this._table.table.orderBy();
    }
};

TableService.prototype.getSorter = function(sortHint) {
    function createComparator(key, desc) {
        if (desc) {
            return (v1, v2) => v1[key] == v2[key] ? 0 : (v1[key] < v2[key] ? 1 : -1);
        } else {
            return (v1, v2) => v1[key] == v2[key] ? 0 : (v1[key] > v2[key] ? 1 : -1);
        }
    }

    var match = /^([+\-]?)(.+)/.exec(sortHint);
    if (match) {
        var key = match[2];
        if (this._sorting.hasOwnProperty(key)) {
            if (match[1] == '-') {
                return this._sorting[key].desc;
            } else {
                return this._sorting[key].asc;
            }
        } else {
            return createComparator(key, match[1] == '-');
        }
    } else {
        return null;
    }
};

TableService.prototype.sort = function(sorter) {
    var table = this._table.table;
    if (typeof sorter == 'string') {
        table.sorting({ [sorter]: 'asc' });
    } else {
        table.sorting(sorter);
    }
};

TableService.prototype.markDataLoading = function(isLoading) {
    this._loadingState = isLoading;
};

TableService.prototype.isLoadingData = function() {
    return this._loadingState;
};

TableService.prototype.reload = function() {
    this._table.table.reload();
};

TableService.prototype.page = function() {
    return this._table.table.page() - 1;
};

TableService.prototype.setPage = function(page, forceReload) {
    var currentPage = this.page();
    if (currentPage != page) {
        this._table.table.page(page + 1);
    } else if (!!forceReload) {
        this.reload();
    }
};

TableService.prototype._canSelect = function(data) {
    var selectionFilter = this._setting.selectionFilter;
    if (typeof selectionFilter == 'function') {
        return selectionFilter(data);
    } else {
        return true;
    }
};

TableService.prototype.select = function(data) {
    if (this._selectionManager !== null && this._canSelect(data)) {
        this._selectionManager.select(data);
    }
};

TableService.prototype.deselect = function(data) {
    if (this._selectionManager !== null) {
        this._selectionManager.deselect(data);
    }
};

TableService.prototype.isSelected = function(data) {
    if (this._selectionManager !== null) {
        return this._selectionManager.isSelected(data);
    } else {
        return false;
    }
};

TableService.prototype.getSelection = function() {
    if (this._selectionManager !== null) {
        return this._selectionManager.getSelection();
    } else {
        return null;
    }
};

TableService.prototype.hasSelection = function() {
    if (this._selectionManager !== null) {
        return this._selectionManager.hasSelection();
    } else {
        return false;
    }
};

TableService.prototype.clearSelection = function() {
    if (this._selectionManager !== null) {
        this._selectionManager.clearSelection();
    }
};

TableService.prototype.getTable = function() {
    return this._table.table;
};

TableService.prototype.rowCount = function() {
    return this._table.table.data.length;
};

TableService.prototype.hasRow = function() {
    return this.rowCount() > 0;
};

TableService.prototype.getPageData = function() {
    return this._table.table.data;
};

TableService.prototype.getPageSelectableData = function() {
    if (this._setting.selectionFilter) {
        return this._table.table.data.filter(this._setting.selectionFilter);
    } else {
        return this.getPageData();
    }
};


return {
    DATA_LOAD_POLICY: DATA_LOAD_POLICY,
    SELECTION_POLICY: SELECTION_POLICY,
    createTableService: function (config) {
        var baseConfig = {
            pageSize: -1,
            dataLoadPolicy: DATA_LOAD_POLICY.SYNC,
            dataProvider: null,
            dataSelectionPolicy: SELECTION_POLICY.NONE,
            dataSelectionConverter: defaultSelectionConverter,
            dataSelectionComparator: null,
            dataSelectionFilter: null,
            autoToggleSelection: false,
            addDisplayIndex: false,
            sorting: null,
            initSorting: null
        };

        angular.extend(baseConfig, config);

        if (!baseConfig.dataProvider) {
            throw new Error('dataProvider is missing');
        }

        // create data loader
        var dataLoader;
        if (baseConfig.dataLoadPolicy === DATA_LOAD_POLICY.AUTO) {
            dataLoader = new AutoDataLoader(baseConfig.dataProvider);
        } else if (baseConfig.dataLoadPolicy === DATA_LOAD_POLICY.SYNC) {
            dataLoader = new MemoryDataLoader(baseConfig.dataProvider);
        } else {
            dataLoader = new AsyncDataLoader(baseConfig.dataProvider);
        }

        // create selection manager
        var selectionManager;
        var selectionSetting = {
            allowToggle: baseConfig.autoToggleSelection
        };

        if (baseConfig.dataSelectionPolicy === SELECTION_POLICY.SINGLE) {
            selectionManager = new SingleSelectionManager(
                baseConfig.dataSelectionComparator,
                baseConfig.dataSelectionConverter,
                selectionSetting
            );
        } else if (baseConfig.dataSelectionPolicy === SELECTION_POLICY.MULTI) {
            selectionManager = new MultiSelectionManager(
                baseConfig.dataSelectionComparator,
                baseConfig.dataSelectionConverter,
                selectionSetting
            );
        } else {
            selectionManager = null;
        }

        // create table setting
        var tableSetting = {
            pageSize: baseConfig.pageSize,
            addDisplayIndex: baseConfig.addDisplayIndex,
            selectionFilter: baseConfig.dataSelectionFilter,
            sorting: baseConfig.sorting,
            initSorting: baseConfig.initSorting
        };

        return new TableService(dataLoader, tableSetting, selectionManager);
    },

    createTableFilter: function (key, filter) {
        return new TableFilter(key, filter);
    }
};

}]);
angular.module('LINDGE.UI-Core.Control.NgTableControl', ['LINDGE.UI-Core.Control.NgTableSupport'])

.directive('luiTableHeaderSelector', [function () {
    var template = '<md-checkbox ng-checked="isChecked()" md-indeterminate="isIndeterminate()" ng-click="changeAllSelection()"></md-checkbox>';

    return {
        priority: 1,
        scope: {
            table: '='
        },
        restrict: 'E',
        template: template,
        replace: false,
        link: function(scope, iElm, iAttrs, controller) {
            function getSelectionState(tableService) {
                var data = tableService.getPageSelectableData();
                var selectCount = 0;

                for (var i = 0; i < data.length; i++) {
                    if (tableService.isSelected(data[i])) {
                        selectCount++;
                    }
                }

                if (selectCount === 0) {
                    return 'none';
                } else if (selectCount == data.length) {
                    return 'all';
                } else {
                    return 'some';
                }
            }

            function getTableService() {
                if (scope.table) {
                    return scope.table;
                } else {
                    return null;
                }
            }

            scope.isChecked = function () {
                var tableService = getTableService();
                if (tableService) {
                    return getSelectionState(tableService) == 'all';
                } else {
                    return false;
                }
            };

            scope.isIndeterminate = function () {
                var tableService = getTableService();
                if (tableService) {
                    return getSelectionState(tableService) == 'some';
                } else {
                    return false;
                }
            };

            scope.changeAllSelection = function () {
                var tableService = getTableService();
                if (tableService) {
                    var selectionState = getSelectionState(tableService);
                    var data = tableService.getPageSelectableData();
                    if (selectionState == 'all') {
                        data.forEach(function (item) {
                            if (tableService.isSelected(item)) {
                                tableService.deselect(item);
                            }
                        });
                    } else {
                        data.forEach(function (item) {
                            if (!tableService.isSelected(item)) {
                                tableService.select(item);
                            }
                        });
                    }
                }
            };
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Outscope', [])

.directive('uiOutscope', [function () {
    return {
        priority: 100,
        scope: false,
        restrict: 'EA',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            var containerName = iAttrs['uiOutscope'];
            var container = document.body.querySelector(`[outscope-container="${containerName}"]`);

            if (!container) {
                return;
            }

            container = angular.element(container);
            container.empty();

            container.append(iElm);

            scope.$on('$destroy', function () {
                container.empty();
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Popover', [])

.provider('$luiPopover', ['$SDK', function ($SDK) {
    var POSITION = {
        TOP: 1,
        BOTTOM: 2,
        VERTICAL: 3,
        LEFT: 4,
        RIGHT: 8,
        HORIZONTAL: 12
    };

    var ALIGNMENT = {
        NONE: 0,
        AUTO: 32768,
        LEFT: 1,
        RIGHT: 2,
        HCENTER: 3,
        TOP: 4,
        BOTTOM: 8,
        VCENTER: 12
    };

    var SEAMSIZE = 3;
    var ARROW_OFFSET = 15;

    var defaultTemplate = null;
    var templates = {};

    /**
     * {
     *   createPanel(wrapper, BoundingRect, PopoverConfig) -> Element,
     * }
     */
    this.registerTemplate = function (name, tpl, asDefault) {
        var template = {
            name: name,
            factory: tpl
        };

        templates[name] = template;

        if (!defaultTemplate || asDefault) {
            defaultTemplate = template;
        }
    };

    this.POSITION = POSITION;
    this.ALIGNMENT = ALIGNMENT;

    function getElementRect(elm) {
        var rect = elm.getBoundingClientRect();
        // var coords = $SDK.DOM.getElementXYCoord(elm);

        return {
            screen: {
                top: rect.top,
                right: rect.right,
                left: rect.left,
                bottom: rect.bottom
            },
            // left: coords[0],
            // right: coords[0] + rect.width,
            // top: coords[1],
            // bottom: coords[1] + rect.height,
            top: rect.top,
            right: rect.right,
            left: rect.left,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
        };
    }

    function computeEventLocalCoord(evt, elm) {
        var x = evt.clientX;
        var y = evt.clientY;
        var bound = elm.getBoundingClientRect();

        return [x - bound.left, y - bound.top];
    }

    function computeInlineRect(elm, evt) {
        var boundRect = getElementRect(elm);
        var localCoord = computeEventLocalCoord(evt, elm);
        var fontSize = parseFloat(window.getComputedStyle(elm).fontSize);

        var elmHeight = boundRect.height;

        boundRect.screen.left = evt.clientX;
        boundRect.screen.right = evt.clientX + 1;
        boundRect.width = 1;
        boundRect.height = 1;
        boundRect.left += localCoord[0];
        boundRect.right = boundRect.left + 1;

        if (elmHeight <= fontSize * 1.5) {
            return boundRect;
        } else {
            var lineNum = Math.ceil((evt.clientY - boundRect.screen.top) / fontSize);
            var lineOffsets = [(lineNum - 1) * fontSize, lineNum * fontSize];

            boundRect.screen.bottom = boundRect.screen.top + lineOffsets[1];
            boundRect.screen.top += lineOffsets[0];

            boundRect.bottom = boundRect.top + lineOffsets[1];
            boundRect.top += lineOffsets[0];

            return boundRect;
        }
    }

    function computePanelPosition(refElm, config) {
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;

        var position = config.position;
        var align = config.alignment;
        var mouseEvent = config.mouseEvent;

        var inlineMode = config.inline && mouseEvent;

        var refRect;
        if (inlineMode) {
            refRect = computeInlineRect(refElm[0], mouseEvent);
        } else {
            refRect = getElementRect(refElm[0]);
        }

        var panelPos = {
            maxHeight: -1,
            maxWidth: -1,
            bottom: -1,
            top: -1,
            left: -1,
            right: -1,
            position: null,
            alignment: null,
            pointerRange: {
                bottom: -1,
                top: -1,
                left: -1,
                right: -1,
            }
        };

        if (position & POSITION.VERTICAL) {
            if ((position & POSITION.BOTTOM == 0) || refRect.screen.top >= windowHeight / 2) {
                panelPos.bottom = windowHeight - refRect.top + SEAMSIZE;
                panelPos.maxHeight = refRect.screen.top - SEAMSIZE * 2;
                panelPos.position = POSITION.TOP;
            } else {
                panelPos.top = refRect.bottom + SEAMSIZE;
                panelPos.maxHeight = windowHeight - refRect.screen.bottom - SEAMSIZE * 2;
                panelPos.position = POSITION.BOTTOM;
            }

            if (align == ALIGNMENT.AUTO) {
                var screenMiddle = (refRect.screen.left + refRect.width / 2);
                align = (screenMiddle <= windowWidth / 2) ? ALIGNMENT.LEFT : ALIGNMENT.RIGHT;
            }

            if (align == ALIGNMENT.HCENTER) {
                // not support
            } else if (align & ALIGNMENT.LEFT) {
                if (inlineMode) {
                    panelPos.left = refRect.left - ARROW_OFFSET;
                    panelPos.maxWidth = windowWidth - refRect.left - SEAMSIZE + ARROW_OFFSET;
                } else {
                    panelPos.left = refRect.left;
                    panelPos.maxWidth = windowWidth - refRect.left - SEAMSIZE;
                }

                panelPos.pointerRange.left = refRect.left - panelPos.left;
                panelPos.pointerRange.right = panelPos.pointerRange.left + refRect.width;
                panelPos.alignment = ALIGNMENT.LEFT;
            } else {
                if (inlineMode) {
                    panelPos.right = windowWidth - refRect.right - ARROW_OFFSET;
                    panelPos.maxWidth = refRect.right - SEAMSIZE + ARROW_OFFSET;
                } else {
                    panelPos.right = windowWidth - refRect.right;
                    panelPos.maxWidth = refRect.right - SEAMSIZE;
                }

                panelPos.pointerRange.right = (windowWidth - refRect.right) - panelPos.right;
                panelPos.pointerRange.left = panelPos.pointerRange.right + refRect.width;
                panelPos.alignment = ALIGNMENT.RIGHT;
            }
        } else {
            // TBF: horizontal position
        }

        return panelPos;
    }

    function initWrapperElement(wrapper, panelPos) {
        if (panelPos & POSITION.VERTICAL) {
            wrapper.addClass('direction-vertical');
        } else {
            wrapper.addClass('direction-horizontal');
        }

        return wrapper;
    }

    function generateCssRule(value) {
        return value > 0 ? (value + 'px') : '';
    }

    function factory($log, $compile, $controller, $rootScope) {
        var currentPopover = null;

        function readConfig(config) {
            var baseConfig = {
                popoverTemplate: defaultTemplate,
                inline: false,
                mouseEvent: null,
                compile: false,
                scope: null,
                controller: null,
                content: null,
                locals: null,
                position: POSITION.VERTICAL,
                alignment: ALIGNMENT.AUTO
            };

            if (typeof config == 'string') {
                baseConfig.content = config;
            } else {
                angular.extend(baseConfig, config);
            }

            if (typeof baseConfig.popoverTemplate == 'string') {
                var template = templates[baseConfig.popoverTemplate] || null;
                baseConfig.popoverTemplate = !!template ? template.factory : null;
            }

            return baseConfig;
        }

        function disableScroll(elm) {
            function handle(evt) { evt.preventDefault(); }

            elm.addEventListener('wheel', handle);
            elm.addEventListener('keydown', handle);
            elm.addEventListener('touchmove', handle);

            return function () {
                elm.removeEventListener('wheel', handle);
                elm.removeEventListener('keydown', handle);
                elm.removeEventListener('touchmove', handle);
            };
        }

        /**
         * config {
         *     popoverTemplate: String
         *     inline: Boolean
         *     mouseEvent: MouseEvent
         *     controller: String
         *     content: String|Element
         *     compile: Boolean,
         *     scope: null,
         *     locals: Object?
         *     position: POSITION
         *     alignment: ALIGNMENT
         * }
         */
        function showPopover(refElement, config) {
            if (typeof refElement == 'string') {
                refElement = document.querySelector(refElement);
                if (refElement !== null) {
                    refElement = angular.element(refElement);
                }
            }

            if (refElement) {
                refElement = angular.element(refElement);
            } else {
                $log.warn('luipopover: cannot find refElement');
                return;
            }

            // read configuration object
            config = readConfig(config);
            if (!config.popoverTemplate) {
                $log.warn('luipopover: cannot load popover template');
                return;
            }

            // hide old popover if exists
            if (currentPopover) {
                currentPopover.hide();
            }

            // compute panel position
            var panelPos = computePanelPosition(refElement, config);

            // create wrapper element
            var wrapper = angular.element('<div class="lui-popover-wrapper">');
            initWrapperElement(wrapper, panelPos);

            // set wrapper position
            var cssRules = {};
            ['height', 'width', 'top', 'right', 'bottom', 'left', 'maxWidth', 'maxHeight']
                .forEach(function (attr) {
                    cssRules[attr] = generateCssRule(panelPos[attr]);
                });

            wrapper.css(cssRules);

            // create panel contents
            var contentWrapper = config.popoverTemplate.createPanel(wrapper, panelPos, config);
            var content = angular.element(config.content);
            contentWrapper.append(content);

            // compile if necessary
            if (config.compile) {
                var scope = config.scope || $rootScope.$new();
                $compile(contentWrapper)(scope);

                if (config.controller) {
                    try {
                        var injection = {
                            '$scope': scope,
                            '$popoverHandle': popoverHandle
                        };

                        if (config.locals) {
                            angular.extend(injection, config.locals);
                        }

                        $controller(config.controller, injection);   
                    } catch (err) {
                        $log.error('luipopover: error when initaition controller', err);
                    }
                }
            }

            // parpare handle object
            var clearCallbacks = [];

            if (config.preventScroll) {
                var scrollParent = $SDK.DOM.getScrollParent(refElement[0]);
                if (scrollParent) {
                    clearCallbacks.push(disableScroll(scrollParent));
                }
            }

            var popoverHandle = {
                wrapper: wrapper,
                hide: function () {
                    this.wrapper.remove();
                    currentPopover = null;

                    clearCallbacks.forEach(function (cb) {
                        try {
                            cb();
                        } catch (err) {}
                    });
                }
            };

            // insert popover
            document.body.appendChild(wrapper[0]);

            currentPopover = popoverHandle;
            return popoverHandle;
        }

        /**
         * config {
         *    popoverShowDelay: Number
         *    popoverHideDelay: Number
         * }
         */
        function bindHoverTrigger (elm, config) {
            var control = {
                disabled: false,
                elm: angular.element(elm),
                delayHandle: 0,
                popoverShow: false,
                popover: null
            };

            function clearDelay(handleActive) {
                if (handleActive) {
                    clearTimeout(control.delayHandle);
                }
                control.delayHandle = 0;
            }

            function loadPopover(evt) {
                var popoverConfig;
                if (typeof config.getConfig == 'function') {
                    popoverConfig = config.getConfig();
                } else {
                    popoverConfig = config;
                }

                popoverConfig.mouseEvent = evt;
                var popover = showPopover(control.elm, popoverConfig);
                control.popoverShow = true;
                control.popover = popover;

                popover.wrapper.bind('mouseenter', onMouseEnterPanel);
                popover.wrapper.bind('mouseleave', onMouseLeave);

                return popover;
            }

            function hidePopover() {
                if (control.delayHandle > 0) {
                    clearDelay(true);
                }

                if (control.popoverShow) {
                    control.popover.wrapper.unbind('mouseenter', onMouseEnterPanel);
                    control.popover.wrapper.unbind('mouseleave', onMouseLeave);
                    control.popover.hide();
                    control.popover = null;
                    control.popoverShow = false;
                }
            }

            function onMouseEnter(evt) {
                if (control.disabled) {
                    return;
                }

                if (control.delayHandle > 0) {
                    clearDelay(true);
                }

                if (!control.popoverShow) {
                    if (config.popoverShowDelay > 0) {
                        control.delayHandle = setTimeout(
                            function () {
                                clearDelay(false);
                                loadPopover(evt);
                            },
                            config.popoverShowDelay
                        );
                    } else {
                        loadPopover(evt);
                    }
                }
            }

            function onMouseLeave(evt) {
                if (control.delayHandle > 0) {
                    clearDelay(true);
                }

                if (control.popoverShow) {
                    if (config.popoverHideDelay > 0) {
                        control.delayHandle = setTimeout(
                            function () {
                                clearDelay(false);
                                hidePopover();
                            },
                            config.popoverHideDelay
                        );
                    } else {
                        hidePopover();
                    }
                }
            }

            function onMouseEnterPanel(evt) {
                if (control.delayHandle > 0) {
                    clearDelay(true);
                }
            }

            function discardTrigger() {
                control.elm.unbind('mouseenter', onMouseEnter);
                control.elm.unbind('mouseleave', onMouseLeave);
            }

            control.elm.bind('mouseenter', onMouseEnter);
            control.elm.bind('mouseleave', onMouseLeave);

            // and control handles
            control.hidePopover = hidePopover;
            control.discardTrigger = discardTrigger;

            return control;
        }

        return {
            showPopover: showPopover,
            triggerByHover: bindHoverTrigger,
            POSITION: POSITION,
            ALIGNMENT: ALIGNMENT
        };
    }

    this.$get = ['$log', '$compile', '$controller', '$rootScope', factory];
}])

.directive('luiPopoverTrigger', ['$log', '$luiPopover', function ($log, $luiPopover) {
    return {
        priority: 1,
        scope: {
            triggerType: '@',
            luiPopoverTrigger: '='
        },
        restrict: 'A',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            var trigger = null;

            scope.$watch('luiPopoverTrigger', function(newValue) {
                if (trigger) {
                    trigger.discardTrigger();
                    trigger = null;
                }

                if (!!newValue && typeof newValue == 'object') {
                    switch (scope.triggerType) {
                        case 'hover':
                            trigger = $luiPopover.triggerByHover(iElm, newValue);
                            break;
                        default:
                            $log.warn('luiPopoverTrigger: unsupported trigger type ' + scope.triggerType);
                            break;
                    }
                }
            });

            scope.$on('$destroy', function () {
                if (trigger) {
                    trigger.discardTrigger();
                }
            });
        }
    };
}]);

angular.module('LINDGE.UI-Core.scrollStick', ['LINDGE.UI-Core.Service.DOMService'])

.directive('scrollStick', ['ElementStateMonitor', function (StateMonitor) {
    var scrollStickClass = 'scroll-sticked';
    var defaultStickOffset = 0;

    var resizeMethods = {
        toVisibleBottom: function (elm, containerBox) {
            var elmBox = elm[0].getBoundingClientRect();
            elm.css('height', `calc(100vh - ${elmBox.top}px)`);
        }
    };

    function readStickConfig(config) {
        var baseConfig = {
            align: 'left',
            offsetTop: 0,
            offsetHoriz: 0
        };

        if (typeof config == 'string') {
            baseConfig.align = config;
        } else if (typeof config == 'number') {
            baseConfig.offsetTop = config;
        } else {
            angular.extend(baseConfig, config);
        }

        return baseConfig;
    }

    return {
        priority: 1,
        scope: false,
        restrict: 'A',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            var parent = iElm.parent();
            var scrollContainer;
            if (iAttrs['scrollStickParent']) {
                scrollContainer = document.body.querySelector(iAttrs['scrollStickParent']);
            } else {
                scrollContainer = parent[0];
            }

            if (!scrollContainer) {
                return;
            }

            var config = readStickConfig(scope.$eval(iAttrs.scrollStickConfig));

            var resizeHandles = [];
            var isSticked = false;
            // var visMonitor = new ElementVisibilityMonitor([scrollContainer, parent[0]]);
            var visMonitor = null;

            if (iAttrs['scrollStickResize']) {
                iAttrs['scrollStickResize'].split(',').forEach(function (method) {
                    method = method.trim();
                    if (method !== '') {
                        var methodHandle = resizeMethods[method];
                        if (methodHandle) {
                            resizeHandles.push(methodHandle);
                        }
                    }
                });
            }

            function onContainerScroll(evt) {
                var containerBox = scrollContainer.getBoundingClientRect();
                var parentBox = parent[0].getBoundingClientRect();

                var yOffset = parentBox.y - containerBox.y;
                if (yOffset < 0) {
                    if (!isSticked) {
                        var rect = iElm[0].getBoundingClientRect();
                        var styles = {
                            position: 'fixed',
                            top: String(containerBox.y + config.offsetTop) + 'px'
                        };

                        if (config.align == 'left') {
                            styles['left'] = String(rect.left + config.offsetHoriz) + 'px';
                        } else if (config.align == 'right') {
                            styles['right'] = String((window.innerWidth - rect.right) + config.offsetHoriz) + 'px';
                        }

                        iElm.css(styles);

                        var addClass = angular.isDefined(iAttrs.scrollStickAddClass) ?
                                       scope.$eval(iAttrs.scrollStickAddClass) :
                                       true;
                        if (!!addClass) {
                            iElm.addClass(scrollStickClass);
                        }

                        isSticked = true;
                    }
                } else {
                    if (isSticked) {
                        iElm.css({
                            position: '',
                            top: '',
                            left: '',
                            right: ''
                        });

                        iElm.removeClass(scrollStickClass);

                        isSticked = false;
                    }
                }

                if (resizeHandles.length > 0) {
                    resizeHandles.forEach(function (method) {
                        method(iElm, containerBox);
                    });
                }
            }

            function watchVisibility() {
                function onAllVisible() {
                    scrollContainer.addEventListener('scroll', onContainerScroll);

                    scope.$on('$destroy', function () {
                        scrollContainer.removeEventListener('scroll', onContainerScroll);
                    });
                }

                var count = 0;

                function createChecker(elm) {
                    var checker = new StateMonitor.VisibilityChecker(elm);
                    checker.addCallback(function (isVisible) {
                        if (isVisible) {
                            checker.enable = false;
                            count++;
                            if (count == 2) {
                                visMonitor.stopWatch();
                                onAllVisible();
                            }
                        }
                    });

                    return checker;
                }

                visMonitor = new StateMonitor.ElementStateMonitor();
                visMonitor.addChecker(createChecker(scrollContainer))
                    .addChecker(createChecker(parent[0]));

                visMonitor.beginWatch();
            }

            setTimeout(watchVisibility, 30);

            scope.$on('$destroy', function () {
                if (visMonitor && visMonitor.isWatching) {
                    visMonitor.stopWatch();
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.RightClick', [])

.directive('ngRightClick', ['$parse', function ($parse) {
    return function (scope, iElm, iAttrs) {
        var fn = $parse(iAttrs['ngRightClick']);
        iElm.bind('contextmenu', function (evt) {
            scope.$apply(function () {
                evt.preventDefault();
                fn(scope, { $event: evt });
            });
        });
    };
}]);
angular.module('LINDGE.UI-Core.Control.ProgressLinear', [])

.directive('luiProgressLinear', ['$SDK', function ($SDK) {
    var template = [
        '<div class="progress-container">',
        '<div class="lui-progress-bar bar1"></div>',
        '</div>'
    ].join('');

    // range [0, 100]

    return {
        priority: 1,
        scope: false,
        restrict: 'E',
        template: template,
        replace: false,
        link: function(scope, iElm, iAttrs) {
            var isDisabled = iAttrs.hasOwnProperty('disabled');
            var bar1 = angular.element(iElm[0].querySelector('.bar1'));
            var container = angular.element(iElm[0].querySelector('.progress-container'));

            var currentValue = 0.0;

            function clampToRange(value) {
                return $SDK.Math.clamp(0, 100, value);
            }

            function updateProgressbar(bar, value) {
                bar.css('transform', 'translate(' + (value - 100) + '%)');
                // bar.css('width', value + '%');
            }

            function watchAttributes() {
                iAttrs.$observe('value', function(value) {
                    if (!isDisabled) {
                        var percentValue = clampToRange(value);
                        updateProgressbar(bar1, percentValue);
                        currentValue = percentValue;
                    }
                });

                iAttrs.$observe('disabled', function(value) {
                    isDisabled = angular.isDefined(value);
                });
            }

            watchAttributes();
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Slider', ['LINDGE.UI-Core.Service.Drag'])

.service('$sliderHelper', ['$SDK', function ($SDK) {
    this.computeRatio = function(min, max, val){
        return (val - min) / (max - min);
    };

    this.computeValue = function(min, max, ratio){
        return min + (max - min) * ratio;
    };

    // fork methods for jQuery's node position service
    // add fullscreen support
    function getFullScreenElem () {
        return document.fullscreenElement ||
               document.webkitFullscreenElement ||
               document.mozFullScreenElement ||
               document.msFullscreenElement;
    }

    function elemPageX(elem){
        return (getFullScreenElem() === elem.offsetParent || elem.offsetParent == window.document.body || elem.offsetParent === null) ?
               elem.offsetLeft :
               elem.offsetLeft + elemPageX(elem.offsetParent);
    }

    function elemPageY(elem){
        return (getFullScreenElem() === elem.offsetParent || elem.offsetParent == window.document.body || elem.offsetParent === null) ?
               elem.offsetTop :
               elem.offsetTop + elemPageY(elem.offsetParent);
    }

    this.getElemPageX = function (elem) {
        return elemPageX(elem);
    };

    this.getElemPageY = function (elem) {
        return elemPageY(elem);
    };

    var closeEnough = $SDK.Math.closeEnough;

    this.getStepPos = function (min, max, step, val) {
        if (val <= min) {
            return min;
        } else if (val >= max) {
            return max;
        }

        if (closeEnough(step, 0)) {
            return val;
        }

        var range = max - min;

        var leftVal, rightVal;
        if (step >= range) {
            leftVal = min;
            rightVal = max;
        } else {
            var valuePercent = (val - min) / range;
            var stepPercent = step / range;

            var valStep = valuePercent / stepPercent;
            var valStepPosLB = Math.floor(valStep);
            var valStepPosUB = Math.ceil(valStep);

            leftVal = min + valStepPosLB * step;
            rightVal = min + valStepPosUB * step;
        }

        if (closeEnough(val, leftVal)) {
            return leftVal;
        } else if (closeEnough(val, rightVal)) {
            return Math.min(max, rightVal);
        } else {
            var bias = val - leftVal;
            if (bias <= (step / 2)) {
                return leftVal;
            } else {
                return rightVal;
            }
        }
    };

    function cssToNumber (css) {
        var num = parseFloat(css);
        if (isNaN(num)) {
            return 0;
        } else {
            return num;
        }
    }

    this.getCSSWidth = function (elm) {
        if (elm) {
            var styles = window.getComputedStyle(elm);
            return cssToNumber(styles['width']);
        } else {
            return 0;
        }
    };

    this.getCSSHeight = function (elm) {
        if (elm) {
            var styles = window.getComputedStyle(elm);
            return cssToNumber(styles['height']);
        } else {
            return 0;
        }
    };
}])

.controller('valueSliderCtrl', ['$scope', '$element', '$attrs', '$sliderHelper', function ($scope, $element, $attrs, sliderHelper){
    var manipulators = {
        horizontal: {
            initElements: function (container) {
                return;
            },
            updateProgressElm: function (elm, ratio) {
                elm.css('width', ratio * 100 + '%');
            },
            compuateRatioFromEvent: function (container, evt) {
                var elm = container[0];
                // return (evt.pageX - sliderHelper.getElemPageX(elm)) / elm.offsetWidth;
                var elmLeft = elm.getBoundingClientRect().left;
                return (evt.clientX - elmLeft) / elm.offsetWidth;
            },
            computeRatioFromHandleEvent: function (handle, evt, parentRect) {
                /*var handleWidth = sliderHelper.getCSSWidth(handle[0]);
                return (evt.clientX + handleWidth / 2 - parentRect.x) / parentRect.width;*/

                return (evt.clientX - parentRect.left) / parentRect.width;
            },
            updateHandleElm: function (handle, ratio) {
                var handleWidth = sliderHelper.getCSSWidth(handle[0]);
                handle.css('left', ['calc(', ratio * 100 + '%', ' - ', (handleWidth / 2) + 'px'].join(''));
            }
        },
        vertical: {
            initElements: function (container) {
                container.addClass('vertical');
            },
            updateProgressElm: function (elm, ratio) {
                elm.css('height', ratio * 100 + '%');
            },
            compuateRatioFromEvent: function (container, evt) {
                var elm = container[0];
                var elmTop = elm.getBoundingClientRect().top;
                return 1 - ((evt.clientY - elmTop) / elm.offsetHeight);
            },
            computeRatioFromHandleEvent: function (handle, evt, parentRect) {
                return 1 - ((evt.clientY - parentRect.top) / parentRect.height);
            },
            updateHandleElm: function (handle, ratio) {
                var handleHeight = sliderHelper.getCSSHeight(handle[0]);
                handle.css('top', ['calc(', (1 - ratio) * 100 + '%', ' - ', (handleHeight / 2) + 'px'].join(''));
            }
        }
    };

    // initiating
    $scope.$ratio = 0.0;
    $scope.$value = 0.0;

    this.isVertical = $attrs.hasOwnProperty('vertical');
    this.manipulator = this.isVertical ? manipulators.vertical : manipulators.horizontal;

    // compute or get the current slider value
    this.value = function (val) {
        if (isNaN(val)){
            return $scope.$value;
        }else{
            $scope.$updateValue(val);
        }
    };

    // compute or get slider ratio
    this.ratio = function (val) {
        if (isNaN(val)) {
            return $scope.$ratio;
        } else {
            $scope.$updateValue(sliderHelper.computeValue($scope.min, $scope.max, val));
        }
    };

    // create a new sub scope of slider scope
    this.getScope = function () {
        return $scope.$new();
    };

    // get slider object box info
    this.getParentRect = function () {
        var boundInfo = $element[0].getBoundingClientRect();

        return {
            width: $element[0].offsetWidth,
            height: $element[0].offsetHeight,
            x: sliderHelper.getElemPageX($element[0]),
            y: sliderHelper.getElemPageY($element[0]),
            top: boundInfo.top,
            left: boundInfo.left
        };
    };

    // get container object
    this.getSliderContainer = function () {
        return $element[0];
    };

    // get slider bar object
    this.getSlierBar = function () {
        return $element.children().eq(1)[0];
    };

    // get whether slider is enabled
    this.getIsEnable = function () {
        return !$scope.ngDisabled;
    };

    // active slide action manually
    this.triggerSlideEvent = function () {
        $scope.onSlide();
    };
}])

.directive('valueSlider', ['$document', '$sliderHelper', '$SDK', function ($document, sliderHelper, $SDK){
    return {
        priority: 2,
        scope: {
            min: '=',
            max: '=',
            step: '=',
            showContainer: '=',
            ngDisabled: '=',
            reference: '=',
            onChange: '&onChange',
            onSlide: '&onSlide',
        },
        controller: 'valueSliderCtrl',
        require: ['valueSlider', 'ngModel'],
        restrict: 'E',
        templateUrl: 'lui-tpl/Slider/slider.tmpl.html',
        replace: true,
        transclude: true,
        link: function(scope, iElm, iAttrs, controller) {
            var sliderCtrl = controller[0];
            var manipulator = sliderCtrl.manipulator;

            // resolve sliding value boundry
            scope.min = scope.min || 0.0;
            scope.max = scope.max || 1.0;
            var step = scope.step || 0.0;

            var needComputeStep = !$SDK.Math.closeEnough(scope.step, 0);

            if (scope.min > scope.max){
                throw new Error('Invalid range');
            }

            // helper functions
            var clamp = $SDK.Math.clamp;

            // controllers
            var ngModelCtrl = controller[1];

            // get peek and bottom value trigger object
            var groove = iElm.children().eq(0);
            var sliderBarElm = groove.children().eq(1);
            var sliderReferenceElm = groove.children().eq(0);
            var minValElem = groove.children().eq(2);
            var maxValElem = groove.children().eq(3);

            manipulator.initElements(iElm);

            // hide slider groove if necessary
            if (scope.showContainer === false){
                groove.css('background-color', 'transparent');
            }

            // interface for update value and ratio
            function render (noFeedBack) {
                if (!noFeedBack){
                    ngModelCtrl.$setViewValue(scope.$value);
                }

                // generate a value change event
                scope.$broadcast('sliderValueChange', scope.$ratio, scope.$value);
                manipulator.updateProgressElm(sliderBarElm, scope.$ratio);
                scope.onChange();
            }

            scope.$updateValue = function (value, noFeedBack) {
                if (needComputeStep) {
                    scope.$value = sliderHelper.getStepPos(scope.min, scope.max, step, value);
                    scope.$ratio = sliderHelper.computeRatio(scope.min, scope.max, scope.$value);
                } else {
                    scope.$value = clamp(scope.min, scope.max, value);
                    scope.$ratio = sliderHelper.computeRatio(scope.min, scope.max, scope.$value);
                }
                
                render(noFeedBack);
            };

            scope.$updateRatio = function (ratio, noFeedBack) {
                if (needComputeStep) {
                    var xratio = clamp(0.0, 1.0, ratio);
                    var value = sliderHelper.computeValue(scope.min, scope.max, xratio);
                    scope.$value = sliderHelper.getStepPos(scope.min, scope.max, step, value);
                    scope.$ratio = sliderHelper.computeRatio(scope.min, scope.max, scope.$value);
                } else {
                    scope.$ratio = clamp(0.0, 1.0, ratio);
                    scope.$value = sliderHelper.computeValue(scope.min, scope.max, scope.$ratio);
                }
                
                render(noFeedBack);
            };

            // callback for sliding, both dragging and clicking on slider are treated as 'sliding'
            function ratioChange(e){
                e.preventDefault();

                if (e.srcElement !== maxValElem[0]){
                    var ratio = manipulator.compuateRatioFromEvent(iElm, e);
                    scope.$updateRatio(ratio);
                    scope.$apply();

                    // only call onSlide when dragging or clicking action trigged
                    scope.onSlide();
                }
            }

            // bind moving callback when mouse is pressed
            function mouseDownAction(e){
                if (scope.ngDisabled || e.button !== 0) {
                    e.stopPropagation();
                } else {
                    ratioChange(e);
                    $document.bind('mousemove', ratioChange);
                }
            }

            iElm.bind('mousedown', mouseDownAction);
            iElm.bind('click', function (e) { e.stopPropagation(); });

            // unbind moving callback when mouse is release
            $document.bind('mouseup', function () {
                $document.unbind('mousemove', ratioChange);
            });

            // callback for ngModel updating
            ngModelCtrl.$render = function () {
                var value = ngModelCtrl.$viewValue || 0.0;
                scope.$updateValue(value, true);
            };

            // watching the change of ngDisabled
            scope.$watch('ngDisabled', function (newVal){
                if (newVal){
                    iElm.addClass('disabled');
                    scope.$broadcast('sliderDisabled', newVal);
                }else{
                    iElm.removeClass('disabled');
                    scope.$broadcast('sliderDisabled', newVal);
                }
            });

            // add min and max flags clicking action
            minValElem.bind('mousedown', function (e){
                e.preventDefault();
                e.stopPropagation();
                if (!scope.ngDisabled && e.button === 0){
                    // set value to min
                    scope.$updateValue(scope.min);
                    scope.onSlide();
                    scope.$apply();
                }
            });

            maxValElem.bind('mousedown', function (e){
                e.preventDefault();
                e.stopPropagation();
                if (!scope.ngDisabled && e.button === 0){
                    // set value to min
                    scope.$updateValue(scope.max);
                    scope.onSlide();
                    scope.$apply();
                }
            });

            // reference element
            scope.$watch('reference', function(newValue) {
                if (!isNaN(newValue)) {
                    var refValue = clamp(0.0, 1.0, newValue);
                    manipulator.updateProgressElm(sliderReferenceElm, refValue);
                }
            }, true);
        }
    };
}])

.directive('valueSliderHandler', ['$document', '$sliderHelper', '$luiDragAction', function ($document, $sliderHelper, DragAction) {
    return {
        priority: 1,
        scope: {
            handleSize: '='
        },
        require: '^valueSlider',
        restrict: 'EA',
        template: '<div class="value-slider-handler"></div>',
        replace: true,
        link: function(scope, iElm, iAttrs, sliderCtrl) {
            var manipulator = sliderCtrl.manipulator;

            // create a new scope on slider so the handle can linstern to the value-changing event
            var subScope = sliderCtrl.getScope();

            // method to get the relative position of handle to the slider container
            function handlerMove(e){
                e.preventDefault();
                e.stopPropagation();

                // get slider object info
                var info = sliderCtrl.getParentRect();
                // call the ratio method of parent controller to change the slider value
                // ratio method will trigger the valueChange event
                var ratio = manipulator.computeRatioFromHandleEvent(iElm, e, info);
                sliderCtrl.ratio(ratio);
                sliderCtrl.triggerSlideEvent();
            }

            iElm.css('top', 'calc(50% - ' + $sliderHelper.getCSSHeight(iElm[0]) / 2 + 'px)');

            // bind handlerMove callback to element
            iElm.bind('mousedown', function (e) {
                if (sliderCtrl.getIsEnable() && e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    $document.bind('mousemove', handlerMove);
                }
            });

            $document.bind('mouseup', function () {
                $document.unbind('mousemove', handlerMove);
            });

            // bind moving callback for mobile
            var dragAction = new DragAction();

            iElm.bind('touchstart', function (evt) {
                if (sliderCtrl.getIsEnable() && !dragAction.isActive()) {
                    dragAction.active(evt, dragAction.ACTION_TYPES.touch);
                }
            });

            $document.bind('touchmove', function (evt) {
                if (dragAction.isActive()) {
                    evt.stopPropagation();

                    // get slider object info
                    var info = sliderCtrl.getParentRect();
                    // call the ratio method of parent controller to change the slider value
                    // ratio method will trigger the valueChange event
                    var ratio = manipulator.computeRatioFromHandleEvent(iElm, evt.touches[0], info);
                    sliderCtrl.ratio(ratio);
                    sliderCtrl.triggerSlideEvent();
                }
            });

            $document.bind('touchend', function (evt) {
                if (dragAction.isActive()) {
                    dragAction.deactive(evt);
                }
            });

            // when valueChange event is triggered, update the handle position
            subScope.$on('sliderValueChange', function (e, ratio, value) {
                manipulator.updateHandleElm(iElm, ratio);
            });

            // when slider disabled event is triggered, update the handle class
            subScope.$on('sliderDisabled', function (e, isDisabled){
                if (isDisabled) {
                    iElm.addClass('disabled');
                } else {
                    iElm.removeClass('disabled');
                }
            });
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.ScrollView', ['LINDGE.UI-Core.Service.Drag'])

.controller('$luiScrollViewCtrl', ['$scope', '$element', '$attrs', '$document', '$luiDragAction',
function ($scope, $element, $attrs, $document, DragAction){
    var features = {
        horizon: false,
        vertical: true,
        track: true,
        scrollbar: true,
        wheel: true
    };

    var scrollInfo = {
        currentScrollX: 0.0,
        currentScrollY: 0.0,
        wrapperSizeX: 0.0,
        wrapperSizeY: 0.0,
        contentSizeX: 0.0,
        contentSizeY: 0.0,
        pixelRatioX: 1.0,
        pixelRatioY: 1.0
    };

    var uisettings = {
        resizeDetectingInterval: 200,
        minScrollbarSize: 30,
        wheelSpeed: 0.5,
        swipeSensitive: 1.5
    };

    var eventhandles = {
        'scroll': [],
        'update': [],
        'destroy': []
    };

    // load elements
    var viewElement = $element.children().eq(0);
    var wrapper = angular.element($element[0].querySelector('.scroll-wrapper'));
    var contentElm = wrapper.children().eq(0);

    wrapper.scrollTop = 0;
    wrapper.scrollLeft = 0;

    function init() {
        var featureStrs = $attrs['feature'];
        if (featureStrs) {
            featureStrs.split(';').forEach(function (item) {
                var parts = item.split('=');
                var name = parts[0].trim();
                if (features.hasOwnProperty(name)) {
                    var value = parts[1].trim();
                    if (value == 'true' || value == '1') {
                        features[name] = true;
                    } else if (value == 'false' || value == '0') {
                        features[name] = false;
                    }
                }
            });
        }

        var height = $attrs['height'];
        if (height) {
            if (!/px\s*$/.test(height)) {
                height += 'px';
            }
            wrapper.css('height', height);
        }

        if ($attrs['class']) {
            wrapper.addClass($attrs['class']);
            $element.removeAttr('class');
        }
    }

    function execEvents(name) {
        var params = Array.prototype.slice.call(arguments, 1);
        eventhandles[name].forEach(function (callback) {
            callback.apply(params);
        });
    }

    // sizeing helper functions
    function getWrapperSizes() {
        return wrapper[0].getBoundingClientRect();
    }

    function getContentSizes() {
        return contentElm[0].getBoundingClientRect();
    }

    function getScrollSizeX() {
        var size = scrollInfo.contentSizeX - scrollInfo.wrapperSizeX;
        if (size >= 0) {
            return size;
        } else {
            return 0.0;
        }
    }

    function getScrollSizeY() {
        var size = scrollInfo.contentSizeY - scrollInfo.wrapperSizeY;
        if (size >= 0) {
            return size;
        } else {
            return 0.0;
        }
    }

    function getScrollbarSizeX() {
        var scrollSize = getScrollSizeX();
        if (scrollSize > 0) {
            return Math.max(scrollInfo.wrapperSizeX - scrollSize, uisettings.minScrollbarSize);
        } else {
            return 0.0;
        }
    }

    function getScrollbarSizeY() {
        var scrollSize = getScrollSizeY();
        if (scrollSize > 0) {
            return Math.max(scrollInfo.wrapperSizeY - scrollSize, uisettings.minScrollbarSize);
        } else {
            return 0.0;
        }
    }

    // compute scrolling
    function scrollByMethod(elm, x, y) {
        elm.scrollTo(x, y);
    }

    function scrollByProp(elm, x, y) {
        elm.scrollLeft = x;
        elm.scrollTop = y;
    }

    var elmScrollHandle;
    if (angular.isFunction(wrapper[0].scrollTo)) {
        elmScrollHandle = scrollByMethod;
    } else {
        // IE doesn't support scrollTo() method,
        // but supports overriding scrollLeft/scrollTop property which chrome doesn't
        elmScrollHandle = scrollByProp;
    }

    // main scroll functions
    function updateContainerSizes() {
        var wrapperSizes = getWrapperSizes();
        var contentSizes = getContentSizes();

        scrollInfo.wrapperSizeX = wrapperSizes.width;
        scrollInfo.wrapperSizeY = wrapperSizes.height;
        scrollInfo.contentSizeX = contentSizes.width;
        scrollInfo.contentSizeY = contentSizes.height;

        var scrollSizeX = getScrollSizeX();
        if (scrollSizeX === 0) {
            scrollInfo.pixelRatioX = 1.0;
        } else {
            var activeSizeX = Math.min(scrollSizeX, scrollInfo.wrapperSizeX - uisettings.minScrollbarSize);
            scrollInfo.pixelRatioX = activeSizeX / scrollSizeX;
        }

        var scrollSizeY = getScrollSizeY();
        if (scrollSizeY === 0) {
            scrollInfo.pixelRatioY = 1.0;
        } else {
            var activeSizeY = Math.min(scrollSizeY, scrollInfo.wrapperSizeY - uisettings.minScrollbarSize);
            scrollInfo.pixelRatioY = activeSizeY / scrollSizeY;
        }
    }

    function scroll(x, y) {
        if (scrollInfo.contentSizeX <= scrollInfo.wrapperSizeX) {
            scrollInfo.currentScrollX = 0.0;
        } else if (x !== null) {
            var maxSizeX = getScrollSizeX();
            x = Math.max(0, Math.min(x, maxSizeX));
            scrollInfo.currentScrollX = x;
        }

        if (scrollInfo.contentSizeY <= scrollInfo.wrapperSizeY) {
            scrollInfo.currentScrollY = 0.0;
        } else if (y !== null) {
            var maxSizeY = getScrollSizeY();
            y = Math.max(0, Math.min(y, maxSizeY));
            scrollInfo.currentScrollY = y;
        }

        elmScrollHandle(wrapper[0], scrollInfo.currentScrollX, scrollInfo.currentScrollY);

        execEvents('scroll', scrollInfo.currentScrollX, scrollInfo.currentScrollY);
    }

    // size watcher
    var contentSizeWatcher = null;

    function resizeCallback() {
        var oldScrollInfo = angular.extend({}, scrollInfo);
        updateContainerSizes();

        if ((features.horizon && scrollInfo.contentSizeX != oldScrollInfo.contentSizeX) ||
            (features.vertical && scrollInfo.contentSizeY != oldScrollInfo.contentSizeY)) {
            scroll(scrollInfo.currentScrollX, scrollInfo.currentScrollY);

            execEvents('update');
        }

        contentSizeWatcher = setTimeout(resizeCallback, uisettings.resizeDetectingInterval);
    }

    // wheel
    if (features.wheel) {
        wrapper.bind('wheel', function (evt) {
            evt = evt.originalEvent || evt;
            if (evt.deltaY) {
                evt.preventDefault();
                evt.stopPropagation();
                scroll(null, scrollInfo.currentScrollY + evt.deltaY * scrollInfo.pixelRatioY * uisettings.wheelSpeed);
            }
        });
    }

    // swipe
    var dragAction = new DragAction();

    wrapper.bind('touchstart', function (evt) {
        if (!dragAction.isActive()) {
            dragAction.active(evt, dragAction.ACTION_TYPES.touch);
            $document.bind('touchmove', swipeHandle);
        }
    });

    function swipeHandle(evt) {
        if (dragAction.isActive()) {
            evt.preventDefault();
            evt.stopPropagation();

            var offsets = dragAction.offset(evt);
            scroll(scrollInfo.currentScrollX - offsets[0] * uisettings.swipeSensitive,
                scrollInfo.currentScrollY - offsets[1] * uisettings.swipeSensitive);
        }
    }

    function swipeEndHandle(evt) {
        if (dragAction.isActive()) {
            dragAction.deactive(evt);
            $document.unbind('touchmove', swipeHandle);
        }
    }

    $document.bind('touchend', swipeEndHandle);
    
    // clear
    $scope.$on('$destroy', function () {
        execEvents('destroy');

        if (contentSizeWatcher) {
            window.clearTimeout(contentSizeWatcher);
        }

        $document.unbind('touchend', swipeEndHandle);
    });

    // init
    init();
    updateContainerSizes();
    setTimeout(resizeCallback, uisettings.resizeDetectingInterval);

    // interfaces
    this.getFeatures = function () {
        return features;
    };

    this.getCurrentScrollPosition = function () {
        return [scrollInfo.currentScrollX, scrollInfo.currentScrollY];
    };

    this.getScrollSizeX = function () {
        return getScrollSizeX();
    };

    this.getScrollSizeY = function () {
        return getScrollSizeY();
    };

    this.scrollXBy = function (offset, relative) {
        if (relative) {
            offset /= scrollInfo.pixelRatioX;
        }

        scroll(scrollInfo.currentScrollX + offset, null);
    };

    this.scrollYBy = function (offset, relative) {
        if (relative) {
            offset /= scrollInfo.pixelRatioY;
        }

        scroll(null, scrollInfo.currentScrollY + offset);
    };

    this.forceUpdate = function () {
        if (contentSizeWatcher) {
            window.clearTimeout(contentSizeWatcher);
        }

        contentSizeWatcher();
    };

    this.getScrollbarSizeX = function() {
        return getScrollbarSizeX();
    };

    this.getScrollbarSizeY = function() {
        return getScrollbarSizeY();
    };

    this.getCurrentScrollbarPosition = function () {
        return [scrollInfo.currentScrollX * scrollInfo.pixelRatioX, scrollInfo.currentScrollY * scrollInfo.pixelRatioY];
    };

    this.addEventListener = function (name, callback) {
        if (!eventhandles.hasOwnProperty(name)) {
            throw new Error('invalid event name');
        }

        if (!angular.isFunction(callback)) {
            throw new TypeError('invalid callback');
        }

        eventhandles[name].push(callback);
    };

    this.markInteractiveState = function (state) {
        if (!!state) {
            viewElement.addClass('scroll-interactive');
        } else {
            viewElement.removeClass('scroll-interactive');
        }
    };
}])

.directive('luiScrollView', [function(){
    return {
        priority: 1,
        scope: false,
        require: 'luiScrollView',
        controller: '$luiScrollViewCtrl',
        restrict: 'E',
        templateUrl: 'lui-tpl/ScrollView/scrollview.tmpl.html',
        transclude: true,
        replace: false,
        link: function(scope, iElm, iAttrs, ctrl) {
            scope.showVerticalScrollbar = ctrl.getFeatures().vertical;
        }
    };
}])

.directive('luiScrollHandle', ['$document', '$luiDragAction', function ($document, DragAction) {
    var handleImpl = {
        vertical: {
            init: function (handle) {
                handle.css('top', '0');
            },
            resize: function (scrollView, handle) {
                var size = scrollView.getScrollbarSizeY();
                if (size > 0) {
                    handle.css('height', size + 'px');
                    return true;
                } else {
                    return false;
                }
            },
            position: function (scrollView, handle) {
                var pos = scrollView.getCurrentScrollbarPosition()[1];
                handle.css('top', pos + 'px');
            },
            drag: function (action, evt, scrollView) {
                var offsets = action.offset(evt);
                scrollView.scrollYBy(offsets[1], true);
            }
        },
        horizontal: null
    };

    return {
        priority: 1,
        scope: {
            mode: '@'
        },
        require: '^luiScrollView',
        restrict: 'EA',
        templateUrl: 'lui-tpl/ScrollView/scrollbar.tmpl.html',
        replace: true,
        transclude: false,
        link: function(scope, iElm, iAttrs, scrollView) {
            scope.useTrack = scrollView.getFeatures().track;
            scope.active = false;

            var impl;
            switch (scope.mode) {
                case 'vertical':
                    impl = handleImpl.vertical;
                    break;
                case 'horizontal':
                    impl = handleImpl.horizontal;
                    break;
                default:
                    return;
            }

            iElm.addClass(scope.mode);
            var scrollbar = angular.element(iElm[0].querySelector('.scrollbar'));
            impl.init(scrollbar);

            // ui helper functions
            function uiActiveScroll() {
                scrollbar.addClass('active');
                scrollView.markInteractiveState(true);
            }

            function uiDeactiveScroll() {
                scrollbar.removeClass('active');
                scrollView.markInteractiveState(false);
            }

            function updateSize() {
                scope.active = impl.resize(scrollView, scrollbar);
            }

            function updatePosition() {
                impl.position(scrollView, scrollbar);
            }

            // event handles
            // dragging events
            var dragAction = new DragAction();

            function dragHandler(evt) {
                if (dragAction.isActive()) {
                    evt.preventDefault();
                    evt.stopPropagation();

                    impl.drag(dragAction, evt, scrollView);
                }
            }

            function mouseDragEndHandler(evt) {
                if (dragAction.isActive()) {
                    dragAction.deactive(evt);
                    uiDeactiveScroll();
                    $document.unbind('mousemove', dragHandler);
                }
            }

            function touchDragEndHandler(evt) {
                if (dragAction.isActive()) {
                    dragAction.deactive(evt);
                    uiDeactiveScroll();
                    $document.unbind('touchmove', dragHandler);
                }
            }

            scrollbar.bind('mousedown', function (evt) {
                if (!dragAction.isActive()) {
                    dragAction.active(evt, dragAction.ACTION_TYPES.mouse);
                    uiActiveScroll();

                    $document.bind('mousemove', dragHandler);
                }
            });

            $document.bind('mouseup', mouseDragEndHandler);

            scrollbar.bind('touchstart', function (evt) {
                if (!dragAction.isActive()) {
                    dragAction.active(evt, dragAction.ACTION_TYPES.touch);
                    uiActiveScroll();

                    $document.bind('touchmove', dragHandler);
                }
            });

            $document.bind('touchend', touchDragEndHandler);

            // scroll view events
            scrollView.addEventListener('scroll', function () {
                updatePosition();
            });

            scrollView.addEventListener('update', function () {
                updateSize();
                updatePosition();
            });

            scrollView.addEventListener('destroy', function () {
                $document.unbind('mouseup', mouseDragEndHandler);
                $document.unbind('touchend', touchDragEndHandler);
            });

            updateSize();
            updatePosition();
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.TreeView', [])

.factory('luiTreeViewParams', [function () {
    function defaultChildrenGetter (node) {
        return [];
    }

    var ACTION_TYPES = {
        AUTO: 'auto',
        MANUAL: 'manual',
        OFF: 'off'
    };

    var DATA_LOAD_POLICY = {
        AUTO: 0x01,
        SYNC: 0x02,
        ASYNC: 0x03
    };

    function initNodeState(node, level, open) {
        if (!node.$initialized) {
            node.$initialized = true;
            node.$isOpen = open;
            node.$level = level;
            node.$queryId = 0;
        }
    }

    function initNodes (nodeList, level, params) {
        var noAction = params.setting.clickToExpand == ACTION_TYPES.OFF;

        for (var i = 0; i < nodeList.length; i++) {
            var node = nodeList[i];
            initNodeState(node, level, noAction);

            var children = params.adaptor.getChildren(node);
            if (children.length > 0) {
                initNodes(children, level + 1, params);
            }
        }

        return nodeList;
    }

    /**
     * represents a path in a nodes tree
     *
     * @param {Array<node>} nodes
     */
    function NodePath(nodes) {
        this._nodes = nodes;
    }

    Object.defineProperty(NodePath.prototype, 'first', {
        get: function () {
            if (this._nodes.length > 0) {
                return this._nodes[0];
            } else {
                return null;
            }
        },
        set: function (newValue) { },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(NodePath.prototype, 'last', {
        get: function () {
            if (this._nodes.length > 0) {
                return this._nodes[this._nodes.length - 1];
            } else {
                return null;
            }
        },
        set: function (newValue) { },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(NodePath.prototype, 'length', {
        get: function () {
            return this._nodes.length;
        },
        set: function (newValue) { },
        enumerable: true,
        configurable: true
    });

    NodePath.prototype.toArray = function() {
        return this._nodes.slice(0);
    };

    NodePath.prototype.forEach = function(callback) {
        this._nodes.forEach(callback);
    };

    /* node adaptor
    {
        getId,
        getName,
        getChildren
    }

    config
    {
        dataLoadPolicy
        dataProvider(node, success, fail)
        actionType: ACTION_TYPES
    }
    */

    /**
     * TreeViewParams
     * @param {Object} nodeAdaptor
     */
    function TreeViewParams (nodeAdaptor, config) {
        this.adaptor = {
            getID: null,
            getName: null,
            getChildren: defaultChildrenGetter,
            setChildren: null
        };

        this.setting = {
            dataLoadPolicy: DATA_LOAD_POLICY.AUTO,
            dataProvider: null,
            clickToExpand: config.actionType === undefined ? ACTION_TYPES.AUTO : config.actionType
        };

        angular.extend(this.adaptor, nodeAdaptor);
        angular.extend(this.setting, config);

        if (this.setting.dataLoadPolicy !== DATA_LOAD_POLICY.AUTO &&
            !this.setting.dataProvider) {
            throw new Error('dataProvider must be provided');
        }

        this.data = [];
    }

    TreeViewParams.ACTION_TYPES = ACTION_TYPES;

    TreeViewParams.DATA_LOAD_POLICY = DATA_LOAD_POLICY;

    TreeViewParams.prototype.getNodeChildren = function(node) {
        if (!!node) {
            return this.adaptor.getChildren(node);
        } else {
            return [];
        }
    };

    TreeViewParams.prototype.getNodeId = function(node) {
        if (this.adaptor.getId) {
            var id = this.adaptor.getId(node);
            return id || '';
        } else {
            return '';
        }
    };

    TreeViewParams.prototype.getNodeName = function(node) {
        if (this.adaptor.getName) {
            var id = this.adaptor.getName(node);
            return id || '';
        } else {
            return '';
        }
    };

    TreeViewParams.prototype.openNode = function(node) {
        if (node) {
            if (node instanceof NodePath) {
                node.forEach(function (n) {
                    n.$isOpen = true;
                });
                this.reloadNode(node.last);
            } else {
                node.$isOpen = true;
                this.reloadNode(node);
            }
        }
    };

    TreeViewParams.prototype.closeNode = function(node) {
        if (node) {
            if (node instanceof NodePath) {
                node.forEach(function (n) {
                    n.$isOpen = false;
                });
            } else {
                node.$isOpen = false;
            }
        }
    };

    TreeViewParams.prototype.toggleNodeOpen = function(node) {
        if (node) {
            if (node instanceof NodePath) {
                node.forEach(function (n) {
                    n.$isOpen = !n.$isOpen;
                });

                if (node.last.$isOpen) {
                    this.reloadNode(node.last);
                }
            } else {
                if (node.$isOpen) {
                    node.$isOpen = false;
                } else {
                    this.openNode(node);
                }
            }
        }
    };

    TreeViewParams.prototype.reloadNode = function(node) {
        if (!node) {
            return;
        }

        var setting = this.setting;
        var adaptor = this.adaptor;
        var dataProvider = this.setting.dataProvider;

        switch (setting.dataLoadPolicy) {
            case DATA_LOAD_POLICY.SYNC:
                dataProvider(
                    node,
                    children => {
                        if (children !== null) {
                            adaptor.setChildren(node, initNodes(children, node.$level + 1, this));
                        }
                    },
                    angular.noop
                );
                break;
            case DATA_LOAD_POLICY.ASYNC:
                node.$queyrId++;
                var queryId = node.$queryId;
                dataProvider(
                    node,
                    children => {
                        if (children !== null) {
                            if (queryId == node.$queryId) {
                                adaptor.setChildren(node, initNodes(children, node.$level + 1, this));
                            }
                        }
                    },
                    angular.noop
                );
                break;
            default:
                return;
        }
    };

    TreeViewParams.prototype.reload = function(nodes) {
        if (!nodes) {
            throw new Error('parameter nodes is null');
        }

        if (!Array.isArray(nodes)) {
            nodes = [nodes];
        }

        this.data = initNodes(nodes, 0, this);
    };
 
    TreeViewParams.createParam = function (nodeAdaptor, config) {
        return new TreeViewParams(nodeAdaptor, config);
    };

    TreeViewParams.prototype.findNode = function(predict) {
        var queue = this.data.slice(0);
        var cache = [];

        while (queue.length > 0) {
            var node = queue.shift();
            cache.push(node);

            if (predict(node)) {
                return new NodePath(cache);
            } else {
                var children = this.adaptor.getChildren(node);
                if (children.length > 0) {
                    Array.prototype.unshift.apply(queue, children);
                } else {
                    cache.pop();
                }
            }
        }

        return null;
    };

    return TreeViewParams;
}])

.controller('$luiTreeViewCtrl', ['$scope', function ($scope) {
    this.getParam = function () {
        return $scope.params || null;
    };
}])

.directive('luiTreeView', ['$q', 'luiTreeViewParams', function($q, TreeViewParams) {
    var ACTION_TYPES = TreeViewParams.ACTION_TYPES;

    function getIndent (indentValue) {
        var indent = Number(indentValue);
        if (isNaN(indent)) {
            return 15;
        } else {
            return Math.max(indent, 0);
        }
    }

    var defaultContentTemplate = 'lui-tpl/TreeView/tree-item-default.tmpl.html';

    return {
        priority: 1,
        scope: true,
        restrict: 'E',
        templateUrl: 'lui-tpl/TreeView/tree-view.tmpl.html',
        controller: '$luiTreeViewCtrl',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            var paramsAttr = 'treeViewParams';
            var params = null;
            scope.params = null;

            scope.itemTpl = scope.$eval(iAttrs.contentTpl) || defaultContentTemplate;

            var indent = getIndent(scope.$eval(iAttrs.indent));
            
            scope.toggleOpen = function(node) {
                if (params.setting.clickToExpand === ACTION_TYPES.AUTO) {
                    params.toggleNodeOpen(node);
                }
            };

            scope.getPadding = function (node) {
                return node.$level * indent + 'px';
            };

            scope.$watch(function () {
                return scope.$parent.$eval(iAttrs[paramsAttr]);
            }, function (newParams) {
                if (newParams && (newParams instanceof TreeViewParams)) {
                    params = newParams;
                    scope.params = newParams;
                }
            });
        }
    };
}])

.directive('luiTreeItem', ['$templateCache', '$compile', 'luiTreeViewParams', function ($templateCache, $compile, TreeViewParams) {
    var recurseTemplate = $templateCache.get('lui-tpl/TreeView/tree-item.tmpl.html');
    var recurseWrapper = angular.element(recurseTemplate);

    var fragment = new DocumentFragment();
    fragment.append(recurseWrapper[0]);

    return {
        priority: 1,
        scope: false,
        require: '^?luiTreeView',
        restrict: 'EA',
        replace: false,
        link: function(scope, iElm, iAttrs) {
            iElm.addClass('lui-tree-item-wrapper');
            iElm.css({ 'padding-left': scope.getPadding(scope.$node) });

            var elm = iElm[0];
            var recurseElm = fragment.cloneNode(true);
            elm.parentNode.insertBefore(recurseElm, elm.nextSibling);

            iElm.bind('click', function () {
                scope.toggleOpen(scope.$node);
                scope.$apply();
            });

            $compile(elm.nextSibling)(scope);

            return angular.noop;
        }
    };
}]);
angular.module('LINDGE.UI-Core.Control.Waiting', [])

.service('$luiWaiting', [function () {
    var instances = {};
    
    this.registerWaitingInstance = function (name, ctrl) {
        instances[name] = ctrl;
    };

    this.unregisterWaitingInstance = function (name) {
        delete instances[name];
    };

    this.showWaitingByName = function (name, ...params) {
        var instance = instances[name];
        if (instance) {
            instance.show(...params);
        }
    };

    this.hideWaitingByName = function (name) {
        var instance = instances[name];
        if (instance) {
            instance.hide();
        }
    };

    this.bindWaitingByStates = function (scope, state, names, paramList) {
        var unWatch = scope.$watch(state, function(newValue) {
            if (newValue) {
                names.forEach(function (name, index) {
                    var instance = instances[name];
                    if (instance) {
                        var params = paramList[index];
                        if (Array.isArray(params)) {
                            instance.show(...paramList[index]);   
                        } else if (typeof params == 'function') {
                            instance.show(params());
                        } else {
                            instance.show();
                        }
                    }
                });
            } else {
                names.forEach(function (name) {
                    var instance = instances[name];
                    if (instance) {
                        instance.hide();
                    }
                });
            }
        });

        scope.$on('$destroy', function () {
            unWatch();
        });
    };
}])

.controller('$luiWaitingComponentCtrl', ['$element', function ($element) {
    var components = [];
    var cssDisplay = window.getComputedStyle($element[0])['display'];

    $element.css('display', 'none');

    var isShown = false;

    this.show = function (...params) {
        if (!isShown) {
            $element.css('display', cssDisplay);

            try {
                components.forEach(function (component) {
                    component.onShow(...params);
                });
            } finally {
                isShown = true;
            }
        }
    };

    this.hide = function () {
        if (isShown) {
            $element.css('display', 'none');

            try {
                components.forEach(function (component) {
                    if (component.onHide) {
                        component.onHide();
                    }
                });
            } finally {
                isShown = false;
            }
        }
    };

    this.addComponent = function (component) {
        if (component) {
            components.push(component);
        } else {
            throw new Error('component is null');
        }
    };
}])

.directive('luiWaiting', ['$luiWaiting', function ($luiWaiting) {
    var count = 0;

    return {
        priority: 1,
        scope: {
            waitingExp: '@',
            waitingParams: '=',
            captureEvents: '='
        },
        controller: '$luiWaitingComponentCtrl',
        restrict: 'E',
        replace: false,
        link: function(scope, iElm, iAttrs, thisCtrl) {
            iElm.addClass('lui-waiting');
            var name = iAttrs['name'];
            if (!name) {
                count++;
                name = 'waiting_' + String(count);
            }

            $luiWaiting.registerWaitingInstance(name, thisCtrl);

            if (!angular.isDefined(iAttrs.captureEvents) || !!scope.captureEvents) {
                iElm.bind('click mousedown touch', function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                });
            }

            scope.$on('$destroy', function () {
                $luiWaiting.unregisterWaitingInstance(name);
            });

            // auto bind waiting attribute
            if (scope.waitingExp) {
                var paramGetter = function() {
                    if (Array.isArray(scope.waitingParams)) {
                        return scope.waitingParams;
                    } else {
                        return [];
                    }
                };

                $luiWaiting.bindWaitingByStates(scope.$parent, scope.waitingExp, [name], [paramGetter]);
            }
        }
    };
}]);
angular.module('LINDGE.UI-Core.Filter.DOMTextFilter', [])

.filter('domTextFilter', ['$SDK', function ($SDK) {
    function string2SingleDOM(text) {
        if (text === null || text === undefined) {
            text = '<div tempelm=""></div>';
        } else {
            text = '<div tempelm="">' + text + '</div>';
        }
        
        return angular.element(text);
    }

    var ellipsis = '...';

    return function (domText, maxLen, trim) {
        var elements;

        if (angular.isString(domText)) {
            try {
                elements = string2SingleDOM(domText);
                if (elements.length === 0) {
                    return domText.substr(0, maxLen || domText.length);
                }
            } catch (e) {
                return domText.substr(0, maxLen || domText.length);
            }
        } else if (domText.hasOwnProperty('length')) {
            elements = domText;
        } else {
            return '';
        }
        

        trim = !!trim;
        var texts = [];
        var lenThreshold = maxLen || Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;
        var textLen = 0;
        $SDK.DOM.walkDOM(elements, function (node) {
            if (node.nodeType == 3) {
                var nodeText = node.nodeValue;
                var value = trim ? nodeText.trim() : nodeText;
                texts.push(value);
                textLen += value.length;

                return textLen <= lenThreshold;
            } else {
                return true;
            }
        });

        var result = texts.join('');
        if (result.length > lenThreshold) {
            return result.substr(0, lenThreshold - ellipsis.length) + ellipsis;
        } else {
            return result;
        }
    };
}]);
angular.module('LINDGE.UI-Core.Filter.Gender', [])

.filter('genderFilter', [function () {
    var maleNotations = ['male', 'man', 'men'];
    var femaleNotations = ['female', 'woman', 'women'];
    var defaultNotation = 'unknown';

    return function (gender) {
        if (typeof gender == 'string') {
            gender = gender.trim().toLowerCase();
            if (gender === '' || gender == defaultNotation) {
                return '未知';
            } else {
                if (maleNotations.indexOf(gender) >= 0) {
                    return '男';
                } else if (femaleNotations.indexOf(gender) >= 0) {
                    return '女';
                } else {
                    return gender;
                }
            }
        } else {
            return gender;
        }
    };
}]);
angular.module('LINDGE.UI-Core.Filter.Numbers', [])

.filter('numberPretty', ['$filter', function ($filter) {
    var numberFilter = $filter('number');

    var zeroFracPattern = /\.0+$/;

    return function (number, fractionSize) {
        var formatResult = numberFilter(number, fractionSize);
        return formatResult.replace(zeroFracPattern, '');
    };
}]);
angular.module('LINDGE.UI-Core.Filter.PlatformImage', [])

.filter('platformImage', ['Scenario', 'systemConfig', 'path', function (Scenario, systemConfig, path) {
    var baseUrl = systemConfig.imageUrl;
    var imageFormat = 'png';

    return function (imageId) {
        if (imageId) {
            var scenarioName = Array.prototype.slice.call(arguments, 1).join('.');
            var scenario = Scenario['Image'][scenarioName];
            var scenarioId = !!scenario ? scenario.id : '';

            var imageParts;
            if (scenarioId) {
                imageParts = [imageId, '_', scenarioId, '.', imageFormat];
            } else {
                if (scenarioName) {
                    scenarioName = scenarioName.toUpperCase();
                    imageParts = [imageId, '_', scenarioName, '.', imageFormat];
                } else {
                    imageParts = [imageId, '.', imageFormat];
                }
            }

            var imagePath = path.combine(baseUrl, imageParts.join(''));
            return imagePath;
        } else {
            return '';
        }
    };
}]);
angular.module('LINDGE.UI-Core.Filter.TimeDisplayFilter', ['LINDGE.UI-Core.Service.GlobalClock'])

.value('$$timeCounter',
function timeCounter(ms) {
    this.ms = ms;
    this.seconds = ms / 1000;
    this.minutes = ms / 60000;
    this.hours = this.minutes / 60;
    this.days = this.hours / 24;
    this.weeks = this.days / 7;
    this.months = this.weeks / 4;
    this.years = this.months / 12;
})

.value('$$timeFormatters',
[{
    mark: 's',
    // ms -> second
    check: function (counter) {
        return counter.seconds < 60;
    },
    format: function (counter) {
        return parseInt(counter.seconds) + '秒';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.seconds),
            unit: '秒'
        };
    }
}, {
    mark: 'm',
    // ms -> minute
    check: function (counter) {
        return counter.minutes < 60;
    },
    format: function (counter) {
        return parseInt(counter.minutes) + '分钟';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.minutes),
            unit: '分钟'
        };
    }
}, {
    mark: 'h',
    // ms -> hour
    check: function (counter) {
        return counter.hours < 24;
    },
    format: function (counter) {
        return parseInt(counter.hours) + '小时';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.hours),
            unit: '小时'
        };
    }
}, {
    mark: 'd',
    // ms -> day
    check: function (counter) {
        return counter.days < 7;
    },
    format: function (counter) {
        return parseInt(counter.days) + '天';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.days),
            unit: '天'
        };
    }
}, {
    mark: 'W',
    // ms -> week
    check: function (counter) {
        return counter.weeks < 4;
    },
    format: function (counter) {
        return parseInt(counter.weeks) + '周';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.weeks),
            unit: '周'
        };
    }
}, {
    mark: 'M',
    // ms -> months
    check: function (counter) {
        return counter.months < 12;
    },
    format: function (counter) {
        return parseInt(counter.months) + '月';
    },
    formatStruct: function (counter) {
        return {
            time: parseInt(counter.months),
            unit: '月'
        };
    }
}])

.filter('timeOffsetDisplayFilter', ['globalClock', '$filter', '$$timeCounter', '$$timeFormatters',
function (clock, $filter, timeCounter, timeFormatters) {
    var formatters = timeFormatters;

    var overflowHint = '一年';
    var exactHint = '当前';

    var positiveLapseHint = '前';
    var negativeLapseHint = '后';

    function getDate(time) {
        if (time instanceof Date) {
            return time;
        } else if (angular.isNumber(time)) {
            return new Date(time * 1000);
        } else {
            return new Date(time);
        }
    }

    return function (queryTime, anchorTime, mode) {
        var currentTime;
        if (anchorTime) {
            currentTime = getDate(anchorTime);
        } else {
            if (!clock.initiated) {
                return $filter('date')(queryTime, mode);
            } else {
                currentTime = clock.getCurrentTime();
            }
        }

        var compareTime = getDate(queryTime);
        var lapse = currentTime.getTime() - compareTime.getTime();

        if (lapse === 0) {
            return exactHint;
        } else {
            var postfix = lapse > 0 ? positiveLapseHint : negativeLapseHint;
            var time = new timeCounter(Math.abs(lapse));

            for (var i = 0; i < formatters.length; i++) {
                var formatter = formatters[i];
                if (formatter.check(time)) {
                    return formatter.format(time) + postfix;
                }
            }

            return overflowHint + postfix;
        }
    };
}])

.filter('periodDisplayFilter', ['$filter', '$$timeCounter', '$$timeFormatters', function ($filter, timeCounter, timeFormatters) {
    var formatters = timeFormatters;

    var overflowHint = '超过一年';
    var exactHint = '不到一秒';

    var numberPattern = /\(time\)/g;
    var unitFormat = /\(unit\)/g;

    // lapse -> s
    return function (lapse, maxUnit, customFormat) {
        if (lapse === 0) {
            return exactHint;
        } else {
            var time = new timeCounter(lapse * 1000);

            for (var i = 0; i < formatters.length; i++) {
                var formatter = formatters[i];
                if (formatter.mark === maxUnit || formatter.check(time)) {
                    if (customFormat && angular.isString(customFormat)) {
                        var struct = formatter.formatStruct(time);
                        return customFormat
                            .replace(numberPattern, struct.time)
                            .replace(unitFormat, struct.unit);
                    } else {
                        return formatter.format(time);
                    }
                }
            }

            return overflowHint;
        }
    };
}])

.filter('periodFormatFilter', [function () {
    function padZero (num) {
        num = Math.round(num);

        if (num < 10) {
            return '0' + num;
        } else {
            return String(num);
        }
    }

    // lapse -> s
    return function (lapse, skipHour) {
        lapse = Math.round(lapse);

        if (isNaN(lapse)) {
            return skipHour ? '00:00' : '00:00:00';
        } else {
            var hour = Math.floor(lapse / 3600);
            var lapseLeft = lapse - hour * 3600;
            var minute = Math.floor(lapseLeft / 60);
            var second = lapseLeft - minute * 60;

            var parts = [padZero(hour), padZero(minute), padZero(second)];
            if (skipHour && hour === 0) {
                parts.shift();
            }

            return parts.join(':');
        }
    };
}])

.filter('periodFormatMSFilter', ['$filter', function ($filter) {
    var periodFormatFilter = $filter('periodFormatFilter');

    // lapse -> ms
    return function (lapse, skipHour) {
        lapse /= 1000;
        return periodFormatFilter(lapse, skipHour);
    };
}]);
angular.module('LINDGE.UI-Core.Filter.UnitsConversion', [])

.filter('luiByteUnitDisplayFilter', ['$SDK', function ($SDK) {
    var ByteUnit = $SDK.Unit.ByteUnit;

    return function (byteSize, targetUnit, precision) {
        byteSize = Number(byteSize);
        if (isNaN(byteSize)) {
            if (targetUnit) {
                return '0' + targetUnit.toUpperCase();
            } else {
                return '0KB';
            }
        }

        precision = Number(precision);
        if (isNaN(precision)) {
            precision = 0;
        }

        var byteValue = new ByteUnit(byteSize, 'b');
        if (targetUnit) {
            byteValue.convertTo(targetUnit);
            return byteValue.toString(precision);
        } else {
            if (byteValue.getValue() < 1024) {
                return byteValue.toString(0);
            }

            byteValue.convertTo('kb');

            if (byteValue.getValue() < 1024) {
                return byteValue.toString(precision);
            }

            byteValue.convertTo('mb');

            if (byteValue.getValue() < 1024) {
                return byteValue.toString(precision);
            }

            byteValue.convertTo('gb');
            return byteValue.toString(precision);
        }
    };
}]);
angular.module('LINDGE.UI-Core.Service.DOMService', [])

.factory('ElementStateMonitor', ['$SDK', '$log', function ($SDK, $log) {
    /**
     * element state checker
     *
     * @class      ElementStateChecker
     * @param      {HTMLElement|HTMLElement[]}  element
     */
    function ElementStateChecker(element) {
        this._element = element;
        this._callbacks = [];

        this.enable = true;
    }

    ElementStateChecker.prototype.addCallback = function(callback) {
        if (typeof callback == 'function') {
            this._callbacks.push(callback);
        } else {
            throw new TypeError('invalid callback');
        }
    };

    ElementStateChecker.prototype._trigger = function() {
        var args = arguments;
        this._callbacks.forEach(function (cb) {
            try {
                cb.apply(null, args);
            } catch (err) {
                $log.error('error occurred when trigger state callback', err);
            }
        });
    };

    ElementStateChecker.prototype.trigger = function() {
        throw new Error('not implemented');
    };

    ElementStateChecker.prototype.check = function() {
        throw new Error('not implemented');
    };

    /**
     * visibility checker
     *
     * @class      VisibilityChecker
     * @param      {HTMLElement}  element
     */
    function VisibilityChecker(element) {
        ElementStateChecker.call(this, element);
        this._visible = this._isVisible(element);
    }

    $SDK.Lang.inherits(VisibilityChecker, ElementStateChecker);

    VisibilityChecker.prototype._isVisible = function(element) {
        return !!element.offsetParent;
    };

    VisibilityChecker.prototype.trigger = function() {
        this._trigger(this._visible);
    };

    VisibilityChecker.prototype.check = function() {
        if (this.enable) {
            var visible = this._isVisible(this._element);
            if (visible != this._visible) {
                this._visible = visible;
                this._trigger(visible);
            }
        }
    };

    /**
     * size checker
     *
     * @class      SizeChecker
     * @param      {HTMLElement}  element
     * @param      {Boolean=}  lazy
     */
    function SizeChecker(element, lazy) {
        ElementStateChecker.call(this, element);
        this._size = this._getSize(element);
        this._lazy = !!lazy;
        this._hasChanged = false;
    }

    $SDK.Lang.inherits(SizeChecker, ElementStateChecker);

    SizeChecker.prototype._getSize = function(element) {
        return {
            width: element.clientWidth,
            height: element.clientHeight
        };
    };

    SizeChecker.prototype.trigger = function() {
        this._trigger(this._size);
    };

    SizeChecker.prototype.check = function() {
        if (this.enable) {
            var newSize = this._getSize(this._element);
            if (newSize.width != this._size.width ||
                newSize.height != this._size.height) {
                this._size = newSize;
                if (this._lazy) {
                    this._hasChanged = true;
                } else {
                    this.trigger();
                }
            } else {
                if (this._lazy && this._hasChanged) {
                    this._hasChanged = false;
                    this.trigger();
                }
            }
        }
    };

    var WATCH_INTERVAL = 150;

    /**
     * state monitor
     *
     * @class      ElementStateMonitor
     */
    function ElementStateMonitor() {
        this._stateCheckers = [];
        this._handle = 0;
        this.isWatching = false;
    }

    ElementStateMonitor.prototype.addChecker = function(checker) {
        if (checker instanceof ElementStateChecker) {
            this._stateCheckers.push(checker);
            return this;
        } else {
            throw new TypeError('invalid checker');
        }
    };

    ElementStateMonitor.prototype.beginWatch = function() {
        var checkers = this._stateCheckers;

        function watch(self) {
            checkers.forEach(function (checker) {
                checker.check();
            });

            self._handle = setTimeout(function () { watch(self); }, WATCH_INTERVAL);
        }

        checkers.forEach(function (checker) {
            checker.trigger();
        });

        this.isWatching = true;
        watch(this);
    };

    ElementStateMonitor.prototype.stopWatch = function() {
        if (this._handle) {
            clearTimeout(this._handle);
            this._handle = 0;
        }

        this.isWatching = false;
    };

    return {
        ElementStateMonitor: ElementStateMonitor,
        VisibilityChecker: VisibilityChecker,
        SizeChecker: SizeChecker
    };
}]);
angular.module('LINDGE.UI-Core.Service.Drag', [])

.factory('$luiDragAction', [function () {
    function DragAction() {
        this.ACTION_TYPES = {
            mouse: 'mouse',
            touch: 'touch'
        };

        this._active = false;
        this._type = this.ACTION_TYPES.mouse;

        this.lastX = 0.0;
        this.lastY = 0.0;
        this.currentX = 0.0;
        this.currentY = 0.0;
    }

    DragAction.prototype.isActive = function() {
        return this._active;
    };

    DragAction.prototype.actionType = function() {
        return this._type;
    };

    DragAction.prototype._getCoord = function(evt) {
        if (this._type == this.ACTION_TYPES.mouse) {
            return {
                x: evt.clientX,
                y: evt.clientY
            };
        } else if (this._type == this.ACTION_TYPES.touch) {
            var touchPoint = evt.touches[0];
            return {
                x: touchPoint.clientX,
                y: touchPoint.clientY
            };
        }
    };

    DragAction.prototype.active = function(evt, type) {
        this._type = type;
        this._active = true;

        var coords = this._getCoord(evt);

        this.lastX = coords.x;
        this.lastY = coords.y;
        this.currentX = this.lastX;
        this.currentY = this.lastY;
    };

    DragAction.prototype.deactive = function() {
        this._active = false;
    };

    DragAction.prototype.offset = function(evt) {
        this.lastX = this.currentX;
        this.lastY = this.currentY;

        var coords = this._getCoord(evt);
        this.currentX = coords.x;
        this.currentY = coords.y;

        return [this.currentX - this.lastX, this.currentY - this.lastY];
    };

    return DragAction;
}]);
angular.module('LINDGE.UI-Core.Service.DragDrop', [])

.factory('$luiDragdrop', ['$log', function ($log) {
    function configDropZone(element, config) {
        if (typeof element == 'string') {
            element = document.body.querySelector(element);
        }

        if (!element) {
            return;
        }

        var defaultConfig = {
            preventInnerDragDrop: true,
            canDrop: function (evt) {
                return true;
            },
            onDropBegin: function (evt) {
                return;
            },
            onDropDiscard: function (evt) {
                return;
            },
            onDrop: function (evt) {
                return;
            },
            onDropEnd: function (evt) {
                return;
            }
        };

        angular.extend(defaultConfig, config);

        var dropActive = false;

        // disable drag
        if (defaultConfig.preventInnerDragDrop) {
            element.ondragstart = function (evt) {
                return false;
            };
        }

        element.addEventListener('dragenter', function (evt) {
            if (defaultConfig.canDrop(evt)) {
                dropActive = true;
                defaultConfig.onDropBegin(evt);
            }
        });

        element.addEventListener('dragleave', function (evt) {
            if (dropActive) {
                dropActive = false;
                try {
                    defaultConfig.onDropDiscard(evt);
                } catch (err) {
                    $log.error('error occurred in drop discard callback', err);
                }

                try {
                    defaultConfig.onDropEnd(evt);
                } catch (err) {
                    $log.error('error occurred in drop end callback', err);
                }
            }
        });

        element.ondragover = function (evt) {
            evt.preventDefault();
        };

        element.ondrop = function (evt) {
            evt.preventDefault();
            if (dropActive) {
                dropActive = false;

                try {
                    defaultConfig.onDrop(evt);
                } catch (err) {
                    $log.error('error occurred in drop callback', err);
                }

                try {
                    defaultConfig.onDropEnd(evt);
                } catch (err) {
                    $log.error('error occurred in drop end callback', err);
                }
            }
        };
    }

    /* -------------------- drag event utilities -------------------- */

    function extractDropFiles (dragEvent, filter) {
        if (!!dragEvent) {
            var dataTransfer = dragEvent.dataTransfer;
            if (dataTransfer.files.length > 0) {
                if (typeof filter == 'string') {
                    var type = filter;
                    filter = function (file) {
                        return file.type == type;
                    };
                }

                if (!!filter) {
                    return Array.prototype.filter.call(dataTransfer.files, filter);
                } else {
                    return Array.prototype.slice.call(dataTransfer.files, 0);
                }
            } else {
                return [];
            }
        } else {
            return [];
        }
    }
    
    return {
        configDropZone: configDropZone,
        extractDropFiles: extractDropFiles
    };
}]);
angular.module('LINDGE.UI-Core.Service.GlobalClock', ['ngResource', 'Figure-Config-RouteTable'])

.service('$serverTimeQuery', ['$resource', 'routeTable', 'path', function($resource, routeTable, path) {
    function interceptor(data) {
        if (data === null || data === 'null') {
            return null;
        } else {
            var startSymbolIndex = data.indexOf('{');
            if (startSymbolIndex >= 0) {
                var dateStr;
                if (data.charAt(data.length - 1) == ';') {
                    dateStr = data.substring(startSymbolIndex, data.length - 1);
                } else {
                    dateStr = data.substr(startSymbolIndex);
                }

                try {
                    return JSON.parse(dateStr);
                } catch (e) {
                    return null;
                }
            } else {
                return null;
            }
        }
    }

    var serviceUrl = path.combine(routeTable['figure_config'], 'ServerTime', 'time');

    return $resource(serviceUrl, null, {
        getTime: {
            method: 'GET',
            transformResponse: interceptor,
            isArray: false
        }
    });
}])

.constant('GLOBAL_INIT_TIME_NAME', 'global_init_time')

.service('globalClock', ['$serverTimeQuery', 'GLOBAL_INIT_TIME_NAME', '$rootScope',
function(serverTime, globalName, $rootScope) {
    var thisService = this;

    var running = true;

    var initTime = null;
    this.initiated = false;

    var $time = null;
    var tickFlag = 1;
    var timerTicket = null;

    function getTickHook(interval, callback) {
        var ticks = 0;

        function wrapper() {
            ticks += 1;
            if (ticks === interval) {
                ticks = 0;
                callback.apply(null, arguments);
            }
        }

        return wrapper;
    }

    var hooks = {
        'initiated': [],
        'tick': []
    };

    function invokeHooks(name) {
        if (!running) {
            return;
        }

        if (hooks.hasOwnProperty(name)) {
            hooks[name].forEach(function(callback) {
                callback(new Date($time));
            });
        }
    }

    function getDateObject() {
        var date;
        if (initTime) {
            try {
                date = new Date(initTime.TimeStamp);
                return date;
            } catch (e) {
                date = new Date();
                date.setUTCFullYear(initTime.Year);
                date.setUTCMonth(initTime.Month);
                date.setUTCDate(initTime.Day);
                date.setUTCHours(initTime.Hour, initTime.Minute, initTime.Second, initTime.Millisecond);
                return date;
            }
        } else {
            throw new Error('Global server time is not initiated');
        }
    }

    function startClock() {
        if (initTime) {
            // kill old timer
            if (timerTicket) {
                clearInterval(timerTicket);
                timerTicket = null;
                tickFlag = 0;
            }

            $time = getDateObject();
            timerTicket = setInterval(function() {
                $time.setTime($time.getTime() + 500);
                tickFlag ^= 1;

                if (tickFlag === 0) {
                    invokeHooks('tick');
                }
            }, 500);
        } else {
            throw new Error('Global server time is not initiated');
        }
    }

    // copy object properties and wipe out private ones
    function clearCopy(obj) {
        var result = {};
        Object.keys(obj).forEach(function(key) {
            if ((key.charAt(0) != '$') && (key.substr(0, 2) != '__')) {
                result[key] = obj[key];
            }
        });

        return result;
    }

    function resGetServerTime() {
        serverTime.getTime(null, function(timeInfo) {
            if (timeInfo) {
                initTime = timeInfo;
                window[globalName] = clearCopy(timeInfo);

                if (!thisService.initiated) {
                    thisService.initiated = true;
                    invokeHooks('initiated');
                }

                startClock();
            }
        });
    }

    $rootScope.$on('$destroy', function() {
        if (timerTicket) {
            clearInterval(timerTicket);
        }
    });

    /* public interface here */
    this.getCurrentTime = function() {
        return new Date($time);
    };

    this.onTick = function(callback, interval) {
        if (angular.isFunction(callback)) {
            if (angular.isNumber(interval) && interval > 0) {
                hooks['tick'].push(getTickHook(interval, callback));
            } else {
                hooks['tick'].push(callback);
            }
        }
    };

    this.onInitiated = function(callback) {
        if (angular.isFunction(callback)) {
            hooks['initiated'].push(callback);
        }
    };

    this.syncServerTime = function() {
        resGetServerTime();
    };

    this.start = function() {
        if (this.initiated) {
            running = true;
        } else {
            if (window[globalName]) {
                initTime = angular.copy(window[globalName]);
                this.initiated = true;
                invokeHooks('initiated');
                startClock();
            } else {
                resGetServerTime();
            }
        }
    };

    this.stop = function() {
        running = false;
    };
}])

.run(['globalClock', function(globalClock) {
    globalClock.start();
}]);
angular.module('LINDGE.UI-Core.Service.HttpInterceptor', ['LINDGE.UI-Core.Service.SystemConfig'])
.factory('httpAuthLoginRequiredInterceptor', ['$rootScope', '$q', '$window', '$luiHref', 'systemConfig', function ($rootScope, $q, $window, $luiHref, systemConfig) {
    return {
        'responseError': function (rejection) {
            if (rejection && rejection.config && !rejection.config.ignoreAuthModule) {
                switch (rejection.status) {
                    case 401:
                        var redirectHeader = rejection.headers('RedirectBackAfterAuthorized');
                        var jumpHeader = !!redirectHeader ? redirectHeader.toUpperCase() == 'TRUE' : false;

                        angular.element($window).off('beforeunload');
                        $rootScope.$broadcast('event:auth-loginRequired', rejection);

                        if (jumpHeader) {
                            $luiHref.goto(systemConfig.logonUrl, { 'redirect_back': 'TRUE' });
                        } else {
                            $luiHref.goto(systemConfig.logonUrl);
                        }
                        break;
                }
            }

            return $q.reject(rejection);
        }
    };
}])

.factory('luiHttpDebugIterceptor', ['$window', function ($window) {
    var Blob = window.Blob;

    if (!Blob) {
        return {};
    }

    var history = [];
    var requestMapping = {};

    var seed = 0;

    function getRequestID () {
        var chars = [];
        for (var i = 0; i < 3; i++) {
            chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        }
        
        seed++;
        chars.push(seed);

        return chars.join('');
    }

    function formatRequestInfo (reqConfig, rsp) {
        function convertData (data) {
            if (data === null || data === undefined) {
                return null;
            } else if (data instanceof window.Blob) {
                return null;
            } else if (angular.isObject(data)) {
                return data;
            } else if (angular.isArray(data)) {
                return data;
            } else {
                switch (typeof data) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                        return data;
                    default:
                        return null;
                }
            }
        }

        var statisticInfo = {
            method: reqConfig.method,
            url: reqConfig.url,
            requestHeaders: angular.extend({}, reqConfig.headers),
            responseHeaders: rsp.headers(),
            requestData: convertData(reqConfig.data),
            responseData: convertData(rsp.data),
            startTime: reqConfig.$$debugStartTime.toJSON(),
            endTime: reqConfig.$$debutgEndTime.toJSON(),
            timeSpan: reqConfig.$$debutgEndTime.getTime() - reqConfig.$$debugStartTime.getTime(),
            status: rsp.status
        };

        return statisticInfo;
    }

    function exportHistory () {
        function getFileName () {
            var locationInfo = window.location;

            var fullPath = locationInfo.href;
            fullPath = fullPath.replace(/^https?:\/\//, '');
            fullPath = fullPath.replace(/\//g, '_');
            fullPath = fullPath.replace(':', '_');

            return fullPath + '.txt';
        }

        if (history.length > 0) {
            var content = '[\n' + history.join(',\n') + '\n]';
            var data = new Blob([content], { type: 'text/plain' });
            var fileHandler = window.URL.createObjectURL(data);

            var elm = angular.element('<a>')
                .attr('href', fileHandler)
                .attr('download', getFileName())
                .css('opacity', 0.0);
            document.body.appendChild(elm[0]);
            elm[0].click();

            window.URL.revokeObjectURL(fileHandler);
        }
    }

    if (window.config && window.config.debugMode) {
        window.addEventListener('beforeunload', exportHistory);
    }
    
    return {
        'request': function (config) {
            config.$$debugID = getRequestID();
            config.$$debugStartTime = new Date();
            requestMapping[config.$$debugID] = config;
            return config;
        },

        'response': function (response) {
            if (response.config) {
                var config = response.config;
                var debugID = config.$$debugID;
                if (debugID) {
                    config.$$debutgEndTime = new Date();
                    var reqInfo = formatRequestInfo(response.config, response);
                    history.push(angular.toJson(reqInfo, true));
                    delete requestMapping[debugID];
                }
            }

            return response;
        }
    };
}])

.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('httpAuthLoginRequiredInterceptor');

    if (window.config && window.config.debugMode) {
        $httpProvider.interceptors.push('luiHttpDebugIterceptor');
    }
}]);
angular.module('LINDGE.UI-Core.Initiate', [])

.run([function(){
    window.addEventListener('load', function () {
        var elements = window.document.getElementsByClassName('to-remove');
        for (var i = 0; i < elements.length; i++) {
            angular.element(elements[i]).remove();
        }
    });
}]);
angular.module('LINDGE.UI-Core.Service.NgUtil', [])

.service('$ngUtil', ['$injector', '$SDK', function ($injector, $SDK) {
    function tryLoadService(name, getter) {
        if ($injector.has(name)) {
            if (getter) {
                return getter($injector.get(name));
            } else {
                return $injector.get(name);
            }
        } else {
            return null;
        }
    }

    this.tryLoadService = tryLoadService;
    this.hasModule = $SDK.Angular.hasModule;
}]);
angular.module('LINDGE.UI-Core.Constants.Scenario', [])

.constant('Scenario', {
    'Image': {
        'avatar.raw': {
            id: 'AVATAR_RAW',
            size: [500, 500],
            postfix: '_AVATAR_RAW.png',
            format: 'image/png'
        },
        'avatar.small': {
            id: 'AVATAR_SMALL',
            size: [34, 34],
            postfix: '_AVATAR_SMALL.png',
            format: 'image/png'
        },
        'avatar.thumbnail': {
            id: 'AVATAR_THUMBNAIL',
            size: [67, 67],
            postfix: '_AVATAR_THUMBNAIL.png',
            format: 'image/png'
        },
        'avatar.cover': {
            id: 'AVATAR_COVER',
            size: [110, 110],
            postfix: '_AVATAR_COVER.png',
            format: 'image/png'
        },
        'card.preview': {
            id: 'CARD_PREVIEW',
            size: [160, 160],
            postfix: '_CARD_PREVIEW.png',
            format: 'image/png'
        },
        'card.cover': {
            id: 'CARD_COVER',
            size: [480, 480],
            postfix: '_CARD_COVER.png',
            format: 'image/png'
        }
    }
});
angular.module('LINDGE.UI-Core.Scroll', [])

.provider('$luiAnimationScroll', [function () {
    var interpolations = {
        easeInOutCubic: function (t) {
            return t < 0.5 ? (4 * t * t * t) : ((t - 1) * (2 * t - 2) * (2 * t - 2)) + 1;
        },
        linear: function (t) {
            return t;
        }
    };

    var interpolateFunc = interpolations.easeInOutCubic;
    var defaultDuration = 500;

    this.setInterpolationFunction = function (func) {
        if (typeof func == 'function') {
            interpolateFunc = func;
        } else if (typeof func == 'string') {
            var interp = interpolations[func];
            if (interp) {
                interpolateFunc = interp;
            } else {
                throw new Error('invalid interpolation function: ' + func);
            }
        }
        else {
            throw new TypeError('invalid interpolation function');
        }
    };

    this.setDefaultDuration = function (duration) {
        duration = Number(duration);
        if (!isNaN(duration)) {
            if (duration > 0) {
                defaultDuration = duration;
            } else {
                throw new Error('invalid duration');
            }
        } else {
            throw new TypeError('duration must be number');
        }
    };

    function service() {
        var requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame;

        if (!requestAnimationFrame) {
            requestAnimationFrame = function(fn) {
                window.setTimeout(fn, 15);
            };
        }

        // calculate the scroll position we should be in
        // given the start and end point of the scroll
        // the time elapsed from the beginning of the scroll
        // and the total duration of the scroll (default 500ms)
        function computePosition (start, end, elapsed, duration) {
            if (elapsed > duration) {
                return end;
            } else {
                return start + (end - start) * interpolateFunc(elapsed / duration);
            }
        }

        // we use requestAnimationFrame to be called by the browser before every repaint
        // if the first argument is an element then scroll to the top of this element
        // if the first argument is numeric then scroll to this location
        // if the callback exist, it is called when the scrolling is finished
        function smoothScroll(elem, start, end, duration, callback){
            duration = duration || defaultDuration;

            var continueScroll = true;
            var context = {
                startTime: Date.now(),
                start: start,
                end: end,
                duration: duration,
                callback: callback,
                cancel: function () {
                    continueScroll = false;
                }
            };

            function step () {
                if (!continueScroll) {
                    return;
                }

                var elapsed = Date.now() - context.startTime;
                elem.scrollTo(0, computePosition(start, end, elapsed, duration));
                if (elapsed > duration) {
                    if (typeof callback === 'function') {
                        callback(elem, context);
                    }
                } else {
                    requestAnimationFrame(step);
                }
            }

            step();

            return context;
        }

        var scrollActions = [];

        return {
            verticalScrollTo: function (element, position) {
                function clearHandle(elem) {
                    for (var i = 0; i < scrollActions.length; i++) {
                        if (scrollActions[i][0] === elem) {
                            scrollActions.splice(i, 1);
                            return;
                        }
                    }
                }

                var currentTop;
                if (element === window) {
                    currentTop = element.scrollY;
                } else {
                    currentTop = element.scrollTop;
                }

                for (var i = 0; i < scrollActions.length; i++) {
                    var action = scrollActions[i];
                    if (action[0] === element) {
                        var context = action[1];
                        if (context.end !== position) {
                            context.cancel();
                            action[1] = smoothScroll(element, currentTop, position, null, clearHandle);
                        }

                        return;
                    }
                }

                scrollActions.push([element, smoothScroll(element, currentTop, position, null, clearHandle)]);
            },
            verticalScrollToElement: function (container, element, offset) {
                if (!element) {
                    throw new Error('element is null');
                }

                if (!container) {
                    container = window;
                }

                offset = Number(offset);
                if (isNaN(offset)) {
                    offset = 0;
                }

                var isWindow = container === window;
                var containerBox = (isWindow ? { top: 0 } : container.getBoundingClientRect());
                var targetBox = element.getBoundingClientRect();

                var yOffset = targetBox.top - containerBox.top;
                var containerScrollTop = (isWindow ? container.scrollY : container.scrollTop);

                this.verticalScrollTo(container, containerScrollTop + yOffset - offset);
            }
        };
    }

    this.$get = [service];
}])

.service('$luiScroll', ['$SDK', function ($SDK) {
    function getScrollTop (element) {
        if (element === window) {
            return window.pageYOffset || window.scrollY;
        } else {
            return element.scrollTop;
        }
    }

    function getScrollLeft (element) {
        if (element === window) {
            return window.pageXOffset || window.scrollX;
        } else {
            return element.scrollLeft;
        }
    }

    function getScrollHeight (element) {
        if (element === window) {
            return document.documentElement.scrollHeight;
        } else {
            return element.scrollHeight;
        }
    }

    function getScrollWidth (element) {
        if (element === window) {
            return document.documentElement.scrollWidth;
        } else {
            return element.scrollWidth;
        }
    }


    var SCROLL_DIRECTION = {
        X: 0x01,
        Y: 0x02,
        XY: 0x03
    };

    var contains = $SDK.DOM.contains;
    var pageX = $SDK.DOM.getElementXCoord;
    var pageY = $SDK.DOM.getElementYCoord;

    function scrollToX (element, x) {
        element.scrollLeft = x;
    }

    function scrollToY (element, y) {
        element.scrollTop = y;
    }

    function windowScrollToX (x) {
        window.scroll(x, getScrollTop(window));
    }

    function windowScrollToY (y) {
        window.scroll(getScrollLeft(window), y);
    }

    function scrollInX (parent, element, offset) {
        var parentX = pageX(parent);
        var elmX = pageX(element);

        var scrollOffset = elmX - parentX - offset;
        scrollToX(parent, scrollOffset);
    }

    function scrollInY (parent, element, offset) {
        var parentY = pageY(parent);
        var elmY = pageY(element);

        var scrollOffset = elmY - parentY - offset;
        scrollToY(parent, scrollOffset);
    }

    function windowScrollInX (element, offset) {
        var elmX = pageX(element);
        var scrollOffset = elmX - offset;
        windowScrollToX(scrollOffset);
    }

    function windowScrollInY (element, offset) {
        var elmY = pageY(element);
        var scrollOffset = elmY - offset;
        windowScrollToY(scrollOffset);
    }

    function scrollToElement (parent, element, direction, offset) {
        if (!contains(parent, element)) {
            return;
        }

        if (!direction) {
            direction = SCROLL_DIRECTION.Y;
        }

        offset = $SDK.Math.safeToNumber(offset);

        switch (direction) {
            case SCROLL_DIRECTION.X:
                scrollInX(parent, element, offset);
                break;
            case SCROLL_DIRECTION.Y:
                scrollInY(parent, element, offset);
                break;
        }
    }

    function windowScrollToElement (element, direction, offset) {
        if (!direction) {
            direction = SCROLL_DIRECTION.Y;
        }

        offset = $SDK.Math.safeToNumber(offset);

        switch (direction) {
            case SCROLL_DIRECTION.X:
                windowScrollInX(element, offset);
                break;
            case SCROLL_DIRECTION.Y:
                windowScrollInY(element, offset);
                break;
        }
    }


    this.getScrollTop = getScrollTop;
    this.getScrollLeft = getScrollLeft;
    this.getScrollHeight = getScrollHeight;
    this.getScrollWidth = getScrollWidth;
    this.DIRECTION = SCROLL_DIRECTION;

    this.scrollToElement = scrollToElement;
    this.windowScrollToElement = windowScrollToElement;
}]);
angular.module('LINDGE.UI-Core.Service.SelectionControl', [])

.controller('$luiSingleSelectionDirectiveCtrl', ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
    var ngModelCtrl = null;
    var config = {
        affectModelWhenCandiateChange: false
    };

    var currentItem = null;
    var thisCtrl = this;
    this.items = [];

    function onModelUpdate() {
        var currentValue = ngModelCtrl.$viewValue;
        this.items.forEach(function (itemCtrl) {
            if (itemCtrl.sync(currentValue)) {
                currentItem = itemCtrl;
            }
        });
    }

    $scope.$watch('ngDisabled', function(newValue) {
        if (newValue) {
            $element.attr('disabled', true);
        } else {
            $element.removeAttr('disabled');
        }

        thisCtrl.items.forEach(itemCtrl => {
            itemCtrl.setDisabled(newValue);
        });
    });

    /**
     * ItemCtrl
     * {
     *      getValue(),
     *      sync(value) -> Boolean,
     *      isEqual(value) -> Boolean,
     *      select(),
     *      deselect(),
     *      setDisabled(Boolean),
     *      isDisabled(Boolean)
     * }
     */
    this.registerItem = function (itemCtrl) {
        this.items.push(itemCtrl);

        if (ngModelCtrl && itemCtrl.sync(ngModelCtrl.$viewValue)) {
            currentItem = itemCtrl;
        }

        itemCtrl.setDisabled(!!$scope.ngDisabled);
    };

    this.deregisterItem = function (itemCtrl) {
        var index = this.items.indexOf(itemCtrl);
        if (index >= 0) {
            this.items.splice(index, 1);
            if (!!ngModelCtrl && config.affectModelWhenCandiateChange && itemCtrl === currentItem) {
                ngModelCtrl.$setViewValue(null);
            }
        }
    };

    this.onItemSelectChange = function (itemCtrl, isSelect) {
        if (itemCtrl.isDisabled()) {
            return;
        }

        if (ngModelCtrl) {
            if (isSelect) {
                this.items.forEach(function (ctrl) {
                    if (ctrl === itemCtrl) {
                        ngModelCtrl.$setViewValue(itemCtrl.getValue());
                        itemCtrl.select();
                        currentItem = itemCtrl;
                    } else {
                        ctrl.deselect();
                    }
                });
            } else {
                if (currentItem === itemCtrl) {
                    ngModelCtrl.$setViewValue(null);
                    itemCtrl.deselect();
                    currentItem = null;
                }
            }
        }
    };

    this.bindNgModelCtrl = function (ctrl) {
        ngModelCtrl = ctrl;
        ngModelCtrl.$render = onModelUpdate.bind(this);
    };

    this.isDisabled = function () {
        return !!$scope.ngDisabled;
    };
}])

.controller('$luiMultiSelectionDirectiveCtrl', ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
    var ngModelCtrl = null;
    var config = {
        affectModelWhenCandiateChange: false
    };

    var currentItems = [];
    var thisCtrl = this;
    this.items = [];

    function onModelUpdate() {
        var currentValue = ngModelCtrl.$viewValue;
        this.items.forEach(function (itemCtrl) {
            if (itemCtrl.sync(currentValue)) {
                currentItems.push(itemCtrl);
            }
        });
    }

    function getModelValue() {
        return currentItems.map(function (ctrl) { return ctrl.getValue(); });
    }

    $scope.$watch('ngDisabled', function(newValue) {
        if (newValue) {
            $element.attr('disabled', true);
        } else {
            $element.removeAttr('disabled');
        }

        thisCtrl.items.forEach(itemCtrl => {
            itemCtrl.setDisabled(newValue);
        });
    });

    this.registerItem = function (itemCtrl) {
        this.items.push(itemCtrl);

        if (ngModelCtrl && itemCtrl.sync(ngModelCtrl.$viewValue)) {
            currentItems.push(itemCtrl);
        }

        itemCtrl.setDisabled(!!$scope.ngDisabled);
    };

    this.deregisterItem = function (itemCtrl) {
        var index = this.items.indexOf(itemCtrl);
        if (index >= 0) {
            this.items.splice(index, 1);
        }

        if (!!ngModelCtrl && config.affectModelWhenCandiateChange) {
            var ctrlIndex = currentItems.indexOf(itemCtrl);
            if (ctrlIndex >= 0) {
                currentItems.splice(ctrlIndex, 1);
                ngModelCtrl.$setViewValue(getModelValue());
            }
        }
    };

    this.onItemSelectChange = function (itemCtrl, isSelect) {
        if (itemCtrl.isDisabled()) {
            return;
        }

        if (ngModelCtrl) {
            var index = currentItems.indexOf(itemCtrl);
            if (isSelect) {
                if (index < 0) {
                    itemCtrl.select();
                    currentItems.push(itemCtrl);
                    ngModelCtrl.$setViewValue(getModelValue());
                }
            } else {
                if (index >= 0) {
                    itemCtrl.deselect();
                    currentItems.splice(index, 1);
                    ngModelCtrl.$setViewValue(getModelValue());
                }
            }
        }
    };

    this.bindNgModelCtrl = function (ctrl, selectionConfig) {
        if (selectionConfig) {
            angular.extend(config, selectionConfig);
        }

        ngModelCtrl = ctrl;
        ngModelCtrl.$render = onModelUpdate.bind(this);
    };
}]);
angular.module('LINDGE.UI-Core.Service.SystemConfig', [])

.service('systemConfig', ['$log', '$window', function($log, $window) {
    function writeErrorMessage(name) {
        $log.warn(`没有找到页面配置数据[${name}], 请确认是否已引用SystemConfig.js并且此配置文件内容是否正确！`);
    }

    function extendByAttrs(dest, src, attrs) {
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            dest[attr] = src[attr];
        }
    }

    var cfg = {};
    var services = {};
    var components = {};

    var winCfg, topBarCfg;

    if (!$window.config) {
        writeErrorMessage('');
    } else {
        winCfg = $window.config;
        components = winCfg.components;
        topBarCfg = components.topbar;

        extendByAttrs(cfg, winCfg, ['name', 'logo', 'slogan', 'rootUrl', 'frameworkRoot']);

        cfg['extensions'] = components['extensions'] || {};
        extendByAttrs(cfg, topBarCfg, [
            'personUrl',
            'groupUrl',
            'behaviorUrl',
            'projectUrl',
            'imageUrl',
            'messageUrl',
            'logonUrl',
            'loginUrl',
            'identityUrl',
            'logoutUrl',
            'modifyPasswordUrl',
            'gatewayUrl'
        ]);
    }

    return cfg;
}]);
angular.module('LINDGE.UI-Core.Timer', [])

.factory('$luiTimer', ['$log', '$SDK', function ($log, $SDK) {
    var MIN_INTERVAL = 200;

    function Timer(defaultInterval) {
        this._ticket = 0;
        this._interval = Math.max(MIN_INTERVAL, $SDK.Math.safeToNumber(defaultInterval));

        this.isRunning = false;
    }

    Timer.prototype.start = function (handles) {
        if (!handles) {
            throw new Error('handles is null');
        }

        if (typeof handles == 'function') {
            handles = {
                tick: handles,
                interval: function () { return self._interval; }
            };
        }

        var self = this;

        function tick() {
            try {
                var canContinue = handles.tick();
                if (canContinue) {
                    var nextInterval = handles.interval();
                    if (nextInterval > 0) {
                        nextInterval = Math.max(MIN_INTERVAL, nextInterval);
                    } else {
                        nextInterval = self._interval;
                    }

                    self._ticket = setTimeout(tick, nextInterval);
                } else {
                    self._ticket = 0;
                    self.isRunning = false;
                }
            } catch (err) {
                self._ticket = 0;
                self.isRunning = false;
                $log.error('error in timer', err);
            }
        }

        this.isRunning = true;

        tick();
    };

    Timer.prototype.stop = function () {
        if (this._ticket > 0) {
            clearTimeout(this._ticket);
            this._ticket = 0;
        }

        this.isRunning = false;
    };

    return Timer;
}]);
angular.module('LINDGE.UI-Core.Service.UserInfo', [])

.constant('USER_INFO_CONSTANTS', {
    info: 'LINDGE.userInfo',
    units: 'LINDGE.units',
    updateEvt: '$lui-userinfo-update'
})

.service('userInfo', ['localStorageService', 'USER_INFO_CONSTANTS', '$rootScope', function(localStorageService, USER_CONSTS, $rootScope) {
    var KEY = USER_CONSTS.info;
    var UNIT_KEY = USER_CONSTS.units;

    var service = {};
    var userCache = null;

    function saveInfo(info) {
        localStorageService.set(KEY, info);
        loadUserInfo(service);
    }

    function loadUserInfo(service) {
        var userInfo = localStorageService.get(KEY);

        if (userInfo === undefined || userInfo === null) {
            userInfo = {};
        }

        service['id'] = userInfo['ID'];
        service['token'] = userInfo['Token'];
        service['username'] = userInfo['LogonName'];
        service['displayname'] = userInfo['DisplayName'];
        service['name'] = userInfo['DisplayName'];
        service['photo'] = userInfo['Photo'];
        service['apps'] = userInfo['Apps'];
        service['localunit'] = userInfo['LocalUnit'];

        service['save'] = saveInfo;
        service['clear'] = clear;

        userCache = userInfo;
    }

    function loadUnitsInfo(service) {
        var units = localStorageService.get(UNIT_KEY);
        service['units'] = units;
    }

    function clear() {
        localStorageService.remove(KEY);
        localStorageService.remove(UNIT_KEY);
        loadUserInfo(service);
        loadUnitsInfo(service);
    }

    loadUserInfo(service);
    loadUnitsInfo(service);

    service.saveUserInfo = saveInfo;
    service.clear = clear;

    function ensureCache () {
        if (userCache) {
            return userCache;
        } else {
            userCache = localStorageService.get(KEY);
            return userCache;
        }
    }

    service.reload = function() {
        loadUserInfo(service);
        loadUnitsInfo(service);
    };

    service.setLocalUnit = function(unitInfo) {
        var userInfo = ensureCache();
        userInfo.LocalUnit = unitInfo;
        localStorageService.set(KEY, userInfo);

        service['localunit'] = unitInfo;
    };

    service.saveUnits = function(units) {
        localStorageService.set(UNIT_KEY, units || []);
        service['units'] = units;
    };

    service.updatePhoto = function (photoID) {
        var userInfo = ensureCache();
        userInfo.Photo = photoID;
        service['photo'] = photoID;
        localStorageService.set(KEY, userInfo);
        $rootScope.$broadcast(USER_CONSTS.updateEvt);
    };

    service.updateDisplayName = function (displayName) {
        var userInfo = ensureCache();
        userInfo.DisplayName = displayName;
        service['displayname'] = displayName;
        localStorageService.set(KEY, userInfo);
        $rootScope.$broadcast(USER_CONSTS.updateEvt);
    };

    return service;
}]);
angular.module('LINDGE-UI-Core').run(['$templateCache', function ($templateCache) {
$templateCache.put("lui-tpl/NgTable/filters.select-multiple.tmpl.html", "<select ng-options=\"data.id as data.title for data in column.data\" ng-disabled=\"$filterRow.disabled\" multiple=\"multiple\" ng-multiple=\"true\" ng-model=\"params.filter()[name]\" ng-show=\"filter=='select-multiple'\" class=\"filter filter-select-multiple form-control\" name=\"{{column.filterName}}\"></select>");

$templateCache.put("lui-tpl/NgTable/filters.select.tmpl.html", "<select ng-options=\"data.id as data.title for data in column.data\" ng-disabled=\"$filterRow.disabled\" ng-model=\"params.filter()[name]\" ng-show=\"filter=='select'\" class=\"filter filter-select form-control\" name=\"{{column.filterName}}\"></select>");

$templateCache.put("lui-tpl/NgTable/filters.text.tmpl.html", "<input type=\"text\" name=\"{{column.filterName}}\" ng-disabled=\"$filterRow.disabled\" ng-model=\"params.filter()[name]\" ng-if=\"filter=='text'\" class=\"input-filter form-control\">");

$templateCache.put("lui-tpl/NgTable/header.tmpl.html", "<tr><th ng-repeat=\"column in $columns\" ng-class=\"{ 'sortable': parse(column.sortable), 'sort-asc': params.sorting()[parse(column.sortable)]=='asc', 'sort-desc': params.sorting()[parse(column.sortable)]=='desc' }\" ng-click=\"sortBy(column, $event)\" ng-show=\"column.show(this)\" ng-init=\"template=column.headerTemplateURL(this)\" class=\"header {{column.class}}\"><div ng-if=\"!template\" ng-show=\"!template\" ng-bind=\"parse(column.title)\"></div><div ng-if=\"template\" ng-show=\"template\" ng-include=\"template\"></div></th></tr><tr ng-show=\"show_filter\" class=\"ng-table-filters\"><th ng-repeat=\"column in $columns\" ng-show=\"column.show(this)\" class=\"filter\"><div ng-repeat=\"(name, filter) in column.filter\"><div ng-if=\"column.filterTemplateURL\" ng-show=\"column.filterTemplateURL\"><div ng-include=\"column.filterTemplateURL\"></div></div><div ng-if=\"!column.filterTemplateURL\" ng-show=\"!column.filterTemplateURL\"><div ng-include=\"'lui-tpl/NgTable/filters.' + filter + '.tmpl.html'\"></div></div></div></th></tr>");

$templateCache.put("lui-tpl/NgTable/pager.tmpl.html", "<div class=\"ng-cloak ng-table-pager\" layout=\"row\" ng-show=\"pages.length\"><div ng-if=\"params.settings().counts.length\" class=\"ng-table-counts btn-group pull-right\"><button ng-repeat=\"count in params.settings().counts\" type=\"button\" ng-class=\"{'active':params.count()==count}\" ng-click=\"params.count(count)\" class=\"btn btn-default\"><span ng-bind=\"count\"></span></button></div><ul class=\"pagination ng-table-pagination\" layout=\"row\"><li ng-class=\"{'disabled': !page.active && !page.current}\" ng-repeat=\"page in pages\" ng-switch=\"page.type\" flex=\"none\"><a class=\"lui-button\" ng-switch-when=\"prev\" ng-click=\"params.page(page.number)\" href=\"\">&laquo;</a> <a class=\"lui-button\" ng-switch-when=\"first\" ng-click=\"params.page(page.number)\" href=\"\" ng-class=\"{'selected': page.current}\"><span ng-bind=\"page.number\"></span> </a><a class=\"lui-button\" ng-switch-when=\"page\" ng-click=\"params.page(page.number)\" href=\"\" ng-class=\"{'selected': page.current}\"><span ng-bind=\"page.number\"></span> </a><a class=\"lui-button\" ng-switch-when=\"more\" ng-click=\"params.page(page.number)\" href=\"\">&#8230;</a> <a class=\"lui-button\" ng-switch-when=\"last\" ng-click=\"params.page(page.number)\" href=\"\" ng-class=\"{'selected': page.current}\"><span ng-bind=\"page.number\"></span> </a><a class=\"lui-button\" ng-switch-when=\"next\" ng-click=\"params.page(page.number)\" href=\"\">&raquo;</a></li></ul></div>");

$templateCache.put("lui-tpl/Slider/slider.tmpl.html", "<div class=\"value-slider\"><div class=\"slider-groove\"><div class=\"slider-reference\"></div><div class=\"slider-bar\"></div><div class=\"slider-cheat-min\"></div><div class=\"slider-cheat-max\"></div></div><div ng-transclude></div></div>");

$templateCache.put("lui-tpl/ScrollView/scrollbar.tmpl.html", "<div class=\"scrollbar-container\"><div class=\"scrollbar-track\" ng-show=\"useTrack&&active\"></div><div class=\"scrollbar\" ng-show=\"active\"></div></div>");

$templateCache.put("lui-tpl/ScrollView/scrollview.tmpl.html", "<div class=\"lui-scroll-view\"><div class=\"scroll-wrapper\"><div class=\"scroll-content\" ng-transclude></div></div><lui-scroll-handle class=\"scrollbar-vertical\" ng-show=\"showVerticalScrollbar\" mode=\"vertical\"></lui-scroll-handle></div>");

$templateCache.put("lui-tpl/TreeView/tree-item-default.tmpl.html", "<div lui-tree-item><span ng-bind=\"params.getNodeName($node)\"></span></div>");

$templateCache.put("lui-tpl/TreeView/tree-item.tmpl.html", "<ul class=\"{opened:$node.$isOpen}\" ng-show=\"$node.$isOpen\"><li class=\"lui-tree-item\" ng-repeat=\"$node in params.getNodeChildren($node)\" ng-include=\"itemTpl\" node-id=\"{{params.getNodeId($node)}}\"></li></ul>");

$templateCache.put("lui-tpl/TreeView/tree-view.tmpl.html", "<div class=\"lui-tree-view\"><ul><li class=\"lui-tree-item root\" ng-repeat=\"$node in params.data\" ng-include=\"itemTpl\" node-id=\"{{params.getNodeId($node)}}\"></li></ul></div>");
}]);
}());