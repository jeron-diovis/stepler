function resolve(obj, prop, ...args) {
    const val = obj[prop];
    return typeof val !== "function" ? val : val(...args);
}

function resolveRequired(obj, prop) {
    const val = resolve(...arguments);
    if (val == null) {
        throw new Error(`[stepler] Required option '${prop}' is missed`);
    }
    return val;
}

function resolveOptional(defaultVal, ...args) {
    const val = resolve(...args);
    return val != null ? val : defaultVal;
}

const negate = fn => (...args) => fn(...args) * -1;

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

const getStep = (options, ...args) => resolveOptional(1, options, "step",...args);
const getList = (options, ...args) => resolveRequired(options, "list",...args);
const getVal = (options, ...args) => resolveRequired(options, "val",...args);

// -----------

const formatter = (options, fn) => data => {
    const res = fn(data);
    return options.format ? options.format(res, data) : res;
};

// -----------

const iterator = options => {
    options = { ...options }; // clone

    const { loop = false } = options;

    return formatter(options, data => {
        const step = getStep(options, data);
        const val = getVal(options, data);
        const max = resolveRequired(options, "max", data);
        const min = resolveOptional(0, options, "min", data);
        const forward = step > 0;
        const next = val + step;
        const isOverflow = forward ? (next > max) : (next < min);
        return !isOverflow ? next : (!loop ? val : (forward ? min : max));
    });
};

iterator.list = options => {
    const next = iterator({
        ...options,
        min: 0,
        max: data => getList(options, data).length - 1,
        val: data => findIndex(
          getVal(options, data),
          getList(options, data),
          options.match
        ),
        format: null, // don't format intermediate value (i.e. index)
        step: (...args) => {
            const step = getStep(options, ...args);
            if (Math.round(step) !== step) {
                throw new Error(`[stepler] Fractional step size is not allowed for list iterator (got ${step})`);
            }
            return step;
        }
    });
    return formatter(options, data => getList(options, data)[next(data)]);
};

// -----------

const paired = factory => {
    factory.pair = options => {
        const step = (...args) => {
            const step = getStep(options, ...args);
            if (step < 0) {
                throw new Error(`[stepler] Negative step size is not allowed for paired iterator (got ${step})`);
            }
            return Math.abs(step);
        };

        return {
            prev: factory({
                ...options,
                step: negate(step),
                loop: options.loopBackward
            }),
            next: factory({
                ...options,
                step: step,
                loop: options.loopForward
            })
        }
    };
};

paired(iterator);
paired(iterator.list);

// -----------

export default iterator;