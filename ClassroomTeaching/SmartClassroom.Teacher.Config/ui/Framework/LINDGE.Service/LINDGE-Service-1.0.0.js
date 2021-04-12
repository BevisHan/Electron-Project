(function () {
'use strict';
const LOADED_MODULES = {};

const MODULES = [];

const MODULE_CALL_STACK = [];


function _createModuelInfo(name, callback) {
    return {
        name: name,
        callback: callback,
        cached: false,
        cache: null
    };
}

function Module_Define(name, callback) {
    if (typeof name != 'string') {
        throw new TypeError('name must be string');
    }

    if (name.length === 0) {
        throw new Error('name is empty');
    }

    if (LOADED_MODULES.hasOwnProperty(name)) {
        throw new Error(`module [${name}] is registered`);
    }

    if (typeof callback != 'function') {
        throw new TypeError('callback must be function');
    }

    var moduleInfo = _createModuelInfo(name, callback);
    MODULES.push(moduleInfo);
    LOADED_MODULES[name] = moduleInfo;
}

function Module_Init(module) {
    if (!module.cached) {
        MODULE_CALL_STACK.push(module.name);

        var moduleData;
        try {
            moduleData = module.callback.call(null);     // prevent `this` polution
        } finally {
            MODULE_CALL_STACK.pop();
        }

        if (moduleData === null || moduleData === undefined) {
            module.cache = null;
        } else {
            module.cache = moduleData;
        }

        module.cached = true;
    }
}

function Module_Require(moduleName) {
    var collisionIdx = MODULE_CALL_STACK.indexOf(moduleName);
    if (collisionIdx >= 0) {
        var cycle = MODULE_CALL_STACK.slice(collisionIdx);
        cycle.push(moduleName);
        var cycleNotation = cycle.join(' -> ');

        throw new Error(`cycle depencency detected: ${cycleNotation}`);
    }

    var moduleInfo = LOADED_MODULES[moduleName];
    if (moduleInfo) {
        if (moduleInfo.cached) {
            return moduleInfo.cache;
        } else {
            Module_Init(moduleInfo);
            return moduleInfo.cache;
        }
    } else {
        throw new Error(`fail to find module [${moduleName}]`);
    }
}

function Module_Reset(moduleName) {
    var moduleInfo = LOADED_MODULES[moduleName];
    if (moduleInfo) {
        moduleInfo.cache = null;
        moduleInfo.cached = false;
    } else {
        throw new Error(`fail to find module [${moduleName}]`);
    }
}

function Module_List() {
    return MODULES.map(m => m.name);
}

function Module_Batch_Init() {
    MODULE_CALL_STACK.length = 0;

    for (let module of MODULES) {
        Module_Init(module);
    }
}

Module_Define('SDK.Angular', function () {

function hasModule(name) {
    try {
        window.angular.module(name);
        return true;
    } catch (err) {
        return false;
    }
}

return {
    hasModule: hasModule
};

});
Module_Define('SDK.DOM', function () {

/**
 * get document X coordinate of element
 * @param  {Element} elm
 * @param  {Element} refElement
 * @return {Number}
 */
function getElementXCoord (elm, refElement) {
    switch (elm.offsetParent) {
        case window.document.body:
        case refElement:
        case null:
        case undefined:
            return elm.offsetLeft;
        default:
            return elm.offsetLeft + getElementXCoord(elm.offsetParent, refElement);
    }
}

/**
 * get document Y coordinate of element
 * @param  {Element} elm
 * @param  {Element} refElement
 * @return {Number}
 */
function getElementYCoord (elm, refElement) {
    switch (elm.offsetParent) {
        case window.document.body:
        case refElement:
        case null:
        case undefined:
            return elm.offsetTop;
        default:
            return elm.offsetTop + getElementYCoord(elm.offsetParent, refElement);
    }
}

/**
 * get document X, Y coordinate of element
 * @param  {Element} elm
 * @param  {Element} refElement
 * @return {[Number, Number]}
 */
function getElementXYCoord (elm, refElement) {
    switch (elm.offsetParent) {
        case window.document.body:
        case refElement:
        case null:
        case undefined:
            return [elm.offsetLeft, elm.offsetTop];
        default:
            var outerCoords = getElementXYCoord(elm.offsetParent, refElement);
            return [elm.offsetLeft + outerCoords[0], elm.offsetTop + outerCoords[1]];
    }
}

/**
 * get scroll parent of the given element
 *
 * @param  {Element}  elm
 * @return {Element?}
 */
function getScrollParent(elm) {
    if (elm === null) {
        return null;
    } else if (elm.scrollHeight > elm.clientHeight) {
        return elm;
    } else {
        return getScrollParent(elm.parentNode);
    }
}

/* dom node contains */

function domAPIContains (parent, element) {
    return parent.contains(element);
}

function recurseContains (parent, element) {
    var node = element.parentElement;
    while (true) {
        if (node) {
            if (node === document.body) {
                return parent === document.body;
            } else {
                if (node === parent) {
                    return true;
                } else {
                    node = node.parentElement;
                }
            }
        } else {
            return false;
        }
    }
}

var containsNode;
if (angular.isFunction(document.body.contains)) {
    containsNode = domAPIContains;
} else {
    containsNode = recurseContains;
}

/**
 * @param  {Element} parent
 * @param  {Element} element
 * @return {Boolean}
 */
function contains (parent, element) {
    if (parent === window) {
        return true;
    }

    return containsNode(parent, element);
}

/**
 * test whether the given node is a text node
 * 
 * @param  {Element}  node
 * @return {Boolean}
 */
function isTextNode (node) {
    return node.nodeType === 3;
}

/**
 * test whether the given node is an element node
 * 
 * @param  {Element}  node
 * @return {Boolean}
 */

function isElementNode (node) {
    return node.nodeType === 1;
}

/**
 * Walk through each dom node in a list by depth first order
 * 
 * @param  {Array<DocumentElement>}   domNodes  array of DOM nodes
 * @param  {Function} callback  (currentNode) -> continue
 */
function walkDOM (domNodes, callback, maxDepth) {
    if (typeof callback != 'function') {
        throw new TypeError('Callback must be function');
    }

    if (!maxDepth || maxDepth < 0) {
        maxDepth = Infinity;
    } else {
        if (isNaN(maxDepth)) {
            throw new TypeError('invalid maxDepth');
        }
    }

    for (var i = 0; i < domNodes.length; i++) {
        var fragment = domNodes[i];
        var queue = [{
            node: fragment,
            depth: 0
        }];

        var continue_ = true;
        while (queue.length > 0 && continue_) {
            var domNode = queue.shift();
            continue_ = callback(domNode.node);
            if (continue_ && domNode.depth < maxDepth) {
                var children = [];
                var childNodes = domNode.node.childNodes;
                for (var j = 0; j < childNodes.length; j++) {
                    children.push({
                        node: childNodes[j],
                        depth: domNode.depth + 1
                    });
                }

                queue.unshift.apply(queue, children);
            }
        }
    }
}

/**
 * browser compatible way of get computed styles
 * @param  {Element} elem
 * @param  {String} cssprop
 *
 * @return {String}
 */
function getComputedStyle (elem, cssprop) {
    if (elem.currentStyle) {
        // IE
        return elem.currentStyle[cssprop];
    } else if (window.getComputedStyle) {
        return window.getComputedStyle(elem)[cssprop];
    } else {
        return elem.style[cssprop];
    }
}

/**
 * get relative offset of element
 *
 * @param  {Element} elem
 * @return {{ width, height, top, left }}
 */
function getElementOffset (elem) {
    var boundingClientRect = elem.getBoundingClientRect();
    return {
        width: boundingClientRect.width || elem.offsetWidth,
        height: boundingClientRect.height || elem.offsetHeight,
        top: boundingClientRect.top + (window.pageYOffset || document.documentElement.scrollTop),
        left: boundingClientRect.left + (window.pageXOffset || document.documentElement.scrollLeft)
    };
}

/**
 * get position of element
 *
 * @param  {Element} elem
 * @return {{ width, height, top, left }}
 */
function getElementPosition (elem) {
    function isStaticPositioned(element) {
        return (getComputedStyle(element, 'position') || 'static') === 'static';
    }

    function parentOffsetEl (element) {
        var offsetParent = element.offsetParent || document;
        while (offsetParent && offsetParent !== document && isStaticPositioned(offsetParent)) {
            offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || document;
    }

    var elBCR = getElementOffset(elem);
    var offsetParentBCR = {
        top: 0,
        left: 0
    };

    var offsetParentEl = parentOffsetEl(elem);
    if (offsetParentEl !== document) {
        offsetParentBCR = getElementOffset(offsetParentEl);
        offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
        offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
    }

    var boundingClientRect = elem.getBoundingClientRect();
    return {
        width: boundingClientRect.width || elem.offsetWidth,
        height: boundingClientRect.height || elem.offsetHeight,
        top: elBCR.top - offsetParentBCR.top,
        left: elBCR.left - offsetParentBCR.left
    };
}

/**
 * Provides coordinates for the targetEl in relation to hostEl
 *
 * @param  {Element} hostEl
 * @param  {Element} targetEl
 * @param  {String} positionStr  'center,right,left,bottom'
 * @param  {Boolean} appendToBody
 * @return {{ top, left }}
 */
function getElementRelativePosition(hostEl, targetEl, positionStr, appendToBody) {
    var positionStrParts = positionStr.split('-');
    var pos0 = positionStrParts[0],
        pos1 = positionStrParts[1] || 'center';

    var hostElPos,
        targetElWidth,
        targetElHeight,
        targetElPos;

    hostElPos = appendToBody ? getElementOffset(hostEl) : getElementPosition(hostEl);

    targetElWidth = targetEl.offsetWidth;
    targetElHeight = targetEl.offsetHeight;

    var shiftWidth = {
        center: function() {
            return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
        },
        left: function() {
            return hostElPos.left;
        },
        right: function() {
            return hostElPos.left + hostElPos.width;
        }
    };

    var shiftHeight = {
        center: function() {
            return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
        },
        top: function() {
            return hostElPos.top;
        },
        bottom: function() {
            return hostElPos.top + hostElPos.height;
        }
    };

    switch (pos0) {
        case 'right':
            targetElPos = {
                top: shiftHeight[pos1](),
                left: shiftWidth[pos0]()
            };
            break;
        case 'left':
            targetElPos = {
                top: shiftHeight[pos1](),
                left: hostElPos.left - targetElWidth
            };
            break;
        case 'bottom':
            targetElPos = {
                top: shiftHeight[pos0](),
                left: shiftWidth[pos1]()
            };
            break;
        default:
            targetElPos = {
                top: hostElPos.top - targetElHeight,
                left: shiftWidth[pos1]()
            };
            break;
    }

    return targetElPos;
}

return {
    getElementXCoord: getElementXCoord,
    getElementYCoord: getElementYCoord,
    getElementXYCoord: getElementXYCoord,
    contains: contains,
    getScrollParent: getScrollParent,
    isTextNode: isTextNode,
    isElementNode: isElementNode,
    walkDOM: walkDOM,
    getComputedStyle: getComputedStyle,
    getElementOffset: getElementOffset,
    getElementPosition: getElementPosition,
    getElementRelativePosition: getElementRelativePosition
};

});
Module_Define('SDK.ExecutionQueue', function () {

function createTask (callback, params) {
    return {
        callback: callback,
        params: params,
        flag: false,
        rInfo: null,
        result: null,
        block: 0
    };
}

/**
 * convert function to async function
 *
 * @param {Function} callback
 * @param {Number=} customDelay
 * @param {Object=} bindObject
 * 
 * @return {Function}
 */
function makeAsync (callback, customDelay, bindObject) {
    var delay = Number(customDelay); 
    if (isNaN(delay) || customDelay <= 0) {
        delay = 5;
    }

    return function () {
        var args = [!!bindObject ? callback.bind(bindObject) : callback, delay];
        args.push.apply(args, arguments);
        return setTimeout.apply(null, args);
    };
}

/**
 * Task block
 */
function TaskBlock() {
    this._tasks = [];
    this.finishHandles = [];
    this.finished = 0;
}

TaskBlock.prototype = {
    add: function (task) {
        this._tasks.push(task);
    },

    get: function (index) {
        return this._tasks[index];
    },

    length: function () {
        return this._tasks.length;
    },

    isFinished: function () {
        return this._tasks.length == this.finished;
    }
};

/**
 * Execution queue
 *
 * @param {Number} size        max concurrent size
 * @param {Boolean} autoStart  automatically start queue when has task
 */
function ExecutionQueue (size, autoStart) {
    size = Number(size);
    if (isNaN(size) || size < 1) {
        throw new Error('Invalid size');
    }

    this._size = size;
    if (arguments.length > 1) {
        this._autoStart = !!autoStart;
    } else {
        this._autoStart = false;
    }

    this._waiting = 0;
    this._actived = 0;
    this._aborted = false;
    this._hangOnEmpty = false;

    this._taskBlocks = [new TaskBlock()];
    this._tasks = this._taskBlocks[0];
    this._taskPtr = -1;

    this.error = null;
    this.data = null;
    this._finalHandlers = [];
}

ExecutionQueue.prototype = {
    _isStateNormal: function () {
        return !this._aborted;
    },

    _getDefer: function (task) {
        task.flag = true;
        return makeAsync(function (err) {
            this._actived--;
            this._tasks.finished++;

            if (err) {
                this.abort(err);
            } else {
                var result = Array.prototype.slice.call(arguments, 1);
                task.result = result;
                this.data = result;

                if (this._isStateNormal()) {
                    if (this._tasks.isFinished()) {
                        for (var i = 0; i < this._tasks.finishHandles.length; i++) {
                            try {
                                this._tasks.finishHandles[i].call(null);
                            } catch (e) { }
                        }

                        if (this._waiting > 0) {
                            this._tasks = this._taskBlocks[task.block + 1];
                            this._taskPtr = -1;
                            this.start();
                        } else if (this._actived === 0) {
                            if (!this._hangOnEmpty) {
                                this._finish();
                            }
                        }
                    } else {
                        this.start();
                    }
                }
            }
        }, 0, this);
    },

    hangWhenEmpty: function () {
        this._hangOnEmpty = true;
        return this;
    },

    addTask: function (callback) {
        if (typeof callback != 'function') {
            throw new TypeError('Callback must be function');
        }

        var params = Array.prototype.slice.call(arguments, 1);
        var task = createTask(callback, params, blockIndex);

        var blockIndex = this._taskBlocks.length - 1;
        task.block = blockIndex;
        params.push(this._getDefer(task));
        this._taskBlocks[blockIndex].add(task);

        this._waiting++;

        if (this._autoStart) {
            this.start();
        }

        return this;
    },

    await: function (callback) {
        if (this._tasks.length() > 0) {
            var block = new TaskBlock();
            if (typeof callback == 'function') {
                block.finishHandles.push(callback);
            }

            this._taskBlocks.push(block);
        }

        return this;
    },

    _callFinally: function () {
        var cbs = this._finalHandlers;
        for (var i = 0; i < cbs.length; i++) {
            cbs[i]();
        }
    },

    finally: function (callback) {
        if (typeof callback != 'function') {
            throw new TypeError('Callback must be function');
        }

        this._finalHandlers.push(callback);
        return this;
    },
    
    start: function () {
        if (this._isStateNormal()) {
            try {
                while (this._waiting > 0 &&
                       this._actived < this._size &&
                       this._taskPtr < (this._tasks.length() - 1)) {
                    this._taskPtr++;

                    var task = this._tasks.get(this._taskPtr);
                    this._waiting--;
                    this._actived++;

                    var rInfo = task.callback.apply(null, task.params);
                    if (!task.flag && angular.isObject(rInfo)) {
                        task.rInfo = rInfo;
                    }
                }
            } catch (err) {
                this.abort(err);
            }
        }
    },

    _finish: function () {
        this._callFinally();
    },

    abort: function (reason) {
        if (this._isStateNormal()) {
            this._aborted = true;

            this.error = reason;
            this._waiting = -1;
            this._actived = -1;
            this.data = null;

            var tasks = this._tasks;
            var i = this._taskPtr;
            while (i >= 0) {
                var task = tasks.get(i);
                if (!task.flag) {
                    var rInfo = task.rInfo;
                    if (rInfo && (typeof rInfo.abort == 'function')) {
                        // call custom aborting handler
                        try {
                            rInfo.abort();
                        } catch (e) { /*ignore*/ }
                    }
                }

                i--;
            }

            this._taskPtr = -1;
            this._callFinally();
        }
    },

    isAborted: function () {
        return this._aborted;
    }
};

return {
    ExecutionQueue: ExecutionQueue
};

});
Module_Define('SDK.Lang.Flags', function () {

/**
 * flag container
 */
function Flags() {
    this.__names = [];
    this.__default = 0;
}

/**
 * add a new flag
 *
 * @param {String} name  name fo the flag
 * @param {Number} value value of the flag
 */
Flags.prototype.define = function(name, value) {
    if (Object.isFrozen && Object.isFrozen(this)) {
        return;
    }

    if (typeof name != 'string') {
        throw new TypeError('name must be string');
    }

    if (name === '') {
        throw new Error('name is empty');
    }

    if (this.hasOwnProperty(name) || name.startsWith('__')) {
        throw new Error('invalid names');
    }

    if (typeof value != 'number') {
        throw new TypeError('value must be number');
    }

    this._checkFlagValue(value);

    this[name] = value;
    this.__names.push(name);
};

Flags.prototype._findValueByName = function(name) {
    if (this.__names.indexOf(name) >= 0) {
        return this[name];
    } else {
        throw new Error('flag not found: ' + name);
    }
};

Flags.prototype._checkFlagValue = function(value) {
    if (value < 0) {
        throw new Error('flag value must be unsigned number');
    }
};


/**
 * get all flag names
 * @return {String[]}
 */
Flags.prototype.getFlagNames = function() {
    return this.__names.slice(0);
};

/**
 * get value of the flag by its name
 *
 * @param  {string} name  name of the flag
 * @return {Number}
 */
Flags.prototype.getFlagValue = function(name) {
    return this._findValueByName(name);
};

/**
 * get name of the flag that match the value
 *
 * @param  {Number} value
 * @return {String}
 */
Flags.prototype.getFlagNameByValue = function(value) {
    for (var i = 0; i < this.__names.length; i++) {
        var name = this.__names[i];
        if (this[name] == value) {
            return this[name];
        }
    }

    return '';
};

/**
 * check whether the value contains specified flag
 *
 * @param  {Number}  value  flag(s) value
 * @param  {String|Number}  nameOrValue  flag name or value
 * @return {Boolean}
 */
Flags.prototype.hasFlag = function(value, nameOrValue) {
    if (typeof nameOrValue == 'string') {
        var flagValue =  this._findValueByName();
        return (flagValue & value) > 0;
    } else if (typeof nameOrValue == 'number') {
        if (nameOrValue > 0) {
            return (value & nameOrValue) > 0;
        } else {
            return false;
        }
    } else {
        throw new TypeError('invalid nameOrValue');
    }
};

/**
 * check whether the value contains all specified flags 
 *
 * @param  {Number}  value  flag(s) value
 * @return {Boolean}
 */
Flags.prototype.hasFlags = function(value) {
    if (arguments.length <= 1) {
        return false;
    } else {
        for (var i = 1; i < arguments.length; i++) {
            if (!this.hasFlag(value, arguments[i])) {
                return false;
            }
        }

        return true;
    }
};

/**
 * check whether the value contains any of specified flags 
 *
 * @param  {Number}  value  flag(s) value
 * @return {Boolean}
 */
Flags.prototype.hasAnyFlag = function(value) {
    if (arguments.length <= 1) {
        return false;
    } else {
        for (var i = 1; i < arguments.length; i++) {
            if (this.hasFlag(value, arguments[i])) {
                return true;
            }
        }

        return false;
    }
};

/**
 * add specifiied flag to given value
 *
 * @param {Number} value  flag(s) value
 * @param {String|Number} nameOrValue  flag name or value
 * @return {Number}
 */
Flags.prototype.setFlag = function(value, nameOrValue) {
    var flagValue;

    if (typeof nemeOrValue == 'string') {
        flagValue = this._findValueByName(nameOrValue);
    } else if (typeof nameOrValue == 'number') {
        this._checkFlagValue(nameOrValue);
        flagValue = nameOrValue;
    } else {
        throw new TypeError('invalid nameOrValue');
    }

    return value | flagValue;
};

/**
 * remove specifiied flag from given value
 *
 * @param {Number} value  flag(s) value
 * @param {String|Number} nameOrValue  flag name or value
 * @return {Number}
 */
Flags.prototype.unsetFlag = function(value, nameOrValue) {
    var flagValue;

    if (typeof nemeOrValue == 'string') {
        flagValue = this._findValueByName(nameOrValue);
    } else if (typeof nameOrValue == 'number') {
        this._checkFlagValue(nameOrValue);
        flagValue = nameOrValue;
    } else {
        throw new TypeError('invalid nameOrValue');
    }

    return value ^ flagValue;
};

/**
 * get default value of this flag
 * @return {Number}
 */
Flags.prototype.default = function() {
    return this.__default;
};

/**
 * factory for flags
 */
function FlagBuilder() {
    return;
}

/**
 * create flag from array of names
 *
 * @param  {String[]} names  name list
 * @return {Flags}
 */
FlagBuilder.prototype.create = function(names) {
    var flag = new Flags();

    var val = 1;
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        flag.define(name, val);
        val *= 2;
    }

    if (Object.freeze) {
        Object.freeze(flag);
    }

    return flag;
};


return {
    __access__: 'private',
    flagBuilder: (new FlagBuilder())
};

});
Module_Define('SDK.Lang', function () {

/**
 * constructor inherts
 *
 * @param  {Function} derived
 * @param  {Function} base
 * @return {Function} the derived class
 */
function inherits (derived, base) {
    var baseProto = base.prototype || Object.prototype;
    var bridge = Object.create(baseProto);

    derived.prototype = bridge;
    return derived;
}

/**
 * test whether the given data is a primitive data
 * 
 * @param  {Any}  data
 * @return {Boolean}
 */
function isPrimitiveData (data) {
    if (data === undefined || data === null) {
        return true;
    } else {
        switch (typeof data) {
            case 'string':
            case 'number':
            case 'boolean':
                return true;
            default:
                return false;
        }
    }
}

/**
 * test whether the given number is constant NaN
 * 
 * @param  {Number}  val
 * @return {Boolean}
 */
function isTrueNaN (val) {
    return typeof val == 'number' && isNaN(val);
}

/**
 * test whether the given value is a Date
 * @param  {Any}  val
 * @return {Boolean}
 */
function isDate (val) {
    return val instanceof Date;
}

/**
 * object recursivly comparing
 * @param  {Any} obj1
 * @param  {Any} obj2
 * @return {Boolean}
 */
function deepCompare (obj1, obj2) {
    function arrayAdapt (arr1, arr2) {
        if (!Array.isArray(arr2)) {
            return false;
        } else {
            if (arr1.length === arr2.length) {
                for (var i = 0; i < arr1.length; i++) {
                    if (!deepCompare(arr1[i], arr2[i])) {
                        return false;
                    }
                }

                return true;
            } else {
                return false;
            }
        }
    }

    function objectAdapt (obj1, obj2) {
        if (Array.isArray(obj2)) {
            return false;
        } else {
            var keys1 = Object.keys(obj1);
            var keys2 = Object.keys(obj2);
            if (keys1.length === keys2.length) {
                for (var i = 0; i < keys1.length; i++) {
                    var key = [keys1[i]];
                    if (!deepCompare(obj1[key], obj2[key])) {
                        return false;
                    }
                }

                return true;
            } else {
                return false;
            }
        }
    }

    if (obj1 === obj2) {
        return true;
    } else if (isTrueNaN(obj1) && isTrueNaN(obj2)) {
        return true;
    } else if (isDate(obj1)) {
        if (isDate(obj2)) {
            return obj1.getTime() == obj2.getTime();
        } else {
            return false;
        }
    } else {
        if (isPrimitiveData(obj1) || isPrimitiveData(obj2)) {
            return false;
        } else {
            if (Array.isArray(obj1)) {
                return arrayAdapt(obj1, obj2);
            } else {
                return objectAdapt(obj1, obj2);
            }
        }
    }
}


/**
 * compute difference between two objects and return different attributes
 *
 * @param  {Object} ref  the reference object
 * @param  {Object} obj  the object to compare with reference
 * @return {Object}
 */
function diffObject(ref, obj) {
    if (typeof ref != 'object' || typeof obj != 'object') {
        throw new TypeError('`ref` and `obj` must be Object');
    }

    if (ref === obj) {
        return null;
    } else {
        var output = {};

        var hasModified = false;
        Object.keys(obj).forEach(function (attr) {
            if (!ref.hasOwnProperty(attr) || !deepCompare(ref[attr], obj[attr])) {
                output[attr] = obj[attr];
                hasModified = true;
            }
        });

        if (hasModified) {
            return output;
        } else {
            return null;
        }
    }
}

/**
 * return a random hash string of specified size contains characters within a-z and 0-9
 *
 * @param      {Number} size
 * @return     {String}
 */
function generateRandomHash(size) {
    var chars = [];
    while (size--) {
        chars.push(Math.floor(Math.random() * 16.0).toString(16));
    }

    return chars.join('');
}

/**
 * generate fake GUID by random number
 * 
 * @return {String}
 */
function generateFakeGuid () {
    var guidChunks = [8, 4, 4, 12].map(generateRandomHash);
    return guidChunks.join('-');
}

/**
 * generate fake uid
 *
 * @param      {String}  format  uid format
 * @param      {number=}  size   size of the uid, default 10
 * @return     {String}
 */
function generateUIDFake(format, size) {
    switch (format) {
        case 'uuid':
            return generateFakeGuid();
        case '':
        case 'normal':
            if (size === undefined) {
                size = 10;
            }

            return generateRandomHash(size);
        default:
            throw new Error('invalid format ' + format);
    }
}

/**
 * string formatting
 */

var TEMPLATE_REG = /\{\s*([a-zA-Z0-9_\-]+)\s*\}/g;

function convertStringTemplate(template, templateSrc, templateReader) {
    return template.replace(TEMPLATE_REG, function (match, grp1) {
        var replace = templateReader(templateSrc, grp1);
        if (replace === undefined || replace === null) {
            return '';
        } else {
            return String(replace);
        }
    });
}

/**
 * format string by index
 *
 * @param {String} pattern
 * @param {Array} params...
 *
 * @return {String}
 */
function formatString(pattern) {
    if (typeof pattern != 'string') {
        throw new TypeError('pattern must be string');
    }

    var params = arguments;

    return convertStringTemplate(pattern, arguments, function (templateSrc, key) {
        var index = Number(key);
        if (isNaN(index)) {
            return null;
        } else {
            return templateSrc[index + 1];
        }
    });
}

/**
 * format string by key-value map
 * 
 * @param  {String} pattern
 * @param  {Object} map
 *
 * @return {String}
 */
function formatStringByMap(pattern, map) {
    if (typeof pattern != 'string') {
        throw new TypeError('pattern must be string');
    }

    if (!map) {
        throw new Error('map is null');
    }

    return convertStringTemplate(pattern, map, function (templateSrc, key) {
        return templateSrc[key];
    });
}

/**
 * test whether the given object is a valid date
 *
 * @param  {Any}  date
 * @return {Boolean}
 */
function isValidDate(date) {
    if (!!date && date instanceof Date) {
        return !isNaN(date.getTime());
    } else {
        return false;
    }
}


var flags = Module_Require('SDK.Lang.Flags');

return {
    inherits: inherits,
    deepCompare: deepCompare,
    diffObject: diffObject,
    generateUIDFake: generateUIDFake,
    formatString: formatString,
    formatStringByMap: formatStringByMap,
    isValidDate: isValidDate,
    flagBuilder: flags.flagBuilder
};

});
Module_Define('SDK.Math', function () {

/**
 * test whether two given number is close enough (difference between threshold)
 * @param  {Number} num1
 * @param  {Number} num2
 * @param  {Number=} order  threshold order
 * @return {Boolean}
 */
function closeEnough (num1, num2, order) {
    var threshold = Math.pow(10, arguments.length > 2 ? -order : -6);
    return Math.abs(num1 - num2) <= threshold;
}

/**
 * compute fraction part of given number
 *
 * e.g.:
 * 1.51 -> 0.51
 * -2.3 -> -0.3
 * 0.0 -> 0.0
 * 
 * @param  {Number} num
 * @return {Number}
 */
function fraction (num) {
    num = Number(num);
    if (isNaN(num)) {
        throw new TypeError('fraction only supports number');
    } else {
        var intPart = num >= 0 ? Math.floor(num) : Math.ceil(num);
        return num - intPart;
    }
}

/**
 * clamp value
 * @param  {Number} min minimum value
 * @param  {Nubmer} max maximum value
 * @param  {Number} val test value
 * @return {Number} clamped value
 */
function clamp (min, max, val) {
    return val < min ? min : (val > max ? max : val);
}

/**
 * convert anything to number safely
 * 
 * @param  {any} obj
 * @return {Number}
 */
function safeToNumber (obj) {
    var num = Number(obj);
    if (isNaN(num)) {
        return 0;
    } else {
        return num;
    }
}

/**
 * test a number object by type
 * 
 * @param  {any}  num
 * @return {Boolean}
 */
function isNumber (num) {
    if (typeof num == 'number') {
        return true;
    } else {
        return false;
    }
}

return {
    isNumber: isNumber,
    closeEnough: closeEnough,
    fraction: fraction,
    clamp: clamp,
    safeToNumber: safeToNumber
};

});
Module_Define('SDK.StateMachine', function () {

var STATE_LEAVE_EVENT = 'leave';
var STATE_ENTER_EVENT = 'enter';
var DEFAULT_ACTION_NAME = '_default';

/**
 * print error stack to console
 *
 * @param  {Error} err
 */
function printErrorTraceStack(err) {
    if (err.stack) {
        window.console.error(err.stack);
    } else if (window.console.trace) {
        window.console.trace();
    } else {
        window.console.error(err);
    }
}

/**
 * state
 *
 * @param {String}   name           name of the state, should be unique in a state machine
 * @param {Function} stateChecker   checker function
 */
function State(name, stateChecker) {
    this.name = name;
    this.events = {};
    this._checker = stateChecker || null;
}

State.prototype.addEventHandle = function(name, handle) {
    var handles = this.events[name];
    if (!handles) {
        handles = [];
        this.events[name] = handles;
    }

    handles.push(handle);
};

State.prototype.triggerEvent = function(name, ...params) {
    var handles = this.events[name];
    if (handles) {
        for (var i = 0; i < handles.length; i++) {
            handles[i].apply(null, params);
        }
    }
};

State.prototype.check = function() {
    if (this._checker) {
        return this._checker.call(null);
    } else {
        return true;
    }
};

/**
 * state machine
 */
function StateMachine () {
    this._states = {};
    this._connections = {};
    this._actions = {};

    this._currentState = null;
    this._disposed = false;
}

StateMachine.prototype._findState = function(name) {
    if (this._states.hasOwnProperty(name)) {
        return this._states[name];
    } else {
        return null;
    }
};

StateMachine.prototype._ensureInitialized = function() {
    if (!this._currentState) {
        throw new Error('state machine is not initialized');
    }
};

StateMachine.prototype._ensureNotDisposed = function() {
    if (this._disposed) {
        throw new Error('state machine has been disposed');
    }
};

/**
 * register a new state
 *
 * @param {String}    name          name of the state
 * @param {Boolean=}  isDefault     set this state to current state automatically
 * @param {Function=} stateChecker  check function to be called when transite to this state
 */
StateMachine.prototype.registerState = function(name, isDefault, stateChecker) {
    if (typeof name != 'string') {
        throw new TypeError('state name must be string');
    }

    name = name.trim();
    if (name === '') {
        throw new Error('state name is empty');
    }

    if (this._states.hasOwnProperty(name)) {
        throw new Error(`state [${name}] already exists`);
    } else {
        var state = new State(name, stateChecker);
        this._states[name] = state;

        if (isDefault) {
            this._currentState = state;
        }
    }
    
    return this;
};

/**
 * set current state
 *
 * @param {String} name  name ot the state
 */
StateMachine.prototype.setState = function(name) {
    this._ensureNotDisposed();

    var state = this._findState(name);
    if (!!state) {
        this._currentState = state;
        return this;
    } else {
        throw new Error(`cannot find state [${name}]`);
    }
};

/**
 * remove specific state from the state machine,
 * connections of the state will also be removed,
 * and if the removed state is current state, current state will be reseted
 *
 * @param  {String} name name ot the state
 */
StateMachine.prototype.removeState = function(name) {
    var state = this._findState(name);
    if (!!state) {
        var connections = this._connections;
        delete connections[name];

        Object.keys(connections.forEach(key => {
            var set = connections[key];
            set.delete(name);
        }));

        if (this._currentState === state) {
            this._currentState = null;      // this reset internal state of state machine to uninitialization state
        }

        return this;
    } else {
        throw new Error(`cannot find state [${name}]`);
    }
};

StateMachine.prototype._hasConnection = function(src, dest) {
    var connSet = this._connections[src];
    if (!!connSet) {
        return connSet.has(dest);
    } else {
        return false;
    }
};

/**
 * add a directional connect between to states
 *
 * @param {String} src      the source state
 * @param {String} dest     the destination state
 * @param {Boolean=} mutual create mutual connections between src and dest automatically
 */
StateMachine.prototype.addConnection = function(src, dest, mutual) {
    var connections = this._connections;

    var connSet = connections[src];
    if (!connSet) {
        connSet = new Set();
        connections[src] = connSet;
    }

    connSet.add(dest);

    if (!!mutual) {
        this.addConnection(dest, src, false);
    }

    return this;
};

/**
 * register an action
 *
 * @param  {String} actionName  name of the action
 * @param  {Object} action      action callback set
 */
StateMachine.prototype.registerAction = function(actionName, action) {
    if (typeof actionName != 'string') {
        throw new TypeError('state actionName must be string');
    }

    actionName = actionName.trim();
    if (actionName === '') {
        throw new Error('state actionName is empty');
    }

    if (!action) {
        throw new Error('action is null');
    }

    var actions = this._actions[actionName];

    if (!actions) {
        actions = [];
        this._actions[actionName] = actions;
    }

    actions.push(action);

    return this;
};

/**
 * register event callback for a state
 *
 * @param  {String}   name     name of the state
 * @param  {String}   event    name of the event
 * @param  {Function} callback the callback
 */
StateMachine.prototype.registerStateEvent = function(name, event, callback) {
    if (typeof callback != 'function') {
        throw new TypeError('callback must be function');
    }

    var state = this._findState(name);
    if (state) {
        state.addEventHandle(event, callback);
    } else {
        throw new Error(`cannot find state [${name}]`);
    }

    return this;
};

/**
 * batch register event callback for state
 *
 * @param  {String} name   name of the state
 * @param  {Object} events { event: callback }
 */
StateMachine.prototype.registerStateEvents = function(name, events) {
    if (!events) {
        throw new Error('events is null');
    }

    var state = this._findState(name);
    if (state) {
        Object.keys(events).forEach(evt => {
            var callback = events[evt];
            if (callback !== null && callback !== void(0)) {
                if (typeof callback == 'function') {
                    state.addEventHandle(evt, callback);
                } else {
                    throw new TypeError(`invalid callback function for event [${evt}]`);
                }
            }
        });
    } else {
        throw new Error(`cannot find state [${name}]`);
    }

    return this;
};

/**
 * execute the specified action
 *
 * @param  {String} actionName name of the action
 */
StateMachine.prototype.execAction = function(actionName) {
    this._ensureInitialized();
    this._ensureNotDisposed();

    var currentState = this._currentState;
    var stateName = currentState.name;

    var actions = this._actions[actionName];
    if (actions) {
        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            var callback = action[stateName];
            try {
                if (callback) {
                    callback();
                } else {
                    var defaultCallback = action[DEFAULT_ACTION_NAME];
                    if (defaultCallback) {
                        defaultCallback();
                    }
                }
            } catch (err) {
                printErrorTraceStack();
            }
        }
    } else {
        throw new Error(`action [${actionName}] is not exists`);
    }
};

/**
 * transit the destination state from currnet state
 *
 * @param  {String} dest        name of the destination state
 * @param  {Function=} success  callback for transition success
 * @param  {Function=} fail     callback for transition failed
 */
StateMachine.prototype.transitTo = function(dest, success, fail) {
    this._ensureInitialized();
    this._ensureNotDisposed();

    var currentState = this._currentState;
    var destState = this._findState(dest);

    if (currentState === destState) {
        if (success) {
            success();
        }
        return;
    }

    var err = null;
    if (destState) {
        if (this._hasConnection(currentState.name, dest) && destState.check()) {
            try {
                currentState.triggerEvent(STATE_LEAVE_EVENT, dest);
            } catch (e) {
                printErrorTraceStack(e);
            }

            var srcState = this._currentState;
            this._currentState = destState;

            try {
                destState.triggerEvent(STATE_ENTER_EVENT, srcState.name);
            } catch (e) {
                printErrorTraceStack(e);
            }

            if (success) {
                success();
            }
        } else {
            err = new Error(`transition ${currentState.name} -> ${dest} cannot be performanced`);
            if (fail) {
                fail(err);
            } else {
                throw err;
            }
        }
    } else {
        err = new Error(`destination state [${dest}] is not exists`);
        if (fail) {
            fail(err);
        } else {
            throw err;
        }
    }
};

/**
 * get name of the current state
 *
 * @return {String}
 */
StateMachine.prototype.currentState = function() {
    if (this._currentState) {
        return this._currentState.name;
    } else {
        return '';
    }
};

/**
 * dispose the state machine, methods like `transitTo`, `execAction` will not be able to executed after disposion
 */
StateMachine.prototype.dispose = function() {
    if (!this._disposed) {
        this._disposed = true;
    }
};

return {
    StateMachine: StateMachine
};

});
Module_Define('SDK.Unit', function () {

const Lang = Module_Require('SDK.Lang');

/**
 * Unit base class
 *
 * @param {Number} value
 * @param {String} type
 */
function Unit (value, type) {
    if (value) {
        value = Number(value);
        if (isNaN(value)) {
            throw new TypeError('Value must be number');
        } else {
            this._value = value;
        }
    } else {
        this._value = 0;
    }


    if (typeof type == 'string') {
        this._type = type;
    } else {
        throw new TypeError('type must be string');
    }
}

Unit.prototype.toString = function() {
    return '';
};

Unit.prototype.fromString = function(str) {
    return;
};

Unit.prototype.convertTo = function(targetType) {
    return null;
};

Unit.prototype.getValue = function() {
    return this._value;
};


// bytes units

const byteList = ['b', 'kb', 'mb', 'gb', 'tb'];
const bytePattern = /^\s*(\d+)\s*(b|kb|mb|gb|tb)?\s*$/i;

function ByteUnit (value, type) {
    Unit.call(this, value, type);
    this._typeIdx = this._getTypeIndex(type);
}

Lang.inherits(ByteUnit, Unit);

ByteUnit.prototype._getTypeIndex = function(type) {
    var typeIdx = byteList.indexOf(type);
    if (typeIdx >= 0) {
        return typeIdx;
    } else {
        throw new Error('Unsupported type: ' + type);
    }
};

ByteUnit.prototype.convertTo = function(type) {
    var targetIdx = this._getTypeIndex(type);
    var i;
    if (targetIdx > this._typeIdx) {
        for (i = this._typeIdx; i < targetIdx; i++) {
            this._value /= 1024;
        }
    } else if (targetIdx < this._typeIdx) {
        for (i = this._typeIdx; i > targetIdx; i--) {
            this._value *= 1024;
        }
    }

    this._typeIdx = targetIdx;
    this._type = type;
};

ByteUnit.prototype.toString = function(precision) {
    var valueStr;
    if (arguments.length > 0) {
        if (precision > 0) {
            var intpart = Math.floor(this._value);
            var fraction = String(Math.abs(this._value - intpart)).replace(/^0?\./, '');
            fraction = fraction.substr(0, precision).replace(/0*$/, '');

            if (Number(fraction) > 0) {
                valueStr = [intpart, fraction].join('.');
            } else {
                valueStr = intpart;
            }
        } else {
            valueStr = String(Math.round(this._value));
        }
    } else {
        valueStr = String(this._value);
    }

    return [valueStr, this._type.toUpperCase()].join('');
};

ByteUnit.prototype.fromString = function(str) {
    str = str.trim().toLowerCase();
    if (str.length === 0) {
        throw new Error('Cannot convert from empty string');
    }

    var matchRes = bytePattern.exec(str);
    if (matchRes) {
        var value = matchRes[1];
        var type = matchRes[2] || byteList[0];

        if (type === this._type) {
            this._value = value;
        } else {
            var targetIdx;
            if (type === byteList[0]) {
                targetIdx = 0;
            } else {
                targetIdx = this._getTypeIndex(type);
            }

            var i;
            if (targetIdx > this._typeIdx) {
                for (i = this._typeIdx; i < targetIdx; i++) {
                    value *= 1024;
                }
            } else {
                for (i = this._typeIdx; i > targetIdx; i--) {
                    value /= 1024;
                }
            }

            this._value = value;
        }
    } else {
        throw new Error('Cannot recognize: ' + str);
    }
};


return {
    ByteUnit: ByteUnit
};

});
(function ()
{

'use strict';

/**
 * Namespace
 */
function Namespace () {
    return;
}

Namespace.prototype.getNamespace = function(path) {
    var parts = path.split('.');

    var parent = this;
    var frags = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();

        if (parent.hasOwnProperty(part)) {
            parent = parent[part];
        } else {
            parent[part] = {};
            parent = parent[part];
        }

        frags.push(part);

        if (typeof parent != 'object') {
            throw new Error(frags.join('.') + ' is not a namespace');
        }
    }

    return parent;
};

function isPublicInterface(name) {
    return !name.startsWith('__');
}

function isPrivateModule(moduleInfo) {
    return Boolean(moduleInfo['__access__'] == 'private');
}

// initiation
Module_Batch_Init();

var $SDK = new Namespace();

Module_List().forEach(function (name) {
    try {
        var moduleInfo = Module_Require(name);

        if (!isPrivateModule(moduleInfo)) {
            if (name.startsWith('SDK.')) {
                name = name.substr(4);
            }

            var namespace = $SDK.getNamespace(name);
            Object.keys(moduleInfo).forEach(function (key) {
                if (isPublicInterface(key)) {
                    namespace[key] = moduleInfo[key];
                }
            });
        }
    } catch (err) {
        window.console.error(`module [${name}] loading failed:\n${err}`);
    }
});

window.$SDK = $SDK;

}());
angular.module('LINDGE.Service.SDK', [])
.constant('$SDK', window.$SDK);
angular.module('LINDGE-Service', ['LINDGE.Service.Animation', 'LINDGE.Service.BrowserEnv', 'LINDGE.Service.Cache', 'LINDGE.Service.Communication', 'LINDGE.Service.EventEmitter', 'LINDGE.Service.ExecutionQueue', 'LINDGE.Service.Href', 'LINDGE.Service.ModuleManager', 'LINDGE.Service.LocalStorage', 'LINDGE.Service.Params', 'LINDGE.Service.Path', 'LINDGE.Service.TimingQueue', 'LINDGE.Service.StateMachine', 'LINDGE.Service.Transition', 'LINDGE.Service.SDK']);
angular.module('LINDGE.Service.Animation', [])

