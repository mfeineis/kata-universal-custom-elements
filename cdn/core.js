/* global define, module */
(function (window, NAME, VERSION, factory, plugins) {
    "use strict";

    const lib = factory(NAME, VERSION, plugins, window, window.document);

    if (typeof define === "function" && define.amd) {
        define(NAME, [], function () {
            return lib;
        });
    } else if (typeof module === "object") {
        module.exports = lib;
    } else {
        window[NAME] = lib;
    }

}(self, "Core", "0.0.2", function (NAME, VERSION, plugins, window, document) {

    const freeze = Object.freeze;

    const api = function Core() {};
    api["version"] = VERSION;
    api["toString"] = function toString() {
        return "You are running " + NAME + "@" + VERSION;
    };

    function Sandbox() {
        return freeze(this);
    }
    delete Sandbox.prototype.constructor;

    api["use"] = function use(fn) {
        fn(new Sandbox());
    };

    api["config"] = function config(fn) {
        // FIXME: Make global configuration work
        const config = fn(new Sandbox());
    };

    function expose(name, it) {
        Sandbox.prototype[name] = it;
    }

    const env = {};
    env["window"] = window;
    env["document"] = document;
    expose("env", env);

    for (let plugin of plugins) {
        plugin(expose, new Sandbox(), api);
    }

    return freeze(api);

}, [
function pubsubPlugin(expose, Y) {

    expose("publish", publish);
    expose("subscribe", subscribe);

    const window = Y.env.window;

    // FIXME: Right now pubsub works within the same lib instance
    const prefix = ["LIB.PS", btoa(String(Math.random()))].join("").replace("=", "");
    const listeners = {};

    window.addEventListener("message", function (e) {
        if (e.origin !== window.origin) {
            return;
        }
        if (typeof e.data !== "object" || e.data.$ !== prefix) {
            return;
        }
        const channel = e.data.channel;
        const data = e.data.data;
        const channelListeners = listeners[channel] || [];
        for (let key in channelListeners) {
            const listener = channelListeners[key];
            try {
                listener(data);
            } catch (e) {
            }
        }
    });

    function publish(channel, data) {
        window.postMessage({ $: prefix, channel, data });
    }

    function subscribe(channel, fn) {
        if (!listeners[channel]) {
            listeners[channel] = [];
        }
        listeners[channel].push(fn);
        return function unsubscribe() {
            listeners[channel] = listeners[channel].filter(function (it) {
                return it !== fn;
            });
        };
    }

},
function eventPlugin(expose) {
    // FIXME: Design "event" plugin

    expose("addEvent", addEvent);

    function addEvent() {}

},
function loggingPlugin(expose, Y, Lib) {
    // FIXME: Finish "logging" plugin

    Lib["log"] = log;
    expose("log", log);

    const window = Y.env.window;
    const publish = Y.publish;

    function log() {
        return console.log.apply(console, arguments);
    }

    window.addEventListener("error", function (ev) {
        const error = {
            colno: ev.colno,
            filename: ev.filename,
            lineno: ev.lineno,
            message: ev.error.message,
            stack: ev.error.stack,
        };
        log("core:error", error, ev);
        publish("core:error", error);
    });

},
function requestPlugin(expose, Y) {
    // FIXME: Finish "request" plugin
    // TODO: "request.touch" via <img>.src GET in browser

    expose("request", request);

    const window = Y.env.window;

    const XMLHttpRequest = window.XMLHttpRequest;
    const log = Y.log;
    const publish = Y.publish;
    const subscribe = Y.subscribe;

    function mix(to) {
        const len = arguments.length;
        for (let i = 1; i < len; i += 1) {
            const from = arguments[i];
            for (let key in from) {
                to[key] = from[key];
            }
        }
        return to;
    }

    function request(url, options) {
        options = options || {};

        const body = options.body || null;
        const headers = options.headers || {};
        const method = options.method || "GET";
        const params = options.params || {};
        const responseType = options.responseType || "text";
        const sync = Boolean(options.sync);
        const timeout = options.timeout || 10 * 1000;
        const withCredentials = Boolean(options.withCredentials);

        let hasBeenSent = false;
        let isDone = false;
        let hasContentType = false;

        let listeners = [];
        let middleware = [];

        function pump(fn, rawData) {
            fn(middleware.reduce(
                function (acc, mw) {
                    return mw(acc);
                },
                rawData
            ));
        }
        function pumpMany(fns, rawData) {
            for (let key in listeners) {
                const listener = listeners[key];
                pump(listener, rawData);
                // FIXME: Error handling
            }
        }

        let xhr = new XMLHttpRequest();

        const q = Object.keys(params).map(function (key) {
            return key + "=" + encodeURIComponent(params[key]);
        }).join("&");
        const query = url.indexOf("?") >= 0 ? "&" + q : "?" + q;

        Object.keys(headers).forEach(function (key) {
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

        xhr.addEventListener("progress", function (e) {
            if (!e.lengthComputable) {
                return;
            }
            pumpMany(listeners, ["progress", {
                loaded: e.loaded,
                total: e.total,
                progress: e.loaded / e.total * 100,
            }]);
        });
        xhr.addEventListener("load", function () {
            responseStatus = xhr.status;
            responseStatusText = xhr.statusText;

            response = xhr.response;
            isDone = true;

            pumpMany(listeners, ["done", response]);
        });
        xhr.addEventListener("error", function (ev) {
            log("  xhr.error: transfer failed", ev);
            isDone = true;
            pumpMany(listeners, ["error", null]);
        });
        xhr.addEventListener("abort", function (ev) {
            log("  xhr.abort: transfer cancelled", ev);
            isDone = true;
            pumpMany(listeners, ["abort", null]);
        });
        xhr.addEventListener("loadend", function (ev) {
            //log("The transfer finished (although we don't know if it succeeded or not).", ...args);
            pumpMany(listeners, ["complete", {
                loaded: ev.loaded,
            }]);
            xhr = null;
            listeners = null;
        });

        xhr.timeout = timeout;
        xhr.addEventListener("timeout", function (ev) {
            log("xhr.timeout: transfer timed out", ev);
            pumpMany(listeners, ["timeout", null]);
        });

        xhr.responseType = responseType;
        if (withCredentials) {
            xhr.withCredentials = withCredentials;
        }

        xhr.open(method, q.length ? url + query : url, !sync);

        const api = {};
        // Our API is a Thenable so it can be `await`-ed
        api["then"] = function then(resolve, reject) {
            api.subscribe(function (chunk) {
                const ev = chunk[0];
                const data = chunk[1];
                if (ev === "done") {
                    resolve(data);
                }
                // FIXME: Error handling
            });
        };
        // TODO: Allow middleware?
        //push: function push(fn) {
        //    middleware.push(fn);
        //    return api;
        //},
        api["subscribe"] = function subscribe(fn) {
            if (isDone) {
                pump(fn, ["done", response]);
                // FIXME: Error handling
                return function () {};
            }
            listeners.push(fn);

            if (!hasBeenSent) {
                xhr.send(body);
                hasBeenSent = true;
            }
            return function unsubscribe() {
                listeners = listeners.filter(function (it) {
                    return it !== fn;
                });
                if (!xhr) {
                    return;
                }
                xhr.abort();
            };
        };

        return Object.freeze(api);
    };

    request["text"] = request;

    request["json"] = function requestJson(url, options) {
        return request(url, mix({}, options, {
            responseType: "json",
        }));
    };

    request["document"] = function requestDocument(url, options) {
        return request(url, mix({}, options, {
            responseType: "document",
        }));
    };

},
function browserPlugin(_, Y) {
    // FIXME: Finish "browser" plugin, does this even belong into the core?

    const document = Y.env.document;

    if (document.querySelector) {
        const html = document.querySelector("html");
        if (html.classList) {
            html.classList.remove("no-js");
        }
    }

},
]));

