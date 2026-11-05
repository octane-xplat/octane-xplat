### Package macOS apps with the experimental Nim CLI

The experimental Nim CLI can build configured macOS apps using a separate
project-installed packaging worker. The standalone CLI stays small. Native jobs
capture compiler output, serialize builds for one app, and release owned
processes on cancellation. Cancellation before publication preserves the previous
app and DMG.

```sh
bun add --dev @octane-xplat/macos-build @octane-xplat/build
xplat build --targets macos
xplat runtime build --platform macos --json
```

See the [macOS worker setup](https://octane-xplat.goddardai.org/package-macos-build).
