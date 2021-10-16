/* global Core, customElements */

Core.use(({ publish, subscribe }) => {

    subscribe("say-hello", who => {
        alert(`Hello, ${who}`);
    });

    customElements.define("x-hello", class extends HTMLElement {
        static get observedAttributes() {
            return ["who"];
        }
        connectedCallback() {
            const button = this.ownerDocument.createElement("button");
            button.type = "button";
            button.appendChild(this.ownerDocument.createTextNode(`Hello, ${this._who}!`));
            button.addEventListener("click", (e) => this._sayHello(e));
            this._button = button;

            const div = this.ownerDocument.createElement("div");
            div.classList.add("border");
            div.classList.add("p-1");
            div.appendChild(button);

            this.appendChild(div);
        }
        disconnectedCallback() {
            this._button.removeEventListener("click", this._sayHello);
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
