### Keep macOS apps running when event monitors retire

The AppKit host no longer crashes when garbage collection releases removed keyboard or pointer event monitors. Native callback references now retire outside JavaScriptCore's garbage-collection sweep.

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit).
