### Keep macOS sign-in attached to its starting window

Native AppKit authentication sessions now keep the initiating window as their
presentation anchor and cancel when that window closes. Callback options are
captured per attempt, so later mutation cannot change the expected scheme.
Actual system-browser and callback behavior remains unqualified.

```ts
import { authSession } from '@octane-xplat/platform'
const result = await authSession.open('https://example.com/authorize', {
	callbackScheme: 'myapp',
})
```

See [AppKit sign-in ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-sign-in-window-ownership).
