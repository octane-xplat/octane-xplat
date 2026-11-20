### Keep macOS hosts alive on large console.log calls

Diagnostic logging with more than eight arguments no longer crashes the AppKit JavaScriptCore host. Every argument now prints, and native verification runs that log variadic diagnostics complete normally instead of exiting on a corrupted read.

See the [macOS AppKit renderer](https://octane-xplat.goddardai.org/package-macos-appkit).
