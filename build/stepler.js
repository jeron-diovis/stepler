"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var zero = function zero() {
    return 0;
};

var clone = function clone(obj, ext) {
    return Object.assign({}, obj, ext);
};

// -----------

var findIndex = function findIndex(val, list, criteria) {
    if (typeof criteria !== "function") {
        return list.indexOf(val);
    }

    for (var i = 0; i < list.length; i++) {
        if (criteria(val, list[i])) {
            return i;
        }
    }
    return -1;
};

// -----------

/**
 * const data = { value: 2, min: 0, max: 3, labels: [ "a", "b", "c", "d" ] }
 * const opts = {
 *  val: ({ value }) => value,
 *  min: ({ min }) => min,                  // optional
 *  max: ({ max }) => max,
 *  res: (idx, { labels }) => labels[idx]   // optional
 * });
 * const next = iterator(opts);
 * next(data) // => "d"
 *
 * data.value = 3;
 * next(data) // => "d"
 *
 * opts.loop = true;
 * iterator(opts)(data); // => "a"
 *
 * opts.forward = false;
 * iterator(opts)(data); // => "c"
 */
var iterator = function iterator(options) {
    var _options$forward = options.forward;
    var forward = _options$forward === undefined ? true : _options$forward;
    var _options$loop = options.loop;
    var loop = _options$loop === undefined ? false : _options$loop;
    var _options$step = options.step;
    var step = _options$step === undefined ? 1 : _options$step;

    var offset = Math.pow(-1, Number(!forward)) * step;

    var isOverflow = function isOverflow(val, max, min) {
        return forward ? val > max : val < min;
    };

    var handleOverflow = function handleOverflow(val, max, min) {
        return loop ? forward ? min : max : val - offset;
    };

    return function (data) {
        var val = options.val(data) + offset;
        var max = options.max(data);
        var min = options.min ? options.min(data) : zero();
        var res = !isOverflow(val, max, min) ? val : handleOverflow(val, max, min);
        return options.res ? options.res(res, data) : res;
    };
};

/**
 * var data = { value: "c", labels: [ "a", "b", "c", "d" ] }
 * const opts = {
 *   val: ({ value }) => value,
 *   list: ({ labels }) => labels
 * }
 * iterator.list(opts)(data) // => "d"
 *
 * data = { value: { foo: "c" }, labels: [ { val: "a" }, { val: "b" }, { val: "c" }, { val: "d" } ] }
 * opts.match = (next, item) => next.foo === item.val
 * iterator.list(opts)(data) // => "d"
 */
iterator.list = function (options) {
    var next = iterator(clone(options, {
        min: zero,
        max: function max(data) {
            return options.list(data).length - 1;
        },
        val: function val(data) {
            var val = options.val(data);
            return findIndex(val, options.list(data), options.match);
        }
    }));
    return function (data) {
        return options.list(data)[next(data)];
    };
};

// -----------

/**
 * const data = { value: "c", labels: [ "a", "b", "c", "d" ] }
 *
 * const opts = {
 *   val: ({ value }) => value,
 *   list: ({ labels }) => labels
 * }
 *
 * const letters = iterator.list.pair(opts);
 *
 * letters.next(data) // => "d"
 * letters.prev(data) // => "b"
 */
var paired = function paired(factory) {
    factory.pair = function (options) {
        return {
            prev: factory(clone(options, { forward: false, loop: options.loopBackward })),
            next: factory(clone(options, { forward: true, loop: options.loopForward }))
        };
    };
};

/**
 * Make iterator which returns some predefined data structure instead of just next value.
 *
 * const data = { value: "c", labels: [ "a", "b", "c", "d" ] }
 *
 * const opts = {
 *   val: ({ value }) => value,
 *   list: ({ labels }) => labels
 * }
 *
 * const struct = (valueFromIterator, originData) => ({
 *   next: valueFromIterator,
 *   prev: originData.value,
 *   total: originData.labels.length
 * })
 *
 * const nextLetter = iterator.list.format(struct, opts);
 *
 * nextLetter(data) // => { next: "d", prev: "c", total: 4 }
 * // Same for "next" / "prev" of paired iterators
 */
var formattable = function formattable(factory) {
    var decorate = function decorate(fn, next) {
        return function (data) {
            return fn(next(data), data);
        };
    };

    factory.format = function (fn, options) {
        return decorate(fn, factory(options));
    };

    factory.pair.format = function (fn, options) {
        var iterator = factory.pair(options);
        var res = {};
        Object.keys(iterator).forEach(function (key) {
            res[key] = decorate(fn, iterator[key]);
        });
        return res;
    };
};

paired(iterator);
paired(iterator.list);
formattable(iterator);
formattable(iterator.list);

// -----------

exports["default"] = iterator;
module.exports = exports["default"];