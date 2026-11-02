### Start macOS development sessions with the experimental native CLI

The Nim CLI can start an existing macOS app through its project-installed
development tools, capture output and stop its owned processes. JavaScript and
native source edits use the same development engine as the TypeScript CLI.
Session logs currently last only while the native workspace host runs; attaching
to an existing app and native crash reports remain in migration.

```sh
xplat targets --platform macos --json
xplat session start macos --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

Replace `SESSION_ID` with the returned id. See the
[macOS development setup](https://octane-xplat.goddardai.org/package-macos-build#start-a-development-session).
