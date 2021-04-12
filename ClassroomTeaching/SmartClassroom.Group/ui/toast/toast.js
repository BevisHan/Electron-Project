(function()
{
'use strict';

const { ipcRenderer } = require('electron');

const INIT_EVENT = 'toast-init';
const ACTION_EVENT = 'toast-action';
const RESIZE_EVENT = 'toast-resize';

var rootElm = document.getElementById('root');

function getMessageType () {
    var search = window.location.search;
    if (search.charAt(0) == '?') {
        search = search.substr(1);
    }

    var parts = search.split('&');
    if (parts.length > 0) {
        for (let part of parts) {
            let kv = part.split('=');
            if (kv.length > 1) {
                let key = decodeURIComponent(kv[0]);
                let value = decodeURIComponent(kv[1]);

                if (key == 'type') {
                    return value;
                }
            }
        }

        return '';
    } else {
        return '';
    }
}

function loadContent (type, opt) {
    var headerElm = document.getElementById('header');
    var bodyElm = document.getElementById('body');
    var iconElm = document.getElementById('icon');

    headerElm.innerText = opt.header;
    bodyElm.innerText = opt.body;
    iconElm.className = ('lic ' + opt.icon);

    var rect = rootElm.getBoundingClientRect();

    ipcRenderer.send(RESIZE_EVENT, [rect.width, rect.height]);
}

function init () {
    var msgType = getMessageType();

    rootElm.setAttribute('type', msgType);

    rootElm.onclick = function () {
        ipcRenderer.send(ACTION_EVENT);
    };

    ipcRenderer.on(INIT_EVENT, (evt, opt) => {
        loadContent(msgType, opt);
    });
}

init();

}());