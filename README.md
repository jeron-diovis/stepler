# Stepler

Define iteration rules for certain data structure and compute next step value from input data.

## Basics

```js
const data = { value: 2, min: 0, max: 3 }
const opts = {
  val: ({ value }) => value, // required. Get current value from your data structure.
  max: ({ max }) => max,  // required
  min: ({ min }) => min      // optional, default to 0
});

const next = stepler(opts);
next(data) // => 3

opts.forward = false;
stepler(opts)(data); // => 1
```

#### Step size
Default step size is 1, which can be changed:
```js
const data = { value: 1, min: 0, max: 3 }
const opts = {
  val: ({ value }) => value,
  max: ({ max }) => max,
  step: 2
});

const next = stepler(opts);
next(data) // => 3
```

Defining negative step size is denied:
```js
stepler({...opts, step: -1 }) // throws error
```
To change direction use a `forward` option.

Fractional step size is allowed for simple iterator, and not allowed for lists.

#### Looping
By default, if new value will overflow defined bounds, an old value will be returned:
```js
const data = { value: 3, min: 0, max: 3 }
const opts = {
  val: ({ value }) => value,
  max: ({ max }) => max
});

const next = stepler(opts);
next(data) // => 3
```

This can be changed with `loop` option:
```js
opts.loop = true;
stepler(opts)(data); // => 0
```

**NOTE**, that it returns `0`, not `1` (as you might thought, i.e. "current + step - max"). 
It does not calculate remainder and does not take care about step size.
Just *"if new value exceeds limit, start from the opposite end"*.

#### Formatting

```js
const data = { value: 2, min: 0, max: 3, labels: [ "a", "b", "c", "d" ] }
const opts = {
  val: ({ value }) => value,
  max: ({ max }) => max,
  format: (idx, { labels }) => labels[idx] 
});

const next = stepler(opts);
next(data) // => "d"
```

## Lists

There is a helper to work with arrays. 
It searches for next allowed index and returns array value at that index.

```js
const data = { value: "c", labels: [ "a", "b", "c", "d" ] }
const opts = {
  val: ({ value }) => value,
  list: ({ labels }) => labels // required. Get list to iterate over from your data structure
  // `min` and `max` options are ignored. They are set to `list.length - 1` and `0` respectively
}
const next =  stepler.list(opts);
next(data) // => "d"
```

#### Custom matcher
```js
const data = { 
  value: { foo: "c" }, 
  labels: [ { bar: "a" }, { bar: "b" }, { bar: "c" }, { bar: "d" } ] 
}
const opts = {
  val: ({ value }) => value,
  list: ({ labels }) => labels,
  match: (next, item) => next.foo === item.bar
};
const next =  stepler.list(opts);
next(data) // => { bar: "d" }
```

## Two directions

```js
const data = { value: "c", labels: [ "a", "b", "c", "d" ] }
const opts = {
  val: ({ value }) => value,
  list: ({ labels }) => labels
}
const letters = stepler.list.pair(opts);
letters.next(data) // => "d"
letters.prev(data) // => "b"

// there are separate options to enable looping for paired iterators:
letters = stepler.list.pair({...opts, loopForward: true, loopBackward: true });
letters.next({...data, value: "d" }) // => "a"
letters.prev({...data, value: "a" }) // => "d"
```