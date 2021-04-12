const url = require('url');
const fs = require('fs');

const { protocol, net } = require('electron');

const URL_PATTERN = /\/ui\/(?:.*\/)?((?:Framework|CDN|Translayer)\/.+)/i;


/**
 * config asset (/CDN, /Framework, /Translayer) request proxy
 *
 * @param {Object} opts
 */
function configAssetProxy(opts) {
    if (!opts) {
        throw new Error('opts is null');
    }

    protocol.interceptStreamProtocol('file', (request, callback) => {
        var urlInfo = url.parse(request.url);

        var match = URL_PATTERN.exec(urlInfo.path);
        if (match) {
            var subpath = match[1];
            var req = net.request(`${opts.protocol}://${opts.serverAddress}/${subpath}`);

            if (request.header) {
                Object.keys(request.header).forEach(attr => {
                    req.setHeader(attr, request.header[attr]);
                });
            }

            // get rid of internal and server side cache
            req.setHeader('Cache-Control', 'no-cache');

            req.on('response', rsp => {
                callback(rsp);
            });

            req.on('error', err => {
                callback({ error: err });
            });

            req.end();
        } else {
            var filepath = urlInfo.pathname;
            if (filepath.charAt(0) == '/') {
                filepath = filepath.substr(1);
            }

            callback({
                data: fs.createReadStream(filepath)
            });
        }
    });
}

module.exports.configAssetProxy = configAssetProxy;