const zero = () => 0;

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

const formatter = (options, fn) => data => {
    const res = fn(data);
    return options.format ? options.format(res, data) : res;
};

// -----------

const iterator = options => {
    const { forward = true, loop = false, step = 1 } = options;

    if (step < 0) { throw new Error(`[stepler] Only positive values allowed for 'step' option (got '${step}'). To define direction use 'forward' option.`); }

    const offset = Math.pow(-1, Number(!forward)) * step;

    const isOverflow = (val, max, min) => forward ? (val > max) : (val < min);

    const handleOverflow = (val, max, min) => loop ? (forward ? min : max) : (val - offset);

    return formatter(options, data => {
        const val = options.val(data) + offset;
        const max = options.max(data);
        const min = options.min ? options.min(data) : zero();
        return !isOverflow(val, max, min) ? val : handleOverflow(val, max, min);
    });
};

iterator.list = options => {
    const next = iterator({
        ...options,
        min: zero,
        max: data => options.list(data).length - 1,
        val: data => findIndex(options.val(data), options.list(data), options.match),
        format: null // don't format intermediate value (i.e. index)
    });
    return formatter(options, data => options.list(data)[next(data)]);
};

// -----------

const paired = factory => {
    factory.pair = options => ({
        prev: factory({...options, forward: false, loop: options.loopBackward }),
        next: factory({...options, forward: true,  loop: options.loopForward  })
    });
};

paired(iterator);
paired(iterator.list);

// -----------

export default iterator;