import { assert } from "chai";
import sinon from "sinon";

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
        assert.strictEqual(iterator(opts)(data), 2);
    });


    it("should compute prev value", () => {
        opts.step = -1;
        assert.strictEqual(iterator(opts)(data), 0);
    });


    it("should allow to define step size", () => {
        opts.step = 2;
        assert(iterator(opts)(data) === 3);
    });


    it("should return formatted value", () => {
        opts.format = (v, data) => ({ result: v * 4, max: data.max });
        assert.deepEqual(iterator(opts)(data), { result: 8, max: 3 });
    });


    it("should pass direction to format function as last arg", () => {
        const spy = sinon.spy();
        opts.format = spy;
        iterator({ ...opts, step: 1 })(data);
        iterator({ ...opts, step: -1 })(data);
        assert.deepEqual(spy.firstCall.args[2], { forward: true });
        assert.deepEqual(spy.secondCall.args[2], { forward: false });
    });


    describe("overflow", () => {
        it("should not overflow limits by default", () => {
            data.val = data.max;
            assert.strictEqual(iterator(opts)(data), data.max, "Overflows limits moving forward");

            opts.step = -1;
            data.val = data.min;
            assert.strictEqual(iterator(opts)(data), data.min, "Overflows limits moving backward");
        });

        it("should loop", () => {
            opts.overflow = "loop";

            data.val = data.max;
            assert.strictEqual(iterator(opts)(data), data.min);

            opts.step = -1;
            data.val = data.min;
            assert.strictEqual(iterator(opts)(data), data.max);
        });

        it("should snap", () => {
            opts.overflow = "snap";
            opts.step = 2;

            data.val = data.max - 1;
            assert.strictEqual(iterator(opts)(data), data.max);

            data.val = data.max;
            assert.strictEqual(iterator(opts)(data), data.max);

            opts.step = -2;
            data.val = data.min + 1;
            assert.strictEqual(iterator(opts)(data), data.min);
        });

        it("should support functions", () => {
            opts.step = 1;

            const spy = sinon.spy();

            opts.overflow = spy;

            data.val = data.max;
            iterator(opts)(data);

            assert(spy.calledOnce);
            assert(spy.calledWith(data.val + 1, data));
            assert.strictEqual(spy.args[0].length, 3);
            assert.deepEqual(spy.args[0][2], {
                val: data.val,
                forward: true,
                max: data.max,
                min: data.min
            });
        });

        it("should NOT apply 'format' to overflowing result if 'overflow' is a function", () => {
            const overflowingResult = {};
            const overflowHandler = sinon.spy(() => overflowingResult);
            const formatHandler = sinon.spy();

            data.val = data.max;
            const res = iterator({ ...opts, overflow: overflowHandler, format: formatHandler })(data);

            assert.isFalse(formatHandler.called);
            assert.equal(res, overflowingResult);
        });

        it("should throw", () => {
            data.val = data.max;
            opts.overflow = "invalid";
            assert.throws(() => iterator(opts)(data), /Unknown value for 'overflow' option/);
        });
    });


    describe("configuring", () => {
        it("should require 'val' and 'max' options, and set 'min' to 0 by default", () => {
            const { val, max } = opts;
            const fn = () => iterator(opts)(data);
            const re = /Required option .* is missed/;

            opts.val = null;
            assert.throws(fn, re, "Option 'val' is not required");

            opts.val = val;
            opts.max = null;
            assert.throws(fn, re, "Option 'max' is not required");

            opts.max = max;
            opts.min = null;
            opts.step = -1;
            data.val = data.min;
            assert.strictEqual(iterator(opts)(data), data.min, "Option 'min' isn't set to 0 by default");
        });

        it("should allow to define options both as values and functions", () => {
            opts = { val: 1, min: 0, max: 3, step: 1 };
            Object.keys(data).forEach(key => {
                assert.strictEqual(iterator(opts)(), 2);

                const val = opts[key];
                opts[key] = () => val;
                assert.strictEqual(iterator(opts)(), 2);
            });
        });
    });

});
