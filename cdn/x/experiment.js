/* global Core, customElements */

Core.use(({ log, request, publish, subscribe }) => {

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
            async connectedCallback() {
                log("Component.connectedCallback:before");
                const task = this.componentDidMount();
                this.render();
                await task;
                log("Component.connectedCallback:beforeRender");
                this._removeChildren();
                this.render();
                log("Component.connectedCallback:afterRender");
                log("Component.connectedCallback:after", "store", this.__store__);
            }
            async disconnectedCallback(...args) {
                log("Component.disconnectedCallback", ...args);
                await this.componentDidUnmount(this);
            }
            attributeChangedCallback(name, old, value) {
                log("Component.attributeChangedCallback", name, old, value);
                this[name] = value;
            }
            adoptedCallback(...args) {
                log("Component.adoptedCallback", ...args);
            }

            _removeChildren() {
                this.innerHTML = "";
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

    define("x-experiment", {
        name: attr("name"),
        value: prop("value"),

        async componentDidMount() {
            log("  x-experiment.componentDidMount", this);
            this.value = "a value from componentDidMount";
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 2000);
            });
        },
        componentDidUnmount() {
            log("  x-experiment.componentDidUnmount", this);
        },
        render() {
            log("  x-experiment.render", this);
            this.appendChild(this.ownerDocument.createTextNode(`Experimental ${this.name}`));
        },
    });

});
