### Continue macOS cleanup after a release fails

The AppKit renderer now continues independent cleanup when a subscription,
nested view or native release throws. Retired controls ignore held callbacks,
and a cleanup error no longer hides the original construction error.

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)
