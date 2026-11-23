### Linux GTK runs on NativeScript Core

The existing GTK target uses the same NativeScript Octane renderer as macOS, with GTK4 controls and the bundled Mason layout engine. Apply the pinned toolchain patches before rebuilding.

```sh
bun run xplat patches apply
bun install
bun run xplat build --targets linux
```

**Breaking change:** The GTK root reports `nativescript` as its renderer ID. The Linux target still uses `runtime: "gtk"` in the app manifest.

[Set up the Linux GTK target](https://octane-xplat.goddardai.org/linux-gtk)
