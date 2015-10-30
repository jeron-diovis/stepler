"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function resolve(obj, prop) {
    var val = obj[prop];

    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
    }

    return typeof val !== "function" ? val : val.apply(undefined, args);
}

function resolveRequired(obj, prop) {
    var val = resolve.apply(undefined, arguments);
    if (val == null) {
        throw new Error("[stepler] Required option '" + prop + "' is missed");
    }
    return val;
}

function resolveOptional(defaultVal) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
    }

    var val = resolve.apply(undefined, args);
    return val != null ? val : defaultVal;
}

var negate = function negate(fn) {
    return function () {
        return fn.apply(undefined, arguments) * -1;
    };
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

var getStep = function getStep(options) {
    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
    }

    return resolveOptional.apply(undefined, [1, options, "step"].concat(args));
};
var getList = function getList(options) {
    for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
    }

    return resolveRequired.apply(undefined, [options, "list"].concat(args));
};
var getVal = function getVal(options) {
    for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
    }

    return resolveRequired.apply(undefined, [options, "val"].concat(args));
};

// -----------

var OVERFLOW_STOP = "stop";
var OVERFLOW_LOOP = "loop";
var OVERFLOW_SNAP = "snap";

var handleOverflow = function handleOverflow(opt, next, val, forward, min, max, data) {
    if (typeof opt === "function") {
        return opt(next, data, { forward: forward, max: max, min: min, val: val });
    }

    switch (opt) {
        case OVERFLOW_STOP:
            return val;
        case OVERFLOW_LOOP:
            return forward ? min : max;
        case OVERFLOW_SNAP:
            return forward ? max : min;
        default:
            throw new Error("[stepler] Unknown value for 'overflow' option: '" + opt + "'");
    }
};

// -----------

var formatter = function formatter(options, fn) {
    return function (data) {
        var res = fn(data);
        return options.format ? options.format(res, data) : res;
    };
};

// -----------

var iterator = function iterator(options) {
    options = _extends({}, options); // clone

    var _options = options;
    var _options$overflow = _options.overflow;
    var overflow = _options$overflow === undefined ? OVERFLOW_STOP : _options$overflow;

    return formatter(options, function (data) {
        var step = getStep(options, data);
        var val = getVal(options, data);
        var max = resolveRequired(options, "max", data);
        var min = resolveOptional(0, options, "min", data);
        var forward = step > 0;
        var next = val + step;
        var isOverflow = forward ? next > max : next < min;
        return !isOverflow ? next : handleOverflow(overflow, next, val, forward, min, max, data);
    });
};

iterator.list = function (options) {
    var next = iterator(_extends({}, options, {
        min: 0,
        max: function max(data) {
            return getList(options, data).length - 1;
        },
        val: function val(data) {
            return findIndex(getVal(options, data), getList(options, data), options.match);
        },
        format: null, // don't format intermediate value (i.e. index)
        step: function step() {
            for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                args[_key6] = arguments[_key6];
            }

            var step = getStep.apply(undefined, [options].concat(args));
            if (Math.round(step) !== step) {
                throw new Error("[stepler] Fractional step size is not allowed for list iterator (got " + step + ")");
            }
            return step;
        }
    }));
    return formatter(options, function (data) {
        return getList(options, data)[next(data)];
    });
};

// -----------

var paired = function paired(factory) {
    factory.pair = function (options) {
        var step = function step() {
            for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                args[_key7] = arguments[_key7];
            }

            var step = getStep.apply(undefined, [options].concat(args));
            if (step < 0) {
                throw new Error("[stepler] Negative step size is not allowed for paired iterator (got " + step + ")");
            }
            return Math.abs(step);
        };

        if (options.hasOwnProperty("overflow")) {
            throw new Error("[stepler] Option 'overflow' is not allowed for paired iterator (got '" + options.overflow + "'). Use overflowBackward / overflowForward instead.");
        }

        return {
            prev: factory(_extends({}, options, {
                step: negate(step),
                overflow: options.overflowBackward
            })),
            next: factory(_extends({}, options, {
                step: step,
                overflow: options.overflowForward
            }))
        };
    };
};

paired(iterator);
paired(iterator.list);

// -----------

iterator.OVERFLOW_STOP = OVERFLOW_STOP;
iterator.OVERFLOW_LOOP = OVERFLOW_LOOP;
iterator.OVERFLOW_SNAP = OVERFLOW_SNAP;

exports["default"] = iterator;
module.exports = exports["default"];