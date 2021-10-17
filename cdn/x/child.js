/* global Core, customElements */
Core.use(({ log }) => {
    customElements.define("x-child", class extends HTMLElement {
        connectedCallback() {
            this.appendChild(this.ownerDocument.createTextNode("Child"));
        }
    });
});
