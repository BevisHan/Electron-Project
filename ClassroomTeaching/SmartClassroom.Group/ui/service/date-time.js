(function ()
{
'use strict';

angular.module('Shell.ClassroomTeaching.SmartClassroom.DateTimeFormat', [
])

.service('dateTime', [function () {
    this.getNow = function () {
        var date = new Date();
        var hour = date.getHours();
        var minute = date.getMinutes();
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        var dateTime = {
            time: `${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}`,
            date: `${date.getMonth() + 1}月${date.getDate()}日`,
            day: days[date.getDay()]
        };
        return dateTime;
    };
}]);

}());