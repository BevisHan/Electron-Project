const miniserver = require('mini-server-core');

const HTTP_STATUS_CODE = miniserver.HTTP_STATUS_CODE;
const HTTP_METHODS = miniserver.HTTP_METHODS;

const JsonResponse = miniserver.JsonResponse;
/**
 * context { runtime, fileAccessor }
 */
module.exports = function (context) {
    const runtime = context.runtime;
    const fileAccessor = context.fileAccessor;
    // logger filtering
    runtime.logger.addFilter(/favicon/i);

    // CDN files
    runtime.registerProxyHandler(HTTP_METHODS.GET, /CDN\/(.+)/, 'http://devfront.corp.lindge.com/CDN/{0}');
    // Framework files
    runtime.registerProxyHandler(HTTP_METHODS.GET, /Framework\/(.+)/, 'http://devfront.corp.lindge.com/Framework/{0}');
    // global clock
    runtime.registerProxyHandler(HTTP_METHODS.GET, /Translayer\/Figure\.Config\/ServerTime\/global_init_time/,
        'http://devfront.corp.lindge.com/Translayer/Figure.Config/ServerTime/global_init_time');
    // system config
    runtime.registerProxyHandler(HTTP_METHODS.GET, /\/SystemConfig\.js/i, 'http://devfront.corp.lindge.com/dev/resource/SystemConfig.js');

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/ServerConfig/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create(
                {
                    ServerIPAddress:'192.168.40.106',
                    LicenseFileName:'C:/asd.txt',
                    WifiSSID:'teacherPlan',
                    WifiPassword:'1234567',
                    Devices:[
                        {
                            Number:'1',
                            Type:'TEACHER',
                            Name:'设备1',
                            IsRegisted:false,
                            RegistedIPAddress:'192.168.40.106',
                            Enabled:false
                        }
                    ]
                }
            );
        }
    );
    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/ServerConfig/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create(
                { code : 200 }
            );
        }
    );
    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/DeviceConfig/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create(
                {
                    IsRegisted:true,
                    RegistedInfo:{
                        RegistedIPAddress:'192.168.41.86',
                        Number:'1'
                    },
                    Devices:[
                        {
                            Number:'1',
                            Type:'TEACHER',
                            Name:'设备1',
                            IsRegisted:false
                        }
                    ]
                }
            );
        }
    );
    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/DeviceConfig/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create(
                { code : 200}
            )
        }
    );
};