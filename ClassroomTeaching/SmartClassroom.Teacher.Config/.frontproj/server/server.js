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
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/DeviceConfig/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create(
                {
                    IsRegisted:true,
                    RegistedInfo:{
                        RegistedIPAddress:'192.168.40.106',
                        Number:'2'
                    },
                    Devices:[
                        {
                            Number:'1',
                            Type:'TEACHER',
                            Name:'设备1',
                            IsRegisted:true
                        },
                        
                        {
                            Number:'2',
                            Type:'GROUP',
                            Name:'设备2',
                            IsRegisted:false
                        },
                        
                        
                        {
                            Number:'3',
                            Type:'GROUP',
                            Name:'设备3',
                            IsRegisted:false
                        },
                        
                        
                        {
                            Number:'4',
                            Type:'GROUP',
                            Name:'设备4',
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
                { AccountName : 'TestTeacher'}
            )
        }
    );
};