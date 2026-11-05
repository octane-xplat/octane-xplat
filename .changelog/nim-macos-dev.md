### Start macOS development sessions with the experimental native CLI

The Nim CLI can start an existing macOS app through its project-installed
development tools, capture output and stop its owned processes. JavaScript and
native source edits use the same development engine as the TypeScript CLI.
It can also attach to an existing compatible macOS engine, capture lifecycle
events and leave external processes running when the attachment ends.

```sh
xplat targets --platform macos --json
xplat session start macos --json
# Or attach to a development engine you already run:
xplat session attach --platform macos --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

Replace `SESSION_ID` with the returned id. See the
[macOS development setup](https://octane-xplat.goddardai.org/package-macos-build#start-a-development-session).
