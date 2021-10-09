(function (NAME, VERSION, window, factory, plugins) {
    "use strict";

    if (!Object.assign || !("Reflect" in window)) {
        throw new Error("I need a modern ES2015+ environment.");
    }

    const [core, extendWith] = factory(NAME, VERSION, window);
    for (const plugin of plugins) {
        extendWith(plugin);
    }
    window[NAME] = core;

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
        plugin(Sandbox, window);
    }

    return [Object.freeze(api), extendWith];

}, [
function loggingPlugin(Sandbox) {

    Sandbox.prototype.log = console.log;

},
function pubsubPlugin(Sandbox, window) {

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
]));

