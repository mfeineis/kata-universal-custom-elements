/* global Core, customElements */

Core.use(({ log }) => {

    class Base extends HTMLElement {
        
    }

    function define(name, factory) {
        customElements.define(name, factory(Base));
    }

    define("x-experiment", Base => class extends Base {
        static get observedAttributes() {
            return ["who"];
        }
        constructor(...args) {
            log("x-experiment.constructor", ...args);
            super();
        }
        connectedCallback(...args) {
            log("x-experiment.connectedCallback", ...args);
            this.appendChild(this.ownerDocument.createTextNode(`Experimental ${this._who}`));
        }
        disconnectedCallback(...args) {
            log("x-experiment.disconnectedCallback", ...args);
        }
        attributeChangedCallback(...args) {
            log("x-experiment.attributeChangedCallback", ...args);
        }
        adoptedCallback(...args) {
            log("x-experiment.adoptedCallback", ...args);
        }

        get _who() {
            return this.getAttribute("who") ?? "World";
        }
    });

});
