### Keep Apple sign-in attached to its macOS window

Native AppKit Apple sign-in now keeps its initiating window and request options,
retires the attempt when that window closes and guards stale controller results.
A partial native anchor-registration failure can retry. Native cancellation is
requested when available (macOS 13+); actual consent and callback behavior remain
unqualified.

```ts
import { appleAuth } from '@octane-xplat/auth'
const result = await appleAuth.signIn({ scopes: ['email'] })
```

See [Apple presenter ownership](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#keep-apple-sign-in-with-its-initiating-window).
