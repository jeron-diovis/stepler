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

opts.step = -1;
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

#### Overflow
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

This can be changed with `overflow` option:
```js
opts.oveflow = stepler.OVERFLOW_LOOP;
stepler(opts)(data); // => 0

data.value = 2;
opts.step = 2 ;
opts.oveflow = stepler.OVERFLOW_SNAP;
stepler(opts)(data); // => 3

opts.overflow = function(overflowingValue, data, { val, min, max, forward }) {
  // something custom
};
```

**NOTE**, that with `OVERFLOW_LOOP` it returns `0`, not `1` (as you might thought, i.e. "current + step - max"). 
With this option it does not calculate remainder and does not take care about step size.
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
}
const next =  stepler.list(opts);
next(data) // => "d"
```
`min` and `max` options are denied for list iterator. They are internally set to `0` and `list.length - 1` respectively.
Fractional step size is also denied here, I'm sure you know why.


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

// there are separate options to handle overflow for paired iterator:
letters = stepler.list.pair({...opts, owerflowForward: stepler.OVERFLOW_LOOP, overflowBackward: stepler.OVERFLOW_STOP });
letters.next({...data, value: "d" }) // => "a"
letters.prev({...data, value: "a" }) // => "a"
```
Negative step size is denied for paired iterators, to be sure that `next` goes forward and `prev` goes backward.


## Constant and dynamic

All options, except of `overflow`, can be defined either as functions or as contants.
So you can, for example, create iterator with dynamic step:
```js
const opts = {
   min: 0,
   max: 42,
   val: () => this.someCurrentValue,
   step: v => v
}
const next = stepler(opts);
next(someStepValue);
```
