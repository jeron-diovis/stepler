"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var zero = function zero() {
    return 0;
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
        return options.format ? options.format(res, data) : res;
    };
};

iterator.list = function (options) {
    var next = iterator(_extends({}, options, {
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

var paired = function paired(factory) {
    factory.pair = function (options) {
        return {
            prev: factory(_extends({}, options, { forward: false, loop: options.loopBackward })),
            next: factory(_extends({}, options, { forward: true, loop: options.loopForward }))
        };
    };
};

paired(iterator);
paired(iterator.list);

// -----------

exports["default"] = iterator;
module.exports = exports["default"];