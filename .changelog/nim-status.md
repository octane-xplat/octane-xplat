### Discover project context with the native CLI

The experimental Nim CLI now reports app selection, installed framework versions,
guidance, source coverage and missing tools on macOS. Its capability report shows
which native operations are available, including unfinished runtime workflows.
The report itself runs without Node or Bun.

```sh
xplat status --json
xplat capabilities --json
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
