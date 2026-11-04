### macOS apps no longer crash when the system calls JS delegate methods on other threads

On macOS, an Objective-C method implemented in JavaScript — a delegate or `NSObject.extend` member — crashed the app when the system invoked it on a spawned thread or background queue instead of the main thread. The bundled native runtime now delivers those method callbacks on the JavaScript thread and waits for the return value, so delegates the system calls from other threads (like `NSPrintOperation`'s `didRun`) work instead of terminating the process.

```js
const Delegate = NSObject.extend(
  {
    didRun: function (success) {
      // Now runs on the main thread even when AppKit invokes it on the
      // spawned print thread — previously the process crashed here.
    },
  },
  { exposedMethods: { didRun: { returns: interop.types.void } } },
)
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