.service('$luiAnimation', [function(){
    var requestAnimationFrame =
        (window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.msRequestAnimationFrame).bind(window);
    var cancelAnimationFrame =
        (window.cancelAnimationFrame ||
         window.webkitCancelAnimationFrame ||
         window.mozCancelAnimationFrame ||
         window.msCancelAnimationFrame).bind(window);

    /* frame handlers */
    function mockFrameTick (callback) {
        return setTimeout(callback, 17);
    }

    function cancelMockFrameTick (id) {
        return clearTimeout(id);
    }

    if (window.requestAnimationFrame) {
        this.frameTick = requestAnimationFrame;
        this.cancelFrame = cancelAnimationFrame;
    } else {
        this.frameTick = mockFrameTick;
        this.cancelFrame = cancelMockFrameTick;
    }
}]);
angular.module('LINDGE.Service.BrowserEnv', [])

.factory('browserEnv', [function(){
    var BROWSER_TYPES = {
        IE: 'IE',
        Edge: 'Edge',
        Chrome: 'Chrome',
        Firefox: 'Firefox',
        Safari: 'Safari'
    };

    var OS_TYPES = {
        WINDOWS: 'Windows',
        MACOS: 'Mac',
        UNIX: 'Unix',
        LINUX: 'Linux',
        UNKNOWN: 'Unknown'
    };

    var KERNELS = ['Mozilla', '.NET', 'Chrome', 'WebKit', 'Safari'];

    var X64_ARCH_SYMBOLS = ['x86_64', 'x86-64', 'Win64', 'x64;', 'amd64', 'AMD64', 'WOW64', 'x64_64', 'ia64', 'sparc64', 'ppc64', 'IRIX64'];
    var ARCH_X32 = 'x32';
    var ARCH_X64 = 'x64';


    // browser checking
    function checkIE(userAgent) {
        var idxMSIE = userAgent.indexOf('MSIE');
        if (idxMSIE >= 0) {
            // IE 8-10
            var version = userAgent.substr(idxMSIE + 5, 4).replace(/[; ]/g, '');
            return [true, version, BROWSER_TYPES.IE];
        } else {
            // IE 11
            var idxTrident = userAgent.indexOf('Trident');
            if (idxTrident >= 0) {
                var idxRV = userAgent.indexOf('rv:');
                if (idxRV >= 0 && userAgent.substr(idxRV + 3, 2) == '11') {
                    return [true, '11.0', BROWSER_TYPES.IE];
                } else {
                    return [true, null, BROWSER_TYPES.IE];
                }
            } else {
                return [false];
            }
        }
    }

    function checkChrome (userAgent, vendor) {
        if (/Google Inc/.test(vendor)) {
            var versionMatch = /Chrome\/([0-9.a-z]+)/i.exec(userAgent);
            if (versionMatch) {
                return [true, versionMatch[1], BROWSER_TYPES.Chrome];
            } else {
                return [true, null, BROWSER_TYPES.Chrome];
            }
        } else {
            return [false];
        }
    }

    function checkSafari(userAgent, vendor) {
        var versionMatch = /Safari\/([0-9.a-z]+)/i.exec(userAgent);
        if (versionMatch) {
            return [true, versionMatch[1], BROWSER_TYPES.Safari];
        } else {
            return [false];
        }
    }

    function checkEdge (userAgent) {
        var idxEdge = userAgent.indexOf('Edge/');
        if (idxEdge >= 0) {
            var versionMatch = /Edge\/([0-9.]+)/.exec(userAgent);
            if (versionMatch) {
                return [true, versionMatch[1], BROWSER_TYPES.Edge];
            } else {
                return [true, null, BROWSER_TYPES.Edge];
            }
        } else {
            return [false];
        }
    }

    function checkFirefox (userAgent) {
        var idxFFX = userAgent.indexOf('Firefox/');
        if (idxFFX >= 0) {
            var versionMatch = /Firefox\/([0-9.a-z]+)/i.exec(userAgent);
            if (versionMatch) {
                return [true, versionMatch[1], BROWSER_TYPES.Firefox];
            } else {
                return [true, null, BROWSER_TYPES.Firefox];
            }
        } else {
            return [false];
        }
    }

    // OS checking
    function getOS () {
        var appVersion = window.navigator.appVersion;
        if (appVersion.indexOf('Win') >= 0) {
            return OS_TYPES.WINDOWS;
        } else if (appVersion.indexOf('Mac') >= 0) {
            return OS_TYPES.MACOS;
        } else if (appVersion.indexOf('X11') >= 0) {
            return OS_TYPES.UNIX;
        } else if (appVersion.indexOf('Linux') >= 0) {
            return OS_TYPES.LINUX;
        } else {
            return OS_TYPES.UNKNOWN;
        }
    }

    // kernel compatible
    function checkCompatibleKernel (userAgent) {
        return KERNELS.filter(function (item) {
            return userAgent.indexOf(item) >= 0;
        });
    }

    // system architecture
    function checkOSArchitecture (userAgent) {
        var found64 = X64_ARCH_SYMBOLS.some(function (item) {
            return userAgent.indexOf(item) >= 0;
        });

        return found64 ? ARCH_X64 : ARCH_X32;
    }

    var userAgent = window.navigator.userAgent;
    var vendor = window.navigator.vendor;
    var os = getOS();
    var kernels = checkCompatibleKernel(userAgent);
    var architucture = checkOSArchitecture(userAgent);
    var language = window.navigator.language;

    var result = {
        browserType: 'Unknown',
        browserVersion: 'Unknown',
        operatingSystem: os,
        kernels: kernels,
        architucture: architucture,
        language: language
    };

    var checkQueue = [checkIE, checkEdge, checkChrome, checkSafari, checkFirefox];
    for (var i = 0; i < checkQueue.length; i++) {
        var res = checkQueue[i](userAgent, vendor);
        if (res[0]){
            angular.extend(result, {
                browserType: res[2],
                browserVersion: res[1]
            });

            return result;
        }
    }

    return result;
}]);
angular.module('LINDGE.Service.Cache', ['LINDGE.Service.SDK', 'LINDGE.Service.Animation'])

