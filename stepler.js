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
const has = (obj, key) => obj.hasOwnProperty(key);

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
const formatResult = (val, options, ...args) => resolveOptional(val, options, "format", val, ...args);

// -----------

const OVERFLOW_STOP = "stop";
const OVERFLOW_LOOP = "loop";
const OVERFLOW_SNAP = "snap";

const handleOverflow = (opt, next, val, forward, min, max, data) => {
    if (typeof opt === "function") {
        return opt(next, data, { forward, max, min, val });
    }

    switch (opt) {
        case OVERFLOW_STOP:
            return val;
        case OVERFLOW_LOOP:
            return forward ? min : max;
        case OVERFLOW_SNAP:
            return forward ? max : min;
        default:
            throw new Error(`[stepler] Unknown value for 'overflow' option: '${opt}'`);
    }
};

// -----------

const iterator = options => {
    options = { ...options }; // clone

    const { overflow = OVERFLOW_STOP } = options;

    return data => {
        const step = getStep(options, data);
        const val = getVal(options, data);
        const max = resolveRequired(options, "max", data);
        const min = resolveOptional(0, options, "min", data);
        const forward = step > 0;
        const next = val + step;
        const isOverflow = forward ? (next > max) : (next < min);

        // Consider calling overflow function as a kind of exception - don't apply formatting.
        if (isOverflow && typeof overflow === "function") {
            return overflow(next, data, { forward, max, min, val });
        }

        return formatResult(
            !isOverflow ? next : handleOverflow(overflow, next, val, forward, min, max, data),
            options, data, { forward }
        );
    };
};

iterator.list = options => {
    const { overflow } = options;
    let hasOverflow = false;
    let isForward = false;

    const next = iterator({
        ...options,
        min: 0,
        max: data => getList(options, data).length - 1,
        val: data => findIndex(
          getVal(options, data),
          getList(options, data),
          options.match
        ),
        format: (val, data, { forward }) => {
            isForward = forward;
            // don't format intermediate value (i.e. index)
            return val;
        },
        overflow: typeof overflow !== "function"
            ? overflow
            : (...args) => {
                hasOverflow = true;
                return overflow(...args);
            },
        step: (...args) => {
            const step = getStep(options, ...args);
            if (Math.round(step) !== step) {
                throw new Error(`[stepler] Fractional step size is not allowed for list iterator (got ${step})`);
            }
            return step;
        }
    });

    return data => {
        hasOverflow = false;
        isForward = false;

        const nextIdx = next(data);
        const list = getList(options, data);
        const nextItem = list[nextIdx];

        return hasOverflow ? nextItem : formatResult(nextItem, options, data, { forward: isForward });
    };
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

        if (has(options, "overflow") && (has(options, "overflowForward") || has(options, "overflowBackward"))) {
            throw new Error("[stepler] It's not allowed to use at the same time options 'overflow' and 'overflowBackward' / 'overflowForward'");
        }

        if (has(options, "format") && (has(options, "formatForward") || has(options, "formatBackward"))) {
            throw new Error("[stepler] It's not allowed to use at the same time options 'format' and 'formatBackward' / 'formatForward'");
        }

        return {
            prev: factory({
                ...options,
                step: negate(step),
                overflow: options.overflowBackward || options.overflow,
                format: options.formatBackward || options.format
            }),
            next: factory({
                ...options,
                step: step,
                overflow: options.overflowForward || options.overflow,
                format: options.formatForward || options.format
            })
        }
    };
};

paired(iterator);
paired(iterator.list);

// -----------

iterator.OVERFLOW_STOP = OVERFLOW_STOP;
iterator.OVERFLOW_LOOP = OVERFLOW_LOOP;
iterator.OVERFLOW_SNAP = OVERFLOW_SNAP;

export default iterator;