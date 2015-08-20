import { assert } from "chai";

import iterator from "../stepler";

describe("pairs", () => {

    it("should created paired iterators", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max
        });
        const basic_data = { val: 1, min: 0, max: 3 };
        assert.strictEqual(it.next(basic_data), 2);
        assert.strictEqual(it.prev(basic_data), 0);

        const lit = iterator.list.pair({
            val: ({ val }) => val,
            list: ({ letters }) => letters
        });
        const list_data = { val: "b", letters: [ "a", "b", "c" ] };
        assert.strictEqual(lit.next(list_data), "c");
        assert.strictEqual(lit.prev(list_data), "a");
    });

    it("should not accept 'overflow' option", () => {
        const fn = () => iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            overflow: "loop"
        });
        assert.throws(fn, /Option 'overflow' is not allowed for paired iterator/);
    });

    it("should use 'overflowForward' and 'overflowBackward' option", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            overflowForward: "loop",
            overflowBackward: "loop"
        });
        const data = { val: 3, min: 0, max: 3 };
        assert.strictEqual(it.next(data), data.min);

        data.val = data.min;
        assert.strictEqual(it.prev(data), data.max);
    });

    it("should use 'step' option for both directions", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            step: 2
        });
        const data = { val: 2, min: 0, max: 4 };
        assert.strictEqual(it.next(data), data.max);
        assert.strictEqual(it.prev(data), data.min);
    });

    it("should throw if negative step is defined", () => {
        const it = iterator.pair({
            step: () => -2
        });
        const fn = () => it.next();
        assert.throws(fn, /Negative step size is not allowed/);
    });
});