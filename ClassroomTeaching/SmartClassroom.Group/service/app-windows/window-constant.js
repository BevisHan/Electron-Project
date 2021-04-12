const sizeConfig = {
    _sidebarWidth: 80,
    _foldSidebarHeight: 80,
    _controlbarHeight: 80,
    _discussSidebarWidth: 375
};
const typeConstant = {
    sidebar: 'SIDEBAR',
    main: 'MAIN',
    broadcast: 'BROADCAST',
    discuss: 'DISCUSS'
};
const sizeConstant = {
    main: {
        fullScreen: 'FULL_SCREEN',
        controlbar: 'CONTROLBAR'
    },
    discuss: {
        fullScreen: 'FULL_SCREEN',
        sidebar: 'SIDEBAR'
    },
    siderbar: {
        fold: 'FOLD',
        unfold: 'UNFOLD'
    }
};
const loadTypeConstant = {
    url: 'URL',
    file: 'FILE'
};
/**
 * @description: 配置不同尺寸窗口工作区域,
 * key已type_size格式拼接而成(仅存在type时无_)
 * value中为width,height,x,y及其是否需要动态计算
 * 当isNeedCalculate为ture时，外部应根据需要，与提供的值相加(提供值存在负数)
 */
const workArea = {
    SIDEBAR_UNFOLD: {
        isNeedCalculateWidth: false,
        width: sizeConfig._sidebarWidth,
        isNeedCalculateHeight: true,
        height: 0,
        isNeedCalculateX: false,
        x: 0,
        isNeedCalculateY: false,
        y: 0
    },
    SIDEBAR_FOLD: {
        isNeedCalculateWidth: false,
        width: sizeConfig._sidebarWidth,
        isNeedCalculateHeight: false,
        height: sizeConfig._foldSidebarHeight,
        isNeedCalculateX: false,
        x: 0,
        isNeedCalculateY: true,
        y: -(sizeConfig._foldSidebarHeight + 70)
    },
    MAIN_FULL_SCREEN: {
        isNeedCalculateWidth: true,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: true,
        height: 0,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: false,
        y: 0
    },
    MAIN_CONTROLBAR: {
        isNeedCalculateWidth: true,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: false,
        height: sizeConfig._controlbarHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: true,
        y: -sizeConfig._controlbarHeight
    },
    BROADCAST: {
        isNeedCalculateWidth: true,
        width: 0,
        isNeedCalculateHeight: true,
        height: 0,
        isNeedCalculateX: false,
        x: 0,
        isNeedCalculateY: false,
        y: 0
    },
    DISCUSS_FULL_SCREEN: {
        isNeedCalculateWidth: true,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: true,
        height: 0,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: false,
        y: 0
    },
    DISCUSS_SIDEBAR: {
        isNeedCalculateWidth: false,
        width: sizeConfig._discussSidebarWidth,
        isNeedCalculateHeight: true,
        height: -sizeConfig._controlbarHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: false,
        y: 0
    }
};

module.exports.WINDOW_TYPES = typeConstant;
module.exports.WINDOW_SIZES = sizeConstant;
module.exports.WINDOW_LOAD_TYPES = loadTypeConstant;
module.exports.WINDOW_WORK_AREA = workArea;
module.exports.CAPTURE_SCREEN_AREA = {
    top: 0,
    left: sizeConfig._sidebarWidth,
    width: -sizeConfig._sidebarWidth,
    height: -sizeConfig._controlbarHeight
};