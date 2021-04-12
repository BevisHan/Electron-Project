const sizeConfig = {
    _sidebarWidth: 80,
    _foldSidebarHeight: 80,
    _controlbarHeight: 80,
    _toolbarWidth: 375,
    _toolbarHeight: 250,
    _briefContentWidth: 375,
    _briefContentHeight: 295,
    _reviewSidebarWidth: 375
};
const typeConstant = {
    sidebar: 'SIDEBAR',
    main: 'MAIN',
    toolbar: 'TOOLBAR',
    brief: 'BRIEF',
    review: 'REVIEW'
};
const sizeConstant = {
    main: {
        fullScreen: 'FULL_SCREEN',
        controlbar: 'CONTROLBAR'
    },
    review: {
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

const calculateMethod = {
    addition: 'ADDITION',
    center: 'CENTER',
    mix: 'MIX'
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
        calculateHeightMethod: calculateMethod.addition,
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
        calculateYMethod: calculateMethod.addition,
        y: -(sizeConfig._foldSidebarHeight + 70)
    },
    MAIN_FULL_SCREEN: {
        isNeedCalculateWidth: true,
        calculateWidthMethod: calculateMethod.addition,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: true,
        calculateHeightMethod: calculateMethod.addition,
        height: 0,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: false,
        y: 0
    },
    MAIN_CONTROLBAR: {
        isNeedCalculateWidth: true,
        calculateWidthMethod: calculateMethod.addition,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: false,
        height: sizeConfig._controlbarHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: true,
        calculateYMethod: calculateMethod.addition,
        y: -sizeConfig._controlbarHeight
    },
    TOOLBAR: {
        isNeedCalculateWidth: false,
        width: sizeConfig._toolbarWidth,
        isNeedCalculateHeight: false,
        height: sizeConfig._toolbarHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth + 10,
        isNeedCalculateY: true,
        calculateYMethod: calculateMethod.addition,
        y: -(sizeConfig._toolbarHeight + 10 + sizeConfig._controlbarHeight)
    },
    BRIEF_CONTENT: {
        isNeedCalculateWidth: false,
        width: sizeConfig._briefContentWidth,
        isNeedCalculateHeight: false,
        height: sizeConfig._briefContentHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth + 10,
        isNeedCalculateY: true,
        calculateYMethod: calculateMethod.addition,
        y: -(sizeConfig._briefContentHeight + 10 + sizeConfig._controlbarHeight)
    },
    BRIEF_CARD: {
        isNeedCalculateWidth: false,
        width: 150,
        isNeedCalculateHeight: false,
        height: 150,       
        isNeedCalculateX: true,
        calculateXMethod: calculateMethod.mix,
        x: -75,
        isNeedCalculateY: true,
        calculateYMethod: calculateMethod.mix,
        y: -200
    },
    REVIEW_FULL_SCREEN: {
        isNeedCalculateWidth: true,
        calculateWidthMethod: calculateMethod.addition,
        width: -sizeConfig._sidebarWidth,
        isNeedCalculateHeight: true,
        calculateHeightMethod: calculateMethod.addition,
        height: -sizeConfig._controlbarHeight,
        isNeedCalculateX: false,
        x: sizeConfig._sidebarWidth,
        isNeedCalculateY: false,
        y: 0
    },
    REVIEW_SIDEBAR: {
        isNeedCalculateWidth: false,
        width: sizeConfig._reviewSidebarWidth,
        isNeedCalculateHeight: true,
        calculateHeightMethod: calculateMethod.addition,
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
module.exports.CALCULATE_METHOD = calculateMethod;