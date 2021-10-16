/* global Core, customElements */

Core.use(() => {
    const baseUrl = "/cdn/x";
    const cache = new Map();

    // FIXME: Migrate to our custom element API once it's done
    customElements.define("x-requires", class extends HTMLElement {
        connectedCallback() {
            const doc = this.ownerDocument;
            const elements = this.getAttribute("elements") ?? "";
            for (const rawDep of elements.split(" ")) {
                const dep = rawDep.trim();
                if (cache.has(dep)) {
                    continue;
                }
                cache.set(dep, true);

                const node = doc.createElement("script");
                node.src = `${baseUrl}/${dep}.js`;
                node.defer = true;
                doc.querySelector("head").appendChild(node);
            }
        }
    });
});
