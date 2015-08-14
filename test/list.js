import { assert } from "chai";

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
        assert(iterator(opts)(data) === "c");

        data.val = "c";
        assert(iterator(opts)(data) === "c");

        opts.loop = true;
        assert(iterator(opts)(data) === "a");

        opts.forward = false;
        data.val = "a";
        assert(iterator(opts)(data) === "c");
    });

    it("should format properly", () => {
        opts.format = v => v + "z";
        assert(iterator(opts)(data) === "cz");
    });

    // should we throw error instead?
    it("should swallow unexisting values", () => {
        data.val = "unexisting";
        assert(iterator(opts)(data) === "a");
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
        const fn = () => iterator(opts)(data);
        assert.throws(fn, /is not a function/);
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
});
