import { assert } from "chai";
import sinon from "sinon";

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

    it("should deny to set 'overflow' and 'overflowForward/Backward' options simultaneously", () => {
        const fn = () => iterator.pair({
            overflow: "loop",
            overflowForward: "backward"
        });

        assert.throws(fn, /at the same time/);
    });

    it("should use 'overflow' option for both direction", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            overflow: "loop"
        });
        const data = { val: 3, min: 0, max: 3 };
        assert.strictEqual(it.next(data), data.min);

        data.val = data.min;
        assert.strictEqual(it.prev(data), data.max);
    });

    it("should use 'overflowForward' and 'overflowBackward' option", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            overflowForward: "loop",
            overflowBackward: "snap"
        });
        const data = { min: 0, max: 3 };
        assert.strictEqual(it.next({ ...data, val: data.max }), data.min);
        assert.strictEqual(it.prev({ ...data, val: data.min }), data.min);
    });

    it("should deny to set 'format' and 'formatForward/Backward' options simultaneously", () => {
        const fn = () => iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            format: () => {},
            formatForward: () => {}
        });

        assert.throws(fn, /at the same time/);
    });

    it("should use 'formatForward' and 'formatBackward' option", () => {
        const formatForward = sinon.spy();
        const formatBackward = sinon.spy();

        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            formatForward,
            formatBackward
        });
        const data = { val: 0, min: 0, max: 3 };
        it.next(data);
        it.prev(data);
        assert.deepEqual(formatForward.firstCall.args[2], { forward: true });
        assert.deepEqual(formatBackward.firstCall.args[2], { forward: false });
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