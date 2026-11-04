### Install the shared development toolchain together

The new `octane-xplat` package provides the `xplat` command and compatible Vite, TypeScript, and TSRX tooling. New app starters include it and import build configuration helpers from `octane-xplat/vite`.

```sh
bun add -D octane-xplat
bun run xplat typecheck
bun run xplat build --targets web
```

Runtime packages, platform tools, and app testing dependencies remain separate. Keep the framework's managed patches when upgrading an existing app. See the [toolchain package guide](https://octane-xplat.goddardai.org/package-toolchain).