.service('$luiCache', ['$SDK', '$luiAnimation', function ($SDK, $luiAnimation) {
    // abstract cache
    function AbstractCache () {
        return;
    }

    AbstractCache.prototype.get = function() {
        throw new Error('get is not supported');
    };

    AbstractCache.prototype.batchGet = function() {
        throw new Error('batch get is not supported');
    };

    AbstractCache.prototype.getRef = function() {
        throw new Error('get ref is not supported');
    };

    AbstractCache.prototype.batchGetRef = function() {
        throw new Error('batch get ref is not supported');
    };

    AbstractCache.prototype.set = function() {
        throw new Error('set is not supported');
    };

    AbstractCache.prototype.batchSet = function() {
        throw new Error('batch set is not supported');
    };

    AbstractCache.prototype.setRef = function() {
        throw new Error('set ref is not supported');
    };

    AbstractCache.prototype.batchSetRef = function() {
        throw new Error('batch set ref is not supported');
    };

    AbstractCache.prototype.remove = function() {
        throw new Error('remove is not supported');
    };

    AbstractCache.prototype.clear = function() {
        throw new Error('clear is not supported');
    };

    AbstractCache.prototype.contains = function() {
        throw new Error('contains is not supported');
    };

    AbstractCache.prototype.onSetCache = function() {
        throw new Error('onSetCache is not supported');
    };

    AbstractCache.prototype.onRemoveCache = function() {
        throw new Error('onRemoveCache is not supported');
    };

    var tick = $luiAnimation.frameTick;

    // key value storage
    function KeyValueCache () {
        AbstractCache.call(this);

        this._storage = {};
        this._evtHandlers = {
            'set': [],
            'remove': []
        };
    }

    $SDK.Lang.inherits(KeyValueCache, AbstractCache);

    KeyValueCache.prototype.get = function(key) {
        if (this._storage.hasOwnProperty(key)) {
            var value = this._storage[key];
            if (angular.isObject(value) || angular.isArray(value)) {
                return angular.copy(value);
            } else {
                return value;
            }
        } else {
            return null;
        }
    };

    KeyValueCache.prototype.batchGet = function(keys) {
        var result = {};
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            result[key] = this.get(key);
        }

        return result;
    };

    KeyValueCache.prototype.getRef = function(key) {
        if (this._storage.hasOwnProperty(key)) {
            return this._storage[key];
        } else {
            return null;
        }
    };

    KeyValueCache.prototype.getUnsafe = KeyValueCache.prototype.getRef;

    KeyValueCache.prototype.batchGetRef = function(keys) {
        var result = {};
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            result[key] = this.getRef(key);
        }

        return result;
    };

    KeyValueCache.prototype._triggerSetEvt = function(key, value) {
        var list = this._evtHandlers['set'];
        list.forEach(function (item) {
            if (item[0] === key) {
                tick(function () {
                    item[1](value);
                });
            }
        });
    };

    KeyValueCache.prototype.set = function (key, value) {
        if (angular.isObject(value) || angular.isArray(value)) {
            value = angular.copy(value);
        }

        this._storage[key] = value;
        this._triggerSetEvt(key, value);
    };

    KeyValueCache.prototype.batchSet = function(keyValues) {
        for (var i = 0; i < keyValues.length; i++) {
            var pair = keyValues[i];
            this.set(pair[0], pair[1]);
        }
    };

    KeyValueCache.prototype.setRef = function(key, value) {
        this._storage[key] = value;
        this._triggerSetEvt(key, value);
    };

    KeyValueCache.prototype.setUnsafe = KeyValueCache.prototype.setRef;

    KeyValueCache.prototype.batchSetRef = function(keyValues) {
        for (var i = 0; i < keyValues.length; i++) {
            var pair = keyValues[i];
            this.setRef(pair[0], pair[1]);
        }
    };

    KeyValueCache.prototype.remove = function () {
        for (var i = 0; i < arguments.length; i++) {
            delete this._storage[arguments[i]];
        }
    };

    KeyValueCache.prototype.clear = function () {
        var attrs = Object.keys(this._storage);
        for (var i = 0; i < attrs.length; i++) {
            delete this._storage[attrs[i]];
        }
    };

    KeyValueCache.prototype.contains = function (key) {
        return this._storage.hasOwnProperty(key);
    };

    KeyValueCache.prototype._createEvtCancelHandler = function(name, handler) {
        var list = this._evtHandlers[name];
        return function () {
            for (var i = 0; i < list.length; i++) {
                if (list[i][1] === handler) {
                    list.splice(i, 1);
                    return;
                }
            }
        };
    };

    KeyValueCache.prototype.onSetCache = function(key, handler, immediate) {
        if (typeof handler == 'function') {
            var cancelHandler = this._createEvtCancelHandler('set', handler);
            this._evtHandlers['set'].push([key, handler]);

            if (immediate && this.contains(key)) {
                var current = this._storage[key];
                tick(function () {
                    handler(current);
                });
            }

            return cancelHandler;
        } else {
            throw new TypeError('Handler must be function');
        }
    };

    KeyValueCache.prototype.toString = function() {
        return '<cache: KeyValue>';
    };


    var invalidCacheNames = ['create', '$types'];

    return {
        $types: {
            KEY_VALUE: 0x01
        },
        create: function (name, type, forceOverride) {
            if (!name) {
                throw new Error('Cache name is empty');
            } else if (invalidCacheNames.indexOf(name) >= 0) {
                throw new Error('Cannot use cache name `' + name + '`');
            } else {
                if (!!forceOverride || !this.hasOwnProperty(name)) {
                    switch (type) {
                        case this.$types.KEY_VALUE:
                            this[name] = new KeyValueCache();
                            break;
                    }
                }

                return this[name];
            }
        }
    };
}]);
angular.module('LINDGE.Service.Communication', ['LINDGE.Service.LocalStorage'])

