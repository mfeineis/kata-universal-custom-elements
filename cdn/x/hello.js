/* global Core, customElements */

Core.use(({ subscribe, publish }) => {

    subscribe("say-hello", who => {
        alert(`Hello, ${who}`);
    });

    customElements.define("x-hello", class extends HTMLElement {
        static get observedAttributes() {
            return ["who"];
        }
        connectedCallback() {
            this.appendChild(this.ownerDocument.createTextNode(`Hello, ${this._who}!`));
            this.addEventListener("click", this._sayHello);
        }
        disconnectedCallback() {
            this.removeEventListener("click", this._sayHello);
        }
        attributeChangedCallback(attr, oldValue, newValue) {
            
        }

        get _who() {
            return this.getAttribute("who") ?? "World";
        }
        _sayHello(who) {
            publish("say-hello", this._who);
        }
    });

});
