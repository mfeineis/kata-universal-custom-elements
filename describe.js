if (typeof module === "object") {
    module.exports = describe;
}

function describe(description, fn) {
    try {
        describe.log(description);
        describe.state.level += 1;
        fn();
    } catch (e) {
        describe.error(description);
        describe.error(e);
    } finally {
        describe.state.level -= 1;
    }
}
describe.state = {
    level: 1,
};
describe.log = function log(...args) {
    const indent = " ".repeat(describe.state.level);
    console.log(indent, ...args);
};
describe.error = function error(...args) {
    const indent = "  ".repeat(describe.state.level);
    console.error(indent, ...args);
};
describe.it = function it(description, fn) {
    try {
        describe.state.level += 1;
        fn();
        describe.log(description);
    } catch (e) {
        describe.error(description);
        describe.error(e);
    } finally {
        describe.state.level -= 1;
    }
};
describe.expect = function expect(actual) {
    const api = new describe.Expect(actual);
    api.not = new describe.Expect(actual, " not");
    api.not._op = a => !a;
    return api;
};
describe.Expect = function Expect(actual, not = "") {
    this._actual = actual;
    this._not = not;
};
describe.Expect.prototype._op = a => a;

// expect plugins
describe.Expect.prototype.toBe = function toBe(expected) {
    if (this._op(this._actual !== expected)) {
        throw new Error(`Expected ${this._actual}${this._not} to be ${expected}`);
    }
};
describe.Expect.prototype.toHaveLength = function toHaveLength(expected) {
    if (this._op(this._actual.length !== expected)) {
        throw new Error(`Expected ${this._actual}${this._not} to have length ${expected}`);
    }
};
describe.Expect.prototype.toBeUndefined = function toBeUndefined() {
    if (this._op(typeof this._actual !== "undefined")) {
        throw new Error(`Expected ${this._actual}${this._not} to be undefined`);
    }
};
describe.Expect.prototype.toEqual = function toEqual(expected) {
    const actualJson = JSON.stringify(this._actual, null, 2);
    const expectedJson = JSON.stringify(expected, null, 2);
    if (this._op(actualJson !== expectedJson)) {
        throw new Error(`Expected ${actualJson}${this._not} to equal ${expectedJson}`);
    }
};
