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

#### Looping

```js
const data = { value: 3, min: 0, max: 3 }
const opts = {
  val: ({ value }) => value,
  max: ({ max }) => max
});

const next = stepler(opts);
next(data) // => 3

opts.loop = true;
stepler(opts)(data); // => 0
```

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