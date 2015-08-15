import { assert } from "chai";

import iterator from "../stepler";

describe("basic", () => {

    var data;
    var opts;

    beforeEach(() => {
        data = { val: 1, min: 0, max: 3 };
        opts = {
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max
        };
    });

    afterEach(() => {
        data = null;
        opts = null;
    });

    it("should compute next value", () => {
        const next = iterator(opts);
        assert(next(data) === 2);
    });

    it("should compute prev value", () => {
        opts.forward = false;
        const next = iterator(opts);
        assert(next(data) === 0);
    });

    it("should not overflow limits", () => {
        data.val = data.max;
        assert(iterator(opts)(data) === data.max);

        opts.forward = false;
        data.val = data.min;
        assert(iterator(opts)(data) === data.min);
    });

    it("should loop if allowed", () => {
        opts.loop = true;

        data.val = data.max;
        assert(iterator(opts)(data) === data.min);

        opts.forward = false;
        data.val = data.min;
        assert(iterator(opts)(data) === data.max);
    });

    it("should require 'val' and 'max' options, and set 'min' to 0 by default", () => {
        const { val, max } = opts;
        const fn = () => iterator(opts)(data);

        opts.val = null;
        assert.throws(fn, /is not a function/);

        opts.val = val;
        opts.max = null;
        assert.throws(fn, /is not a function/);

        opts.max = max;
        opts.min = null;
        opts.forward = false;
        data.val = data.min;
        assert(iterator(opts)(data) === data.min);
    });

    it("should return formatted value", () => {
        opts.format = (v, data) => ({ result: v * 4, max: data.max });
        assert.deepEqual(iterator(opts)(data), { result: 8, max: 3 });
    });
});
