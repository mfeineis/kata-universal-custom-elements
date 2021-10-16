(function (NAME, VERSION, window, factory, plugins) {
    "use strict";

    if (!Object.assign || !("Reflect" in window)) {
        throw new Error("I need a modern ES2015+ environment.");
    }

    const [lib, extendWith] = factory(NAME, VERSION, window);
    for (const plugin of plugins) {
        extendWith(plugin);
    }

    const sealed = Object.freeze(lib);
    if (typeof module === "object") {
        module.exports = sealed;
    } else {
        window[NAME] = sealed;
    }

}("Core", "0.0.1", self, function (NAME, VERSION, window) {

    const api = function Lib() {};
    api.version = VERSION;
    api.toString = () => `You are running ${NAME}@${VERSION}`;

    function Sandbox() {}
    delete Sandbox.prototype.constructor;

    api.use = function use(fn) {
        const sandbox = Object.freeze(new Sandbox());
        fn(sandbox);
    };

    function extendWith(plugin) {
        plugin(Sandbox, window, api);
    }

    return [api, extendWith];

}, [
function pubsubPlugin(Sandbox, window) {

    // FIXME: Right now pubsub works within the same lib instance
    const prefix = `LIB.PS${btoa(String(Math.random()))}`.replace("=", "");
    const listeners = {};

    window.addEventListener("message", function (e) {
        if (e.origin !== window.origin) {
            return;
        }
        if (typeof e.data !== "object" || e.data.$ !== prefix) {
            return;
        }
        const { channel, data } = e.data;
        for (const listener of listeners[channel] ?? []) {
            try {
                listener(data);
            } catch (e) {
            }
        }
    });

    Sandbox.prototype.publish = function publish(channel, data) {
        window.postMessage({ $: prefix, channel, data });
    };

    Sandbox.prototype.subscribe = function subscribe(channel, fn) {
        if (!listeners[channel]) {
            listeners[channel] = [];
        }
        listeners[channel].push(fn);
        return () => {
            listeners[channel] = listeners[channel].filter(it => it !== fn);
        };
    };

},
function loggingPlugin(Sandbox, _, Core) {

    Core.log = console.log;
    Sandbox.prototype.log = console.log;

},
function requestPlugin(Sandbox, window) {
    // FIXME: Finish "request" plugin
    const { XMLHttpRequest } = window;
    const { log, publish, subscribe } = new Sandbox();

    Sandbox.prototype.request = request;

    function request(url, options = {}) {
        const {
            body = null,
            headers = {},
            method = "GET",
            params = {},
            responseType = "text",
            sync = false,
            timeout = 10 * 1000,
            withCredentials = false,
        } = options;

        let hasBeenSent = false;
        let isDone = false;
        let hasContentType = false;

        let listeners = [];
        let middleware = [];

        function pump(fn, rawData) {
            try {
                const data = middleware.reduce(
                    (acc, mw) => mw(acc),
                    rawData
                );
                fn(data);
            } catch (e) {
                // FIXME: Error handling
                console.error(e);
            }
        }

        let xhr = new XMLHttpRequest();

        const q = Object.keys(params).map((key) => {
            return key + "=" + encodeURIComponent(params[key]);
        }).join("&");
        const query = url.indexOf("?") >= 0 ? "&" + q : "?" + q;

        Object.keys(headers).forEach((key) => {
            if (/^content-type/i.test(key)) {
                hasContentType = true;
            }
            xhr.setRequestHeader(key, headers[key]);
        });

        if (!hasContentType && body !== null && typeof body === "object") {
            xhr.setRequestHeader(
                "Content-Type", "application/json; charset=utf-8"
            );
        }

        let response = null;
        let responseStatus = null;
        let responseStatusText = null;

        xhr.addEventListener("progress", e => {
            if (!e.lengthComputable) {
                return;
            }
            const progress = e.loaded / e.total * 100;
            log("  xhr.progress", progress, e);
        });
        xhr.addEventListener("load", (...args) => {
            //log("xhr.onload", xhr);
            const isDocument = responseType === "document";
            responseStatus = xhr.status;
            responseStatusText = xhr.statusText;

            response = xhr.response;

            //log("transfer complete", ...args);
            isDone = true;

            for (const listener of listeners) {
                pump(listener, response);
            }
        });
        xhr.addEventListener("error", (...args) => {
            log("  xhr.error: transfer failed", ...args);
        });
        xhr.addEventListener("abort", (...args) => {
            log("  xhr.abort: transfer cancelled", ...args);
        });
        xhr.addEventListener("loadend", (...args) => {
            //log("The transfer finished (although we don't know if it succeeded or not).", ...args);
            xhr = null;
            listeners = null;
        });

        xhr.timeout = timeout;
        xhr.addEventListener("timeout", (...args) => {
            log("xhr.timeout: transfer timed out", ...args);
        });

        xhr.responseType = responseType;
        if (withCredentials) {
            xhr.withCredentials = Boolean(withCredentials);
        }

        xhr.open(method, q.length ? url + query : url, !sync);

        const api = {
            // Our API is a Thenable so it can be `await`-ed
            then(resolve, reject) {
                api.subscribe((data) => {
                    resolve(data);
                    // FIXME: Error handling
                });
            },
            // TODO: Allow middleware?
            //push: function push(fn) {
            //    middleware.push(fn);
            //    return api;
            //},
        };
        api.subscribe = (fn) => {
            if (isDone) {
                pump(fn, response);
                return () => {};
            }
            listeners.push(fn);

            if (!hasBeenSent) {
                xhr.send(body);
                hasBeenSent = true;
            }
            return () => {
                listeners = listeners.filter(it => it !== fn);
                if (!xhr) {
                    return;
                }
                xhr.abort();
            };
        };

        return Object.freeze(api);
    };

    request.text = request;

    request.json = (url, options = {}) => request(url, {
        ...options,
        responseType: "json",
    });

    request.document = (url, options = {}) => request(url, {
        ...options,
        responseType: "document",
    });

},
]));

