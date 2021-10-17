/* global Core, customElements */
Core.use(({ log, publish, subscribe, request }) => {


    subscribe("did-mount", async yesno => {
        const req = request.json("https://anapioficeandfire.com/api/characters/583");
        req.subscribe(([ev, data]) => {
            log("request.json().1", [ev, data]);
            switch (ev) {
                case "progress":
                    break;
                case "error":
                    break;
                case "done":
                    req.subscribe((...args) => {
                        log("request.json().1.2", ...args);
                    });
                    break;
            }
        });

        request.document("/index.html").subscribe(([ev, data]) => {
            log("request.document().subscribe()", [ev, data]);
        });

        const data = await request("https://anapioficeandfire.com/api/characters/581");
        log("await request()", data);

        const jonsnow = await request.json("https://anapioficeandfire.com/api/characters/583");
        log("await request.json()", jonsnow);

        const css = await request.text("/cdn/styles.css");
        log("await request.text()", css.slice(0, 50), "...");
    });


    customElements.define("x-requester", class extends HTMLElement {
        connectedCallback() {
            publish("did-mount", true);
        }
    });
});
