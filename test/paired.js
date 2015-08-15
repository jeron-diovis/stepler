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
        assert(it.next(basic_data) === 2);
        assert(it.prev(basic_data) === 0);

        const lit = iterator.list.pair({
            val: ({ val }) => val,
            list: ({ letters }) => letters
        });
        const list_data = { val: "b", letters: [ "a", "b", "c" ] };
        assert(lit.next(list_data) === "c");
        assert(lit.prev(list_data) === "a");
    });

    it("should ignore 'loop' option", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            loop: true
        });
        const data = { val: 3, min: 0, max: 3 };
        assert(it.next(data) === 3);
    });

    it("should use 'loopForward' and 'loopBackward' option", () => {
        const it = iterator.pair({
            val: ({ val }) => val,
            min: ({ min }) => min,
            max: ({ max }) => max,
            loopForward: true,
            loopBackward: true
        });
        const data = { val: 3, min: 0, max: 3 };
        assert(it.next(data) === data.min);

        data.val = data.min;
        assert(it.prev(data) === data.max);
    });

});