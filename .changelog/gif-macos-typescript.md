---
hype: 25
---

### Animated images need no native rebuild on macOS

`@octane-xplat/gif` no longer ships a Swift leaf on macOS. The AppKit backend creates the `NSImageView` surface, fit layout and remote/file/data source loading directly from TypeScript through the host's Objective-C bridge, so installing or updating the package works with a JavaScript-only refresh — no plugin rebuild is needed on macOS. iOS, Android and web are unchanged.

The API, fit/stretch behavior, visibility-gated animation, source replacement and error surfaces are unchanged, and the macOS backend is runtime-verified inside the real AppKit host including remote HTTP(S) installs.

See [`@octane-xplat/gif`](https://octane-xplat.goddardai.org/package-gif).