.service('$luiPageNotification', ['localStorageService', '$SDK', function (localStorage, $SDK) {
    var watchingTable = {};
    var prefix = 'comm.';

    function createNotification (value, url) {
        return {
            value: value.value,
            url: url
        };
    }

    function createMessagePack(value, fingerprint) {
        var pack = {
            value: value
        };

        if (!!fingerprint) {
            pack._fp = fingerprint;
        }

        return pack;
    }

    function toNotifyKey (key) {
        return localStorage.deriveKey(prefix + key);
    }

    function toUserKey (key) {
        return prefix + key;
    }

    function watchStorageKey (key, handler) {
        if (typeof handler == 'function') {
            var storageKey = toNotifyKey(key);
            watchingTable[storageKey] = {
                handler: handler,
                userKey: toUserKey(key)
            };
        } else {
            throw new TypeError('Handler must be function');
        }
    }

    function cancelStorageKey (key) {
        var storageKey = toNotifyKey(key);
        delete watchingTable[storageKey];

        localStorage.remove(toUserKey(key));
    }

    function generateFingerprint() {
        var timeStamp = (new Date()).getTime();
        var randomHash = $SDK.Lang.generateUIDFake('normal');

        return String(timeStamp) + '_' + randomHash;
    }

    function writeToStorage (key, value, withFingerprint) {
        if (value === undefined) {
            value = null;
        }

        var fingerprint = !!withFingerprint ? generateFingerprint() : '';
        localStorage.set(toUserKey(key), createMessagePack(value, fingerprint));
    }

    function watchingHandler (evt) {
        var changedKey = evt.key;
        var changingUrl = evt.url;

        var monitor = watchingTable[changedKey];
        if (monitor) {
            var value = localStorage.get(monitor.userKey);
            monitor.handler(createNotification(value, changingUrl));
        }
    }

    function clearWatching () {
        angular.forEach(watchingTable, function(monitor, key){
            localStorage.remove(monitor.userKey);
        });

        watchingTable = {};
    }

    window.addEventListener('storage', watchingHandler);
    window.addEventListener('beforeunload', clearWatching);

    var service;
    if (localStorage.isSupported) {
        service = {
            watch: watchStorageKey,
            unwatch: cancelStorageKey,
            notify: writeToStorage
        };
    } else {
        service = {
            watch: angular.noop,
            unwatch: angular.noop,
            notify: angular.noop
        };
    }

    return service;
}]);
angular.module('LINDGE.Service.EventEmitter', ['LINDGE.Service.Animation'])

