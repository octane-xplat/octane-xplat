---
hype: 70
---

### Run iOS and Android development without the `ns` CLI

`xplat dev ios`, `xplat dev android` and debug `xplat build` now build and launch simulator and emulator apps inside `xplat`, using your app's installed `@nativescript/vite` and platform runtime. Add `--no-hmr` to restart the app after each edit instead of applying a live update.

```sh
bun run xplat dev ios
bun run xplat dev android --no-hmr
bun run xplat build --targets ios
```

**Breaking change:** release signing, device archives and `--copy-to` still use the project's installed `nativescript` CLI, and now need `XPLAT_NATIVE_ENGINE=upstream`. Without it, those builds stop with a message instead of switching engines.

```sh
XPLAT_NATIVE_ENGINE=upstream bun run xplat build --targets android --release --aab
```

[Release an iOS or Android app](https://octane-xplat.goddardai.org/native-release#build-one-release-target)
