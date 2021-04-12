const miniserver = require('mini-server-core');
const plugins = require('mini-server-plugins');

const JsonResponse = miniserver.JsonResponse;

const HTTP_STATUS_CODE = miniserver.HTTP_STATUS_CODE;
const HTTP_METHODS = miniserver.HTTP_METHODS;

const path = require('path');
const devRoot = path.join(process.cwd(), '../..');
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
        'classroomteaching_lessonreport': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.LessonReport/api/',
        'classroomteaching_authorization': 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Authorization/api/'
    })
    .active(runtime);

    plugins.loadSingleton('lindge-casualstream')
    .setStorageRoot(fileAccessor.getPath('upload'))
    .active(runtime);
    
    // other configuration goes here
    runtime.registerEXHandler(
        HTTP_METHODS.PUT,
        /\/api\/Application\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create([{
                ServiceName: 'classroom.teacherScreen',
                DisplayName: '教师屏',
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
                    LogonName: 'teacher'
                }
            });
        }
    );    
    
    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/Figure\.Config\/json\/routetable\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                bank_casualstream: 'http://127.0.0.1:20429/Translayer/Bank.CasualStream/',
                classroomteaching_interaction: 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/',
                classroomteaching_lessonreport: 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.LessonReport/api/',
                classroomteaching_authorization: 'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Authorization/api/'
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/Environment\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                FigureConfigWebAPI: 'https://127.0.0.1:20429/Translayer/Figure.Config/api/',
                InteractionWebAPI:'http://127.0.0.1:20429/Translayer/ClassroomTeaching.Interaction/api/'
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
        HTTP_METHODS.PUT,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/TeachingLesson\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                SceneId: 'SCENE_931B623189CF482CB4E5C4146588032D',
                LessonId: 'L_AC192ACC5CCA4F9DA4A0A8C4E7433469'
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.DELETE,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/TeachingLesson\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            return {
                code: HTTP_STATUS_CODE.noContent
            };
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.POST,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/TeachingLesson\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            return {
                code: HTTP_STATUS_CODE.noContent
            };
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/TeachingLesson\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                SceneId: 'SCENE_931B623189CF482CB4E5C4146588032D',
                LessonId: 'L_AC192ACC5CCA4F9DA4A0A8C4E7433469',
                Name: '临时教学班',
                HasScene: true,
                IsActive: true
            });
        }
    );

    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Interaction\/api\/LessonActivity\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            var activity = fileAccessor.readJSON('lesson-activity.json');
            return JsonResponse.create(activity);
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
        /\/Translayer\/ClassroomTeaching\.LessonReport\/api\/LessonRecord\/(.+)\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                RecordId: '3'
            });
        }
    );
    
    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/License\b/i,
        function (urlInfo, headers, body, parts) {
            return JsonResponse.create({
                IsSuccess: true,
                Error: '许可证异常'
            });
        }
    );
    
    runtime.registerEXHandler(
        HTTP_METHODS.GET,
        /\/Translayer\/ClassroomTeaching\.Authorization\/api\/AuthorizedModule\b/i,
        function (urlInfo, headers, body, parts) {
            var AuthorizedModuleInfos = fileAccessor.readJSON('authorized-module.json');
            return JsonResponse.create(AuthorizedModuleInfos);
        }
    );
};