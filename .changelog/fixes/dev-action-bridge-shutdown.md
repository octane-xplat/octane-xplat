### Stop development actions without a late announcement error

Stopping a development-action bridge immediately after changing a handler no longer causes a queued registry announcement to fail during cleanup. Queued announcements also stay bound to their original bridge, so they cannot use a replacement connection. Late HTTP responses leave a stopped bridge stopped and do not deliver more work.

See [development actions](https://octane-xplat.goddardai.org/testing/development-actions).