.factory('EventEmitter', ['$luiAnimation', function ($luiAnimation) {
    var tick = $luiAnimation.frameTick;

    function tickMany(cbs, params, binding) {
        if (typeof cbs == 'function') {
            tick(function() {
                cbs.apply(binding || null, params);
            });
        } else if (Array.isArray(cbs)) {
            cbs.forEach(function(cb) {
                tick(function() {
                    cb.apply(binding || null, params);
                });
            });
        } else {
            throw new ReferenceError('Invalid callbacks');
        }
    }

    // event emitter class
    function EventEmitter () {
        this._events = {};
    }

    EventEmitter.prototype._dispatchEvent = function (evtName) {
        var args = Array.prototype.slice.call(arguments, 1);
        var names = Array.isArray(evtName) ? evtName : [evtName];

        var events = this._events;
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if (events.hasOwnProperty(name) && events[name].length){
                tickMany(events[name], args);
            }
        }
    };

    EventEmitter.prototype.addEventListener = function (name, callback) {
        if (typeof name == 'string' && name.length > 0) {
            if (typeof callback == 'function') {
                if (this._events.hasOwnProperty(name)){
                    this._events[name].push(callback);
                } else {
                    this._events[name] = [callback];
                }
            } else {
                throw new TypeError('Invalid event listener');
            }
        } else {
            throw new TypeError('Invalid event name');
        }
    };

    EventEmitter.prototype.on = function(name, callback) {
        this.addEventListener(name, callback);
        return this;
    };

    EventEmitter.prototype.removeEventListener = function (name, callback) {
        if (typeof name == 'string' && name.length > 0) {
            if (typeof callback == 'function') {
                if (this._events.hasOwnProperty(name)) {
                    var idx = this._events[name].indexOf(callback);
                    if (idx >= 0) {
                        this._events[name].splice(idx, 1);
                        return true;
                    } else {
                        return false;
                    }
                }
            } else if (callback === undefined || callback === null) {
                // remove all events
                this._events[name].length = 0;
                return true;
            } else {
                throw new TypeError('Invalid event listener');
            }
        } else {
            throw new TypeError('Invalid event name');
        }
    };

    return EventEmitter;
}]);
angular.module('LINDGE.Service.ExecutionQueue', ['LINDGE.Service.SDK'])

