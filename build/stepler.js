"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var zero = function zero() {
    return 0;
};

// -----------

function findIndex(val, list, criteria) {
    if (typeof criteria !== "function") {
        return list.indexOf(val);
    }

    for (var i = 0; i < list.length; i++) {
        if (criteria(val, list[i])) {
            return i;
        }
    }
    return -1;
}

// -----------

var formatter = function formatter(options, fn) {
    return function (data) {
        var res = fn(data);
        return options.format ? options.format(res, data) : res;
    };
};

// -----------

var iterator = function iterator(options) {
    var _options$forward = options.forward;
    var forward = _options$forward === undefined ? true : _options$forward;
    var _options$loop = options.loop;
    var loop = _options$loop === undefined ? false : _options$loop;
    var _options$step = options.step;
    var step = _options$step === undefined ? 1 : _options$step;

    if (step < 0) {
        throw new Error("[stepler] Only positive values allowed for 'step' option (got '" + step + "'). To define direction use 'forward' option.");
    }

    var offset = Math.pow(-1, Number(!forward)) * step;

    return formatter(options, function (data) {
        var val = options.val(data);
        var next = val + offset;
        var max = options.max(data);
        var min = options.min ? options.min(data) : zero();
        var isOverflow = forward ? next > max : next < min;
        return !isOverflow ? next : !loop ? val : forward ? min : max;
    });
};

iterator.list = function (options) {
    if (options.step && Math.round(options.step) !== options.step) {
        throw new Error("[stepler] Fractional step size is not allowed for list iterator (got " + options.step + ")");
    }

    var next = iterator(_extends({}, options, {
        min: zero,
        max: function max(data) {
            return options.list(data).length - 1;
        },
        val: function val(data) {
            return findIndex(options.val(data), options.list(data), options.match);
        },
        format: null // don't format intermediate value (i.e. index)
    }));
    return formatter(options, function (data) {
        return options.list(data)[next(data)];
    });
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