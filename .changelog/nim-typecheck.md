### Typecheck projects with the native CLI

The experimental Nim CLI can now run `xplat typecheck` on macOS using the
project's installed TSRX checker. It generates route types without executing
baked loaders, preserves compiler diagnostics and cleans up owned processes
when cancelled.

```sh
xplat typecheck
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
