### Fix AppKit image load lifecycle

AppKit images now release pending loads when their last view leaves, share
concurrent requests, and reject HTTP error payloads. Remote processing is queued
through AppKit's main operation queue. Cancelled completions cannot replace a
newer image or populate a later request's cache.

Image leaves also preserve declared parent-layout props, composed class names
and style forms. The optional image package reuses the core AppKit leaf; its
engine/cache APIs remain unimplemented. Runtime behavior remains unqualified.
See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).
