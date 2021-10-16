/* global Core, customElements */

Core.use(({ log, publish, subscribe }) => {

    class Base extends HTMLElement {}

    const lens = () => {};
    const attr = name => ({ $: lens, t: attr, name });
    const prop = name => ({ $: lens, t: prop, name });

    function define(tag, decl) {
        const { ...userDecls } = decl;

        const observedAttributes = [];
        const attrs = new Map();
        const props = new Map();

        class Component extends Base {
            static get observedAttributes() {
                return observedAttributes;
            }
            constructor(...args) {
                log("Component.constructor", ...args);
                super(...args);

                this.__store__ = new Map();
                for (const [key, { name }] of attrs.entries()) {
                    Object.defineProperty(this, key, {
                        get() {
                            const value = this.getAttribute(name) ?? null;
                            log("  Component.attr", key, ".get", value);
                            this.__store__.set(key, value);
                            return value;
                        },
                        set(value) {
                            const old = this.__store__.get(key);
                            if (old === value) {
                                return;
                            }
                            log("  Component.attr", key, ".set", value);
                            this.__store__.set(key, value);
                            this.setAttribute(name, value);
                        }
                    });
                }
                for (const [key, _] of props.entries()) {
                    Object.defineProperty(this, key, {
                        get() {
                            const value = this.__store__.get(key);
                            log("  Component.prop", key, ".get", value);
                            return value;
                        },
                        set(value) {
                            log("  Component.prop", key, ".set", value);
                            this.__store__.set(key, value);
                        }
                    });
                }
            }
            connectedCallback() {
                log("Component.connectedCallback:before");
                this.componentDidMount();
                this.render();
                log("Component.connectedCallback:after", "store", this.__store__);
            }
            disconnectedCallback(...args) {
                log("Component.disconnectedCallback", ...args);
                this.componentDidUnmount(this);
            }
            attributeChangedCallback(name, old, value) {
                log("Component.attributeChangedCallback", name, old, value);
                this[name] = value;
            }
            adoptedCallback(...args) {
                log("Component.adoptedCallback", ...args);
            }
        }

        for (const [key, value] of Object.entries(userDecls)) {
            if (value.$ === lens) {
                if (value.t === attr) {
                    observedAttributes.push(value.name);
                    attrs.set(key, value);
                }
                if (value.t === prop) {
                    props.set(key, value);
                }
                continue;
            }
            Component.prototype[key] = value;
        }

        customElements.define(tag, Component);
    }

    subscribe("did-mount", yesno => alert(`did-mount ${yesno}`));

    define("x-experiment", {
        name: attr("name"),
        value: prop("value"),

        componentDidMount() {
            log("  x-experiment.componentDidMount", this);
            this.value = "a value from componentDidMount";
            publish("did-mount", true);
        },
        componentDidUnmount() {
            log("  x-experiment.componentDidUnmount", this);
            publish("did-mount", false);
        },
        render() {
            log("  x-experiment.render", this);
            this.appendChild(this.ownerDocument.createTextNode(`Experimental ${this.name}`));
        },
    });

});
