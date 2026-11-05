---
hype: 50
---

### Use bridged AppKit members without unexpected crashes

The macOS bridge no longer mislabels members as properties borrowed from subclasses. Members such as `NSView.autoscroll` now expose their declared methods instead of crashing on property access.

```js
const view = NSView.alloc().init()
typeof view.autoscroll // "function" — the real -[NSView autoscroll:]
```

When an object does not implement a bridged selector, the host now reports an ordinary JavaScript error that `try`/`catch` can handle instead of terminating the app with an uncaught native exception.

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
