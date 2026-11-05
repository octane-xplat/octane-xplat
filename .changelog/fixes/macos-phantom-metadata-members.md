---
hype: 25
---

### Bridged AppKit members restored to their declared methods

On macOS, the bundled Objective-C metadata mislabeled a set of members as properties borrowed from a subclass — reading `autoscroll` on a plain `NSView` or `candidates` on any object crashed the app, and the real methods were unreachable. The metadata generator no longer derives a class's members from its descendants, so those members now surface as their declared methods.

```js
const view = NSView.alloc().init()
typeof view.autoscroll // "function" — the real -[NSView autoscroll:]
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
