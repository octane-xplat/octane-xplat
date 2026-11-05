---
hype: 50
---

### macOS apps can safely call Objective-C handler blocks after the delegate returns

On macOS, an Objective-C completion or decision handler passed into a JavaScript-implemented delegate method — like a WebKit `decisionHandler` — was only valid during the delegate call itself. Saving the handler and calling it later silently did nothing or crashed the app with a memory fault. The bundled native runtime now keeps its own reference to the incoming block, so a stored handler stays callable for as long as JavaScript holds it.

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
