---
hype: 50
---

### Receive macOS native callbacks reliably

AppKit callbacks from background queues now reach JavaScript on the main thread. Previously, URL-session completions could never arrive, and operation or dispatch queues could remain stuck.

```js
const task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(url, (data, response, error) => {
  // Now fires — previously the request completed but this block never ran
  console.log(response.statusCode)
})
task.resume()
```

JavaScript-implemented delegate methods invoked from other threads now run on the JavaScript thread and return their result to the caller, instead of crashing the app.

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

Completion or decision-handler blocks passed into delegates now remain callable while JavaScript holds them. Saving a WebKit decision handler and calling it after the delegate returns previously did nothing or crashed.

```js
const Delegate = NSObject.extend(
  {
    webViewDecidePolicyForNavigationActionDecisionHandler(wv, action, handler) {
      pending = handler // Now safe to call later — previously it dangled
    },
  },
  { protocols: [WKNavigationDelegate] },
)
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
