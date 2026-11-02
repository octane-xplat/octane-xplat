### Video playback needs no native rebuild on macOS

`@octane-xplat/video` no longer ships a Swift leaf on macOS. The AppKit
backend drives `AVPlayer` and `AVPlayerLayer` directly from TypeScript
through the host's Objective-C bridge, so installing or updating the
package works with a JavaScript-only refresh — no plugin rebuild is
needed on macOS. iOS, Android and web are unchanged.

The API, transport controls, source handling, callbacks and error
behavior are unchanged, and the macOS backend is runtime-verified inside
the real AppKit host.

See [`@octane-xplat/video`](https://octane-xplat.goddardai.org/package-video).
