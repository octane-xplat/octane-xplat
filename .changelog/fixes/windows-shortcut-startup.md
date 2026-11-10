### Handle Windows shortcut startup failures cleanly

Windows global shortcut registration now reports setup failure before starting a worker when Windows returns an invalid pipe handle. The fallback worker-file path also rejects invalid handles before attempting a write.

See [global shortcuts](https://octane-xplat.goddardai.org/packages/package-global-shortcuts).
