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

    Sandbox.prototype.request = (url, options = {}) => {
        const {
            body = null,
            method = "GET",
            sync = false,
        } = options;

        let xhr = new XMLHttpRequest();
        xhr.addEventListener("progress", e => {
            if (!e.lengthComputable) {
                return;
            }
            const progress = e.loaded / e.total * 100;
            log("progress", progress);
        });
        xhr.addEventListener("load", () => {
            log("transfer complete");
        });
        xhr.addEventListener("error", () => {
            log("transfer failed");
        });
        xhr.addEventListener("abort", () => {
            log("transfer cancelled");
        });
        xhr.addEventListener("loadend", () => {
            log("The transfer finished (although we don't know if it succeeded or not).");
            xhr = null;
        });

        xhr.open(method, url, !sync);

        const api = {};
        api.subscribe = (fn) => {
            xhr.send(body);
            return () => {
                if (!xhr) {
                    return;
                }
                xhr.abort();
            };
        };

        return Object.freeze(api);
    };

},
]));

