### Read native session diagnostics after the owner exits

The experimental Nim CLI retains app-scoped session metadata and bounded logs
across host shutdown. A missing owner leaves historical data with cleanup marked
unconfirmed; ending that historical record never signals a stored process id.
Build-job log captures still last only while their host runs.

```sh
xplat session status SESSION_ID --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

Replace `SESSION_ID` with the returned development-session id. See
[native macOS sessions and retention limits](https://octane-xplat.goddardai.org/package-macos-build#start-a-development-session).
