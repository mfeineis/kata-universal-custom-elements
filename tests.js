if (typeof module === "object" && module.exports) {
    module.exports = tests;
}

function tests(describe, it, expect, Lib) {
    "use strict";
    
    describe("the test harness", () => {
        it("provides a 'describe' function to describe a feature", () => {
            expect(typeof it).toBe("function");
        });
        it("provides an 'it' function to group assertions for a certain aspect of a feature", () => {
            expect(typeof it).toBe("function");
        });
        it("provides an 'expect' function to make assertions", () => {
            expect(typeof expect).toBe("function");
        });
        describe("the 'expect' API", () => {
            it("provides a 'toBe' method", () => {
                expect(true).toBe(true);
            });
            it("provides a 'not.toBe' method", () => {
                expect(false).not.toBe(true);
            });

            it("provides a 'toHaveLength' method", () => {
                expect([1, 2, 3]).toHaveLength(3);
            });
            it("provides a 'not.toHaveLength' method", () => {
                expect([1, 2]).not.toHaveLength(3);
            });

            it("provides a 'toBeUndefined' method", () => {
                expect(void 0).toBeUndefined();
            });
            it("provides a 'not.toBeUndefined' method", () => {
                expect("definitely not undefined").not.toBeUndefined();
            });
            
            it("provides a 'toEqual' method", () => {
                expect({ a: "message" }).toEqual({ a: "message" });
            });
            it("provides a 'not.toEqual' method", () => {
                expect({ a: "message" }).not.toEqual({ another: "message" });
            });
        });
    });

    describe(`the library (${Lib})`, () => {
        it("is exported as a global function named 'Lib'", () => {
            expect(typeof Lib).toBe("function");
        });
        it("provides a 'use' function to open a sandboxed scope", () => {
            let sandbox = void 0;
            Lib.use(sbx => sandbox = sbx);

            expect(sandbox).not.toBeUndefined();
        });
        describe("the sandbox API provided to a 'use' callback", () => {
            let sandbox;
            Lib.use(sbx => sandbox = sbx);

            it("has a 'log' function", () => {
                expect(typeof sandbox.log).toBe("function");
            });
            it("has a publish/subscribe API", () => {
                expect(typeof sandbox.publish).toBe("function");
                expect(typeof sandbox.subscribe).toBe("function");

                const unsub = sandbox.subscribe("channel", data => {});
                unsub();

                expect(typeof unsub).toBe("function");
            });
        });
    });
}

