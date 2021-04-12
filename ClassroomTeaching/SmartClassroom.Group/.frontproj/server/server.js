const miniserver = require('mini-server-core');
const plugins = require('mini-server-plugins');

const HTTP_STATUS_CODE = miniserver.HTTP_STATUS_CODE;
const HTTP_METHODS = miniserver.HTTP_METHODS;

const JsonResponse = miniserver.JsonResponse;

const path = require('path');
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

    plugins.load('lindge-route-table')
    .loadDefaultRoute()
    .setRoute({
        'classroomteaching_interaction': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/',
        'classroomteaching_discussion': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Discussion/api/'
    })
    .active(runtime);

    // other configuration goes here
    plugins.load('lindge-figureconfig')
        .addConfigSection('DiscussType', [
            {
                "Code": "Brainstorming",
                "Name": "头脑风暴",
                "Entrance": "ClassroomTeaching.Brainstorming",
                "Size": "FULL_SCREEN"
            },
            {
                "Code": "Cooperation",
                "Name": "协作讨论",
                "Entrance": "ClassroomTeaching.Cooperation",
                "Size": "TOOLBAR"
            }
        ], false) 
    .active(runtime);

    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/api\/Application\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create([{
                ServiceName: 'classroom.groupScreen',
                DisplayName: '小组屏',
                ServiceEntry: 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/Environment'
            }]);
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/api\/TerminalData\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                UserData: {
                    LogonName: 'GROUP_A'
                }
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Environment\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                FigureConfigWebAPI: 'https://127.0.0.1:20429/Translayer/Figure.Config/api/',
                InteractionWebAPI: 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/'
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Logon\b/i,
        function (urlInfo, headers, body, parts) {
            return {
                code: HTTP_STATUS_CODE.noContent
            };
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.POST,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/GroupActivity\b/i,
        function (urlInfo, headers, body, parts) {
            var lessonActivity = fileAccessor.readJSON('lesson-activity.json');
            console.log('group activtiy post');
            return JsonResponse.create({
                IsReceiveBroadcast: lessonActivity.IsReceiveBroadcast,
                BroadcastUrl: lessonActivity.BroadcastUrl,
                IsDiscussing: lessonActivity.IsDiscussing,
                DiscussionInfo: lessonActivity.DiscussionInfo,
                SceneInfo: lessonActivity.SceneInfo
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/GroupActivity\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {          
            var lessonActivity = fileAccessor.readJSON('lesson-activity.json');
            return JsonResponse.create({
                IsMarking: lessonActivity.IsMarking,
                IsReceiveScreenProjection: lessonActivity.IsReceiveScreenProjection
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Discussion\/api\/GroupDiscuss\/\b/i,
        function (urlInfo, headers, body, parts) {
            var lessonActivity = fileAccessor.readJSON('lesson-activity.json');
            return JsonResponse.create({
                DiscussboardId: 'DB_579AE3444FF84278BF27608A53E01BCF',
                Type: lessonActivity.DiscussionInfo.Type
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Mark\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                BehaviorId: 'BHS_3411006D951A4ACCAB0A670A940C3FE7'
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.DELETE,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Mark\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            return {
                code: HTTP_STATUS_CODE.noContent
            };
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Logon\b/i,
        function (urlInfo, headers, body, parts) {
            return {
                code: HTTP_STATUS_CODE.noContent
            };
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Cooperation\/api\/Environment/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                'FigureConfigWebAPI' :'https://127.0.0.1:20429/Translayer/Figure.Config/api/',
                'InteractionWebAPI': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/',
                'ScreenWebAPI': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Screen/api/'
            });
        }
    );
};