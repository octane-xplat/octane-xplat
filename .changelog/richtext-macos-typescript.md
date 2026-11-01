### Rich-text editing needs no native rebuild on macOS

`@octane-xplat/richtext` no longer ships a Swift leaf on macOS. The AppKit
backend creates the `WKWebView` editor document and its script-message and
navigation-policy channel directly from TypeScript through the host's
Objective-C bridge, so installing or updating the package works with a
JavaScript-only refresh — no plugin rebuild is needed on macOS. iOS, Android
and web are unchanged.

The editing surface, document isolation and error behavior are unchanged,
and the macOS backend is runtime-verified inside the real AppKit host across
the richtext, tiptap and lexical engine documents.

See [`@octane-xplat/richtext`](https://octane-xplat.goddardai.org/package-richtext).
