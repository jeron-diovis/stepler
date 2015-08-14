const zero = () => 0;

// -----------

const findIndex = (val, list, criteria) => {
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

const iterator = options => {
    const { forward = true, loop = false, step = 1 } = options;

    const offset = Math.pow(-1, Number(!forward)) * step;

    const isOverflow = (val, max, min) => forward ? (val > max) : (val < min);

    const handleOverflow = (val, max, min) => loop ? (forward ? min : max) : (val - offset);

    return data => {
        const val = options.val(data) + offset;
        const max = options.max(data);
        const min = options.min ? options.min(data) : zero();
        const res = !isOverflow(val, max, min) ? val : handleOverflow(val, max, min);
        return options.format ? options.format(res, data) : res;
    };
};

iterator.list = options => {
    const next = iterator({...options,
        min: zero,
        max: data => options.list(data).length - 1,
        val: data => {
            const val = options.val(data);
            return findIndex(val, options.list(data), options.match);
        }
    });
    return data => options.list(data)[next(data)];
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