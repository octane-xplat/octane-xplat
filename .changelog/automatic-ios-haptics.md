### Set up iOS haptics automatically

Installing `@octane-xplat/haptics` now lets NativeScript prepare its patched Swift dependency and include its native bridge automatically. The first iOS preparation still needs Git and network access; later preparations reuse validated source.

```sh
bun add @octane-xplat/haptics
bun run xplat build --targets ios
```

The `xplat-prepare-haptics-ios` command has been removed. Existing apps must remove their manual `Pulsar` entry from `ios.SPMPackages` and `XplatPulsarBridge` entry from `ios.NativeSource` before rebuilding.

See [iOS haptics setup](https://octane-xplat.goddardai.org/package-haptics#set-up-ios).
