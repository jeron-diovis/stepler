import { assert } from "chai";
import sinon from "sinon";

import _iterator from "../stepler";
const iterator = _iterator.list;

describe("list", () => {

    var data;
    var opts;

    beforeEach(() => {
        data = { val: "b", letters: [ "a", "b", "c" ] };
        opts = {
            val: ({ val }) => val,
            list: ({ letters }) => letters
        };
    });

    afterEach(() => {
        data = null;
        opts = null;
    });

    it("should still work", () => {
        assert.strictEqual(iterator(opts)(data), "c");

        data.val = "c";
        assert.strictEqual(iterator(opts)(data), "c");

        opts.overflow = "loop";
        assert.strictEqual(iterator(opts)(data), "a");

        opts.step = -1;
        data.val = "a";
        assert.strictEqual(iterator(opts)(data), "c");
    });

    it("should format properly", () => {
        opts.format = v => v + "z";
        assert.strictEqual(iterator(opts)(data), "cz");
    });

    it("should pass direction to format function as last arg", () => {
        const spy = sinon.spy();
        opts.format = spy;
        iterator({ ...opts, step: 1 })(data);
        iterator({ ...opts, step: -1 })(data);
        assert.deepEqual(spy.firstCall.args[2], { forward: true });
        assert.deepEqual(spy.secondCall.args[2], { forward: false });
    });

    it("should NOT apply 'format' to overflowing result if 'overflow' is a function", () => {
        const overflowingResult = {};
        const overflowHandler = sinon.spy(() => overflowingResult);
        const formatHandler = sinon.spy();

        data.val = "c";
        const res = iterator({ ...opts, overflow: overflowHandler, format: formatHandler })(data);

        assert.isFalse(formatHandler.called);
        assert.equal(res, overflowingResult);
    });

    // should we throw error instead?
    it("should swallow unexisting values", () => {
        data.val = "unexisting";
        assert.strictEqual(iterator(opts)(data), "a");
    });

    it("should ignore 'max' and 'min' options", () => {
        const exception = () => { throw new Error("Test error"); };
        opts.max = exception;
        opts.min = exception;
        const fn = () => iterator(opts)(data);
        assert.doesNotThrow(fn);
    });

    it("should require 'list' option", () => {
        opts.list = null;
        const re = /Required option .* is missed/;
        const fn = () => iterator(opts)(data);
        assert.throws(fn, re);
    });

    it("should allow to set custom match criteria", () => {
        data.val = { foo: "a" };
        opts.match = ({ foo }) => foo;
        assert(iterator(opts)(data) === "b");

        // -----------

        data.letters = [
            { bar: "a" },
            { bar: "b" },
            { bar: "c" }
        ];

        opts.match = ({ foo }, { bar }) => foo === bar;
        assert.deepEqual(iterator(opts)(data), data.letters[1]);
    });

    it("should work with custom step size", () => {
        opts.step = 2;
        data.val = "a";
        assert.strictEqual(iterator(opts)(data), "c");
    });

    it("should not accept fractional step size", () => {
        opts.step = 0.5;
        const fn = () => iterator(opts)(data);
        assert.throws(fn, /Fractional step size is not allowed/);
    })
});
