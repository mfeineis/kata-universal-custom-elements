/* global Core, customElements */
customElements.define("x-configure", class extends HTMLElement {
    connectedCallback() {
        Core.config(function (Y) {
            Y.log("Core.config", Y);
            const request = Y.request;
            return {
                mode: "develop",
                plugins: {
                    somePlugin: function (expose) {
                    },
                },
                on: {
                    "core:error": function (error) {
                        request.touch("https://error.track.er", {
                            params: error,
                        });
                    },
                },
                hooks: {
                    log: function decorator() {},
                    publish: function publish(channel, data) {},
                    subscribe: function subscribe(channel, handler) {},
                },
            };
        });

        Core.use(function () {
            // Uncaught error sends a pulse on "core:error"
            does.not.compute();
        });
    }
});
