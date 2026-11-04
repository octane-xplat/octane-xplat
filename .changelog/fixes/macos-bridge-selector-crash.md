### Unsupported AppKit properties no longer crash macOS apps

On macOS, reading a bridged property an object does not implement — for example `autoscroll` on a plain `NSView` — terminated the whole app with an uncaught `NSInvalidArgumentException`, even inside a `try`/`catch`. The bundled metadata declared such members for hundreds of AppKit classes. The JavaScriptCore host now reports an unsupported selector as an ordinary JavaScript error you can catch.

```js
const view = NSView.alloc().init()
try {
  view.autoscroll // declared on NSView but only implemented by NSMatrix
} catch (error) {
  // "-[NSView isAutoscroll]: unrecognized selector sent to instance"
}
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