.service('ExecutionQueue', ['$SDK', function ($SDK) {
    var ExecutionQueue = $SDK.ExecutionQueue.ExecutionQueue;

    this.create = function (size, autoStart, poolMode) {
        var queue;
        if (arguments.length > 1) {
            queue = new ExecutionQueue(size, autoStart);

            if (poolMode) {
                queue.hangWhenEmpty();
            }
        } else {
            queue = new ExecutionQueue(size);
        }

        return queue;
    };

    this.Queue = ExecutionQueue;
}]);
angular.module('LINDGE.Service.Href', ['LINDGE.Service.Params', 'LINDGE.Service.Path', 'Figure-Config-RouteTable'])

.provider('$luiHref', function $luiHrefProvider () {
    var inheriteParams = [];

    this.setDefaultInheriteParams = function (params) {
        if (Array.isArray(params)) {
            var strParams = params.map(function (param) { return String(param); });
            inheriteParams.push.apply(inheriteParams, strParams);
        }
    };

    function LuiHref ($window, queryString, redirectUrl) {
        /**
         * compose new page url
         * 
         * @param  {String} path
         * @param  {Object} params
         * @param  {String} hash
         * @param  {Boolean=} inheriteParam
         * @return {String}
         */
        this.composeUrl = function (path, params, hash, inheriteParam) {
            var targetParams = {};

            if (arguments.length < 4 || !!inheriteParam) {
                inheriteParams.forEach(function (param) {
                    targetParams[param] = queryString.get(param);
                });
            }

            angular.forEach(params, function(value, key){
                if (key === null || key === undefined) {
                    targetParams[key] = '';
                } else {
                    targetParams[key] = value;
                }
            });

            // generate query params
            var queryPart = Object.keys(targetParams)
                .map(function (key) {
                    return [
                        encodeURIComponent(key),
                        encodeURIComponent(targetParams[key])
                    ].join('=');
                })
                .join('&');

            if (queryPart.length > 0) {
                queryPart = '?' + queryPart;
            }

            // generate hash
            var hashPart = !!hash ? ('#' + hash) : '';

            // full url
            var url = [path, queryPart, hashPart].join('');
            
            return url;
        };

        /**
         * compose figure redirect url
         * 
         * @param  {String} routeName  name of the entrance route
         * @param  {Object} params
         * @param  {String} hash
         * @return {String}
         */
        this.composeRedirectUrl = function (routeName, params, hash) {
            var entranceMatcher = /^(?:entrance\.)?(.+)$/i;
            function getEntranceName (routeName) {
                var matchResult = entranceMatcher.exec(routeName);
                if (matchResult) {
                    return matchResult[1];
                } else {
                    return null;
                }
            }

            var entranceName = getEntranceName(routeName);
            if (entranceName) {
                var targetUrl = this.composeUrl(entranceName, params, hash);
                var encodedUrl = window.encodeURIComponent(targetUrl);

                return redirectUrl + '?entrance=' + encodedUrl;
            } else {
                return '';
            }
        };

        /**
         * goto the new page
         *
         * @param {String} path     the new plain url
         * @param {Object} params   new query params
         * @param {String} hash     the hash tag
         * @param {Boolean} newTab  whether open a new tab
         */
        this.goto = function (path, params, hash, newTab) {
            function newTabByLink (url) {
                var link = angular.element('<a>').attr({
                    'href': url,
                    'target': '_blank'
                }).css({ 'opacity': 0 });

                angular.element(document.body).append(link);
                link[0].click();
                link.remove();
            }

            var url = this.composeUrl(path, params, hash);

            if (!!newTab) {
                $window.open(url, '_blank');
                $window.focus();
            } else {
                $window.location.href = url;
            }
        };

        /**
         * redirect the new page via figure
         *
         * @param {String} routeName    name of the entrance route
         * @param {Object} params       new query params
         * @param {String} hash         the hash tag
         * @param {Boolean} newTab      whether open a new tab
         */
        this.redirectTo = function (routeName, params, hash, newTab) {
            var url = this.composeRedirectUrl(routeName, params, hash);

            if (!!newTab) {
                $window.open(url, '_blank');
                $window.focus();
            } else {
                $window.location.href = url;
            }
        };
    }

    this.$get = ['$window', 'queryString', 'routeTable', 'path', function ($window, queryString, routeTable, path) {
        var figureUrl = path.combine(routeTable['figure_config'], 'Redirect');
        return new LuiHref($window, queryString, figureUrl);
    }];
})

.filter('luiHrefFilter', ['$luiHref', function ($luiHref) {
    return function (path, params, hash) {
        return $luiHref.composeUrl(path, params, hash);
    };
}])

.filter('entranceFilter', ['$luiHref', function ($luiHref) {
    return function (path, params, hash) {
        return $luiHref.composeRedirectUrl(path, params, hash);
    };
}]);
angular.module('LINDGE.Service.ModuleManager', [])

