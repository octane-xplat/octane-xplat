---
hype: 25
---

### Launch-screen control needs no native rebuild on iOS

`@octane-xplat/splash-screen` no longer ships an iOS Swift bridge. The iOS backend now calls UIKit directly from TypeScript through NativeScript, so installing or updating the package works with a JavaScript-only refresh — no plugin rebuild is needed on iOS. Android still ships its Java bridge and still requires a rebuild.

The API, hold/fade/timeout behavior and error handling are unchanged.

See [keep the launch screen until startup is ready](https://octane-xplat.goddardai.org/package-splash-screen).
