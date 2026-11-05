### Generate and watch routes with the native CLI

The experimental Nim CLI now generates route catalogs and baked loader/Markdown
data with `xplat routes` on macOS. Watch mode cancels obsolete work, preserves
the last successful generated files after a failed bake, and recovers on later
edits.

```sh
xplat routes --watch
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