.provider('$moduleManager', function $moduleManager () {
    // base types //

    var COMPONENT_TYPE = {
        UNKNOWN: 'unknown',
        SCRIPT: 'script',
        STYLE: 'style'
    };

    var COMPONENT_PRIORITY = {
        NORMAL: 10,
        HIGH: 20,
        LOW: 5
    };

    /**
     * Module, a set of components
     *
     * @class      Module
     */
    function Module() {
        this.id = '';
        this.name = '';
        this.components = [];
    }

    /**
     * check whether all the components of this module is loaded
     *
     * @return     {boolean}
     */
    Module.prototype.isLoaded = function () {
        return this.components.every(function (component) {
            return component.loaded || component.checkScope();
        });
    };

    /**
     * A component in a module
     *
     * @class      Component
     */
    function Component() {
        this.id = '';
        this.name = '';
        this.path = '';
        this.loaded = false;
        this.type = COMPONENT_TYPE.UNKNOWN;
        this.scopeChecker = null;
        this.downloadParams = {
            crossorigin: false,
            priority: COMPONENT_PRIORITY.NORMAL,
            trivial: false
        };
    }

    /**
     * check the browser environment to see whether the component needs to be downloaded
     *
     * @return     {boolean}
     */
    Component.prototype.checkScope = function() {
        if (!!this.scopeChecker) {
            return this.scopeChecker.call(null);
        } else {
            return false;
        }
    };

    // table of component loading states, granularity of component file
    // the key is filepath
    var loadingHistory = {};

    function createLoadingState() {
        return {
            isLoaded: false,
            handle: null
        };
    }

    // repository of modules
    var modules = {};

    var pathPattern = /\.(\w+)$/;

    /**
     * guess component type from path
     *
     * @param      {String} path    path of component file
     * @return     {COMPONENT_TYPE} component type
     */
    function guessComponentType(path) {
        var match = pathPattern.exec(path);
        if (match) {
            switch (match[1]) {
                case 'css':
                    return COMPONENT_TYPE.STYLE;
                case 'js':
                    return COMPONENT_TYPE.SCRIPT;
                default:
                    return COMPONENT_TYPE.UNKNOWN;
            }
        } else {
            return COMPONENT_TYPE.UNKNOWN;
        }
    }

    /**
     * register a module to internal module repository
     *
     * @param      {Object}  moduleInfo  the module definition
     */
    function registerModule(moduleInfo) {
        if (!moduleInfo.id) {
            throw new Error('missing module id');
        }

        if (!Array.isArray(moduleInfo.components)) {
            throw new TypeError('components must be array');
        }

        var module = new Module();
        module.id = moduleInfo.id;
        module.name = !!moduleInfo.name ? moduleInfo.name : module.id;

        moduleInfo.components.forEach(function (componentInfo, index) {
            var component = new Component();
            if (!componentInfo.id) {
                throw new Error('missing component id, index ' + index);
            }

            component.id = componentInfo.id;
            component.name = !!componentInfo.name ? componentInfo.name : component.id;
            component.path = componentInfo.path || '';
            if (!!componentInfo.type && componentInfo.type !== COMPONENT_TYPE.UNKNOWN) {
                component.type = componentInfo.type;
            } else {
                if (component.path) {
                    component.type = guessComponentType(component.path);
                } else {
                    component.type = COMPONENT_TYPE.UNKNOWN;
                }
            }

            component.scopeChecker = componentInfo.scopeChecker || null;
            if (!!componentInfo.downloadParams) {
                angular.extend(component.downloadParams, componentInfo.downloadParams);
            }

            module.components.push(component);
        });

        modules[module.id] = module;
    }

    /**
     * find module by id
     *
     * @param      {String}  id id of the module
     * @return     {Module?}
     */
    function findModule(id) {
        return modules[id] || null;
    }

    /**
     * find component under specific module
     *
     * @param      {String}  moduleId     id of the module
     * @param      {String}  componentId  id of the component
     * @return     {Component?}
     */
    function findComponent(moduleId, componentId) {
        var module = findModule(moduleId);
        if (module) {
            for (var i = 0; i < module.components.length; i++) {
                var component = module.components[i];
                if (component.id == componentId) {
                    return component;
                }
            }
            return null;
        } else {
            return null;
        }
    }

    // runtime service //
    function factory($q, $log) {
        // module/component loading functions //
        
        var downloadMethods = {
            style: function (component) {
                var headElm = document.getElementsByTagName('head')[0];
                var linkElm = document.createElement('link');
                linkElm.rel = 'stylesheet';
                linkElm.type = 'text/css';
                linkElm.href = component.path;

                // add event callbacks
                var defer = $q.defer();

                linkElm.onload = function () {
                    defer.resolve();
                };

                linkElm.onerror = function (err) {
                    defer.reject(err || null);
                    $log.error('error occurred when downloading stylesheet: ' + component.path);
                };

                // trigger file downloading
                headElm.appendChild(linkElm);

                return defer.promise;
            },
            script: function (component) {
                var scriptElm = document.createElement('script');
                scriptElm.type = 'text/javascript';

                var defer = $q.defer();

                // add event callbacks
                if (scriptElm.stateReady) {
                    // IE compability
                    scriptElm.onreadystatechange = function () {
                        if (scriptElm.readyState == 'loaded' || scriptElm.readyState == 'complete'){
                            scriptElm.onreadystatechange = null;
                            defer.resolve();
                        }
                    };
                } else {
                    scriptElm.onload = function () {
                        defer.resolve();
                    };

                    scriptElm.onerror = function (err) {
                        defer.reject(err || null);
                        $log.error('error occurred when downloading script: ' + component.path);
                    };
                }

                // trigger file downloading
                scriptElm.src = component.path;
                document.body.appendChild(scriptElm);

                return defer.promise;
            }
        };

        function downloadComponent(component) {
            var history = loadingHistory[component.path];
            if (history) {
                if (history.isLoaded) {
                    component.loaded = true;
                    return history.handle;
                } else {
                    return history.handle;
                }
            } else {
                var downloadMethod = downloadMethods[component.type];
                if (downloadMethod) {
                    history = createLoadingState();
                    history.handle = downloadMethod(component);
                    history.handle.then(function () {
                        history.isLoaded = true;
                        component.loaded = true;
                    });

                    loadingHistory[component.path] = history;
                    return history.handle;
                } else {
                    throw new Error('cannot recognize component type');
                }
            }
        }

        function needDownloadComponent(component) {
            return !component.loaded && !component.checkScope();
        }

        function createResolvedPromise() {
            var resolvedDefer = $q.defer();
            resolvedDefer.resolve();
            return resolvedDefer.promise;
        }

        /**
         * load a specific module.
         *
         * @param      {String}  moduleId  id of the module
         * @return     {Promise}
         */
        function loadModule (moduleId) {
            if (typeof moduleId != 'string') {
                throw new TypeError('invalid module id');
            }

            moduleId = moduleId.trim();
            if (!moduleId) {
                throw new Error('module id is empty');
            }

            var module = findModule(moduleId);
            if (module) {
                if (module.isLoaded()) {
                    return createResolvedPromise();
                } else {
                    var tasks = [];

                    module.components.forEach(function (component) {
                        if (needDownloadComponent(component)) {
                            try {
                                var handle = downloadComponent(component);
                                if (!component.downloadParams.trivial) {
                                    tasks.push(handle);
                                }
                            } catch (err) {
                                // ignore download error of trivial components
                                if (!component.downloadParams.trivial) {
                                    throw err;
                                }
                            }
                        }
                    });

                    return $q.all(tasks);
                }
            } else {
                throw new Error('module ' + moduleId + ' is not registered');
            }
        }

        /**
         * load a specific component, the component path must be {module id}/{component id}
         *
         * @param      {String}  componentPath  the component path
         * @return     {Promise}
         */
        function loadComponent (componentPath) {
            if (typeof componentPath != 'string') {
                throw new TypeError('invalid component path');
            }

            var parts = componentPath.split('/');
            if (parts.length != 2) {
                throw new Error('invalid component path stucture');
            }
            
            var component = findComponent(parts[0].trim(), parts[1].trim());
            if (component) {
                if (needDownloadComponent(component)) {
                    return downloadComponent(component);
                } else {
                    return createResolvedPromise();
                }
            } else {
                throw new Error('component ' + componentPath + ' is not registered');
            }
        }

        /**
         * download a file indicated by the given path, ignore the whole module
         *
         * @param      {String}  filePath       the file path
         * @param      {COMPONENT_TYPE}  type   the file type
         * @return     {Promise}
         */
        function loadFile (filePath, type) {
            if (typeof filePath != 'string') {
                throw new TypeError('invalid file path');
            }

            filePath = filePath.trim();
            if (!filePath) {
                throw new Error('filePath is empty');
            }

            // construct a temporary component
            var tempComponent = new Component();
            tempComponent.id = filePath;
            tempComponent.name = filePath;
            tempComponent.path = filePath;

            if (!type || type == COMPONENT_TYPE.UNKNOWN) {
                tempComponent.type = guessComponentType(filePath);
            } else {
                tempComponent.type = type;
            }

            return downloadComponent(tempComponent);
        }

        /**
         * check whether the specific module is loaded
         *
         * @param      {String}   moduleId  the module id
         * @return     {boolean}
         */
        function isModuleLoaded (moduleId) {
            if (typeof moduleId != 'string') {
                throw new TypeError('invalid module id');
            }

            var module = findModule(moduleId);

            if (module) {
                return module.isLoaded();
            } else {
                return false;
            }
        }

        // service interfaces //
        return {
            loadModule: loadModule,
            loadComponent: loadComponent,
            loadFile: loadFile,
            isModuleLoaded: isModuleLoaded
        };
    }

    // provider interfaces //
    this.COMPONENT_TYPE = COMPONENT_TYPE;
    this.COMPONENT_PRIORITY = COMPONENT_PRIORITY;

    this.defineModule = function (moduleDef) {
        if (typeof moduleDef != 'object') {
            throw new TypeError('invalid module definition');
        }

        registerModule(moduleDef);
    };

    this.$get = ['$q', '$log', factory];
});
/**
 * An Angular module that gives you access to the browsers local storage
 * @version v0.1.5 - 2014-11-04
 * @link https://github.com/grevory/angular-local-storage
 * @author grevory <greg@gregpike.ca>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, angular, undefined) {
    /*jshint globalstrict:true*/
    'use strict';

    var isDefined = angular.isDefined,
        isUndefined = angular.isUndefined,
        isNumber = angular.isNumber,
        isObject = angular.isObject,
        isArray = angular.isArray,
        extend = angular.extend,
        toJson = angular.toJson,
        fromJson = angular.fromJson;


    // Test if string is only contains numbers
    // e.g '1' => true, "'1'" => true
    function isStringNumber(num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
    }

    var angularLocalStorage = angular.module('LINDGE.Service.LocalStorage', []);

    angularLocalStorage.provider('localStorageService', function() {

        // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
        // e.g. localStorageServiceProvider.setPrefix('youAppName');
        // With provider you can use config as this:
        // myApp.config(function (localStorageServiceProvider) {
        //    localStorageServiceProvider.prefix = 'yourAppName';
        // });
        this.prefix = 'ls';

        // You could change web storage type localstorage or sessionStorage
        this.storageType = 'localStorage';

        // Cookie options (usually in case of fallback)
        // expiry = Number of days before cookies expire // 0 = Does not expire
        // path = The web path the cookie represents
        this.cookie = {
            expiry: 30,
            path: '/'
        };

        // Send signals for each of the following actions?
        this.notify = {
            setItem: true,
            removeItem: false
        };

        // Setter for the prefix
        this.setPrefix = function(prefix) {
            this.prefix = prefix;
            return this;
        };

        // Setter for the storageType
        this.setStorageType = function(storageType) {
            this.storageType = storageType;
            return this;
        };

        // Setter for cookie config
        this.setStorageCookie = function(exp, path) {
            this.cookie = {
                expiry: exp,
                path: path
            };
            return this;
        };

        // Setter for cookie domain
        this.setStorageCookieDomain = function(domain) {
            this.cookie.domain = domain;
            return this;
        };

        // Setter for notification config
        // itemSet & itemRemove should be booleans
        this.setNotify = function(itemSet, itemRemove) {
            this.notify = {
                setItem: itemSet,
                removeItem: itemRemove
            };
            return this;
        };

        this.$get = ['$rootScope', '$window', '$document', '$parse', function($rootScope, $window, $document, $parse) {
            var self = this;
            var prefix = self.prefix;
            var cookie = self.cookie;
            var notify = self.notify;
            var storageType = self.storageType;
            var webStorage;

            // When Angular's $document is not available
            if (!$document) {
                $document = document;
            } else if ($document[0]) {
                $document = $document[0];
            }

            // If there is a prefix set in the config lets use that with an appended period for readability
            if (prefix.substr(-1) !== '.') {
                prefix = !!prefix ? prefix + '.' : '';
            }
            var deriveQualifiedKey = function(key) {
                return prefix + key;
            };
            // Checks the browser to see if local storage is supported
            var browserSupportsLocalStorage = (function() {
                try {
                    var supported = (storageType in $window && $window[storageType] !== null);

                    // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
                    // is available, but trying to call .setItem throws an exception.
                    //
                    // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
                    // that exceeded the quota."
                    var key = deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
                    if (supported) {
                        webStorage = $window[storageType];
                        webStorage.setItem(key, '');
                        webStorage.removeItem(key);
                    }

                    return supported;
                } catch (e) {
                    storageType = 'cookie';
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());



            // Directly adds a value to local storage
            // If local storage is not available in the browser use cookies
            // Example use: localStorageService.add('library','angular');
            var addToLocalStorage = function(key, value) {
                // Let's convert undefined values to null to get the value consistent
                if (isUndefined(value)) {
                    value = null;
                } else if (isObject(value) || isArray(value) || isNumber(+value || value)) {
                    value = toJson(value);
                }

                // If this browser does not support local storage use cookies
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: 'cookie'
                        });
                    }
                    return addToCookies(key, value);
                }

                try {
                    if (isObject(value) || isArray(value)) {
                        value = toJson(value);
                    }
                    if (webStorage) {
                        webStorage.setItem(deriveQualifiedKey(key), value);
                    }
                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return addToCookies(key, value);
                }
                return true;
            };

            // Directly get a value from local storage
            // Example use: localStorageService.get('library'); // returns 'angular'
            var getFromLocalStorage = function(key) {

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return getFromCookies(key);
                }

                var item = webStorage ? webStorage.getItem(deriveQualifiedKey(key)) : null;
                // angular.toJson will convert null to 'null', so a proper conversion is needed
                // FIXME not a perfect solution, since a valid 'null' string can't be stored
                if (!item || item === 'null') {
                    return null;
                }

                if (item.charAt(0) === '{' || item.charAt(0) === '[' || isStringNumber(item)) {
                    return fromJson(item);
                }

                return item;
            };

            // Remove an item from local storage
            // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
            var removeFromLocalStorage = function(key) {
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: 'cookie'
                        });
                    }
                    return removeFromCookies(key);
                }

                try {
                    webStorage.removeItem(deriveQualifiedKey(key));
                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return removeFromCookies(key);
                }
                return true;
            };

            // Return array of keys for local storage
            // Example use: var keys = localStorageService.keys()
            var getKeysForLocalStorage = function() {

                if (!browserSupportsLocalStorage) {
                    $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    return false;
                }

                var prefixLength = prefix.length;
                var keys = [];
                for (var key in webStorage) {
                    // Only return keys that are for this app
                    if (key.substr(0, prefixLength) === prefix) {
                        try {
                            keys.push(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.Description);
                            return [];
                        }
                    }
                }
                return keys;
            };

            // Remove all data for this app from local storage
            // Also optionally takes a regular expression string and removes the matching key-value pairs
            // Example use: localStorageService.clearAll();
            // Should be used mostly for development purposes
            var clearAllFromLocalStorage = function(regularExpression) {

                regularExpression = regularExpression || '';
                //accounting for the '.' in the prefix when creating a regex
                var tempPrefix = prefix.slice(0, -1);
                var testRegex = new RegExp(tempPrefix + '.' + regularExpression);

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return clearAllFromCookies();
                }

                var prefixLength = prefix.length;

                for (var key in webStorage) {
                    // Only remove items that are for this app and match the regular expression
                    if (testRegex.test(key)) {
                        try {
                            removeFromLocalStorage(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                            return clearAllFromCookies();
                        }
                    }
                }
                return true;
            };

            // Checks the browser to see if cookies are supported
            var browserSupportsCookies = (function() {
                try {
                    return $window.navigator.cookieEnabled ||
                        ('cookie' in $document && ($document.cookie.length > 0 ||
                            ($document.cookie = 'test').indexOf.call($document.cookie, 'test') > -1));
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());

            // Directly adds a value to cookies
            // Typically used as a fallback is local storage is not available in the browser
            // Example use: localStorageService.cookie.add('library','angular');
            var addToCookies = function(key, value) {

                if (isUndefined(value)) {
                    return false;
                } else if (isArray(value) || isObject(value)) {
                    value = toJson(value);
                }

                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                try {
                    var expiry = '',
                        expiryDate = new Date(),
                        cookieDomain = '';

                    if (value === null) {
                        // Mark that the cookie has expired one day ago
                        expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                        expiry = '; expires=' + expiryDate.toGMTString();
                        value = '';
                    } else if (cookie.expiry !== 0) {
                        expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
                        expiry = '; expires=' + expiryDate.toGMTString();
                    }
                    if (!!key) {
                        var cookiePath = '; path=' + cookie.path;
                        if (cookie.domain) {
                            cookieDomain = '; domain=' + cookie.domain;
                        }
                        $document.cookie = deriveQualifiedKey(key) + '=' + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
                return true;
            };

            // Directly get a value from a cookie
            // Example use: localStorageService.cookie.get('library'); // returns 'angular'
            var getFromCookies = function(key) {
                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                var cookies = $document.cookie && $document.cookie.split(';') || [];
                for (var i = 0; i < cookies.length; i++) {
                    var thisCookie = cookies[i];
                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }
                    if (thisCookie.indexOf(deriveQualifiedKey(key) + '=') === 0) {
                        var storedValues = decodeURIComponent(thisCookie.substring(prefix.length + key.length + 1, thisCookie.length));
                        try {
                            var obj = JSON.parse(storedValues);
                            return fromJson(obj);
                        } catch (e) {
                            return storedValues;
                        }
                    }
                }
                return null;
            };

            var removeFromCookies = function(key) {
                addToCookies(key, null);
            };

            var clearAllFromCookies = function() {
                var thisCookie = null,
                    thisKey = null;
                var prefixLength = prefix.length;
                var cookies = $document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    thisCookie = cookies[i];

                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }

                    var key = thisCookie.substring(prefixLength, thisCookie.indexOf('='));
                    removeFromCookies(key);
                }
            };

            var getStorageType = function() {
                return storageType;
            };

            // Add a listener on scope variable to save its changes to local storage
            // Return a function which when called cancels binding
            var bindToScope = function(scope, key, def, lsKey) {
                lsKey = lsKey || key;
                var value = getFromLocalStorage(lsKey);

                if (value === null && isDefined(def)) {
                    value = def;
                } else if (isObject(value) && isObject(def)) {
                    value = extend(def, value);
                }

                $parse(key).assign(scope, value);

                return scope.$watch(key, function(newVal) {
                    addToLocalStorage(lsKey, newVal);
                }, isObject(scope[key]));
            };

            // Return localStorageService.length
            // ignore keys that not owned
            var lengthOfLocalStorage = function() {
                var count = 0;
                var storage = $window[storageType];
                for (var i = 0; i < storage.length; i++) {
                    if (storage.key(i).indexOf(prefix) === 0) {
                        count++;
                    }
                }
                return count;
            };

            return {
                isSupported: browserSupportsLocalStorage,
                getStorageType: getStorageType,
                set: addToLocalStorage,
                add: addToLocalStorage, //DEPRECATED
                get: getFromLocalStorage,
                keys: getKeysForLocalStorage,
                remove: removeFromLocalStorage,
                clearAll: clearAllFromLocalStorage,
                bind: bindToScope,
                deriveKey: deriveQualifiedKey,
                length: lengthOfLocalStorage,
                cookie: {
                    isSupported: browserSupportsCookies,
                    set: addToCookies,
                    add: addToCookies, //DEPRECATED
                    get: getFromCookies,
                    remove: removeFromCookies,
                    clearAll: clearAllFromCookies
                }
            };
        }];
    });
})(window, window.angular);
angular.module('LINDGE.Service.Params', [])

