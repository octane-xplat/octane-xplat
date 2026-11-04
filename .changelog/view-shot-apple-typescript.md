### View capture needs no native rebuild on iOS and macOS

`@octane-xplat/view-shot` no longer ships Swift capture engines. The iOS and native macOS backends call UIKit and AppKit directly from TypeScript through the host's Objective-C bridge, so installing or updating the package works with a JavaScript-only refresh — no plugin rebuild is needed on Apple hosts. Android still ships its Java bridge and still requires a rebuild.

The API, formats, limits and error behavior are unchanged, and capture output is now runtime-verified on both Apple platforms.

See [capture an app view](https://octane-xplat.goddardai.org/package-view-shot).
