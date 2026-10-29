### In-app document browsing on AppKit

Experimental AppKit webBrowser now has an owned WebKit window source path with
history, reload/stop, close controls and native page alert/confirm/prompt sheets. Add the package to the app and rebuild
the native host. Actual compilation, presentation and packaging remain
unqualified.

```ts
import { webBrowser } from '@octane-xplat/web-browser'
await webBrowser.openBrowser('https://docs.example.com')
webBrowser.dismissBrowser()
```

**Breaking change (macOS):** the external-browser fallback is removed. Missing or
failing native bridges return cancel. Use platform.openUrl for external launch.
The external-launch migration is explicit:

```ts
import { openUrl } from '@octane-xplat/platform'
openUrl('https://docs.example.com')
```

Opened reports presentation, not page load; advanced web/auth/download
flows remain outside this source subset. See the
[package guide](https://github.com/octane-xplat/octane-xplat/tree/main/packages/web-browser#experimental-appkit-subset).