.service('queryString', ['$window', function ($window) {
    var params = {},
        i,
        pairFragments,
        keyValues;

    if ($window.location.search.length > 0) {
        pairFragments = $window.location.search.substr(1).split('&');

        for (i = 0; i < pairFragments.length; ++i) {
            if (pairFragments[i].indexOf('=') > -1) {
                keyValues = pairFragments[i].split('=');
                params[keyValues[0]] = keyValues[1];
                params[keyValues[0].toLowerCase()] = keyValues[1];
            } else {
                // only key
                params[pairFragments[i]] = null;
            }
        }
    }

    function getParam (name, forceDecode) {
        name = name.toLowerCase();
        var param = params[name];

        if (param === undefined) {
            return '';
        } else {
            return !!forceDecode ? decodeURIComponent(param) : param;
        }
    }

    function getAll () {
        return params;
    }

    return {
        get: getParam,
        getAll: getAll
    };
}]);
angular.module('LINDGE.Service.Path', [])
.service('path', [function() {
    var path = {};

    //获取拼接url
    path.combine = function() {
        return combine(arguments);
    };

    function combine(param) {
        if (param.length === 0) {
            return null;
        }

        var strList = [];
        var re = new RegExp('(^\\s*/)|(/\\s*$)', 'g');
        for (var i = 0; i < param.length; i++) {
            strList.push(param[i] ? param[i].replace(re, '') : '');
        }

        var result = strList.join('/');
        if (param[0] && param[0].charAt(0) == '/') {
            result = '/' + result;
        }

        return result;
    }

    return path;
}]);
angular.module('LINDGE.Service.TimingQueue', [])

.factory('TimingQueue', ['$timeout', '$q', function ($timeout, $q) {
    function TimingQueue (task, cond, span) {
        this._timer = null;
        this._stamp = -1;
        this._blockQueue = false;
        this._flag = false;
        this.blocked = false;

        if (typeof task == 'function'){
            this._task = task;
        } else {
            throw new TypeError('Invalid task callback');
        }

        this._cond = cond || null;
        this._run = null;
        this.threshold = 9000;
        this.interval = Number(span) || 1000;
    }

    TimingQueue.prototype._getTime = function() {
        return (new Date()).getTime();
    };

    TimingQueue.prototype._updateTime = function() {
        this._stamp = this._getTime();
    };

    TimingQueue.prototype.update = function() {
        this._flag = true;
    };

    TimingQueue.prototype._stampOverseeds = function() {
        if (this._stamp >= 0) {
            var current = this._getTime();
            var span = current - this._stamp;
            return span >= this.threshold;
        } else {
            return false;
        }
    };

    TimingQueue.prototype.clearStamp = function() {
        this._stamp = -1;
    };

    TimingQueue.prototype.start = function(block, checkUpdate) {
        this._blockQueue = !!block;
        this.blocked = false;
        var needCheck = !!this._cond;

        this._updateTime();

        var self = this;
        function run () {
            // run pre-condition:
            // 1. not blocked
            // 2. the state hasn't been updated within time threshold
            // 3. if a condition callback is given, its result should be true

            var isBlocked = self._blockQueue && self.blocked;
            var isUpdated = !checkUpdate || self._flag;
            if (!isBlocked && self._stampOverseeds() && isUpdated) {
                self._flag = false;
                if (!needCheck || self._cond()) {
                    if (self._blockQueue) {
                        self.blocked = true;
                        // create a defer to reset the blocking state
                        var defer = $q.defer();
                        defer.promise.finally(function () {
                            self.blocked = false;
                            self._updateTime();
                        });

                        self._task(defer);
                    } else {
                        self._task(null);
                        self._updateTime();
                    }
                }
            }

            self._timer = $timeout(run, self.interval);
        }

        this._run = run;
        this._timer = $timeout(run);
    };

    TimingQueue.prototype.flush = function() {
        if (this._timer) {
            $timeout.cancel(this._timer);
            this._timer = $timeout(this._run);

            this._flag = true;
            this._stamp = 100;
        }
    };

    TimingQueue.prototype.terminate = function() {
        if (this._timer) {
            $timeout.cancel(this._timer);
            this._run = null;
        }
    };

    return TimingQueue;
}]);
angular.module('LINDGE.Service.StateMachine', ['LINDGE.Service.SDK'])

.factory('StateMachine', ['$SDK', function ($SDK) {
    return $SDK.StateMachine.StateMachine;
}]);
angular.module('LINDGE.Service.Transition', [])

/**
 * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
.factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {
    var $transition = function(element, trigger, options) {
        options = options || {};
        var deferred = $q.defer();
        var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];

        var transitionEndHandler = function(event) {
            $rootScope.$apply(function() {
                element.unbind(endEventName, transitionEndHandler);
                deferred.resolve(element);
            });
        };

        if (endEventName) {
            element.bind(endEventName, transitionEndHandler);
        }

        // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
        $timeout(function() {
            if (angular.isString(trigger)) {
                element.addClass(trigger);
            } else if (angular.isFunction(trigger)) {
                trigger(element);
            } else if (angular.isObject(trigger)) {
                element.css(trigger);
            }
            //If browser does not support transitions, instantly resolve
            if (!endEventName) {
                deferred.resolve(element);
            }
        });

        // Add our custom cancel function to the promise that is returned
        // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
        // i.e. it will therefore never raise a transitionEnd event for that transition
        deferred.promise.cancel = function() {
            if (endEventName) {
                element.unbind(endEventName, transitionEndHandler);
            }
            deferred.reject('Transition cancelled');
        };

        return deferred.promise;
    };

    // Work out the name of the transitionEnd event
    var transElement = document.createElement('trans');
    var transitionEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'transition': 'transitionend'
    };
    var animationEndEventNames = {
        'WebkitTransition': 'webkitAnimationEnd',
        'MozTransition': 'animationend',
        'OTransition': 'oAnimationEnd',
        'transition': 'animationend'
    };

    function findEndEventName(endEventNames) {
        for (var name in endEventNames) {
            if (transElement.style[name] !== undefined) {
                return endEventNames[name];
            }
        }
    }
    $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
    $transition.animationEndEventName = findEndEventName(animationEndEventNames);
    return $transition;
}]);
}());