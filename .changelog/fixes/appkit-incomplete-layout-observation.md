### Keep macOS layout observations tied to completed updates

The AppKit renderer no longer reports a successful layout change after a render or style update fails. Later updates can still open a new batch; changes already applied before the failure remain in place.

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)
