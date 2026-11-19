### Set up iOS haptics automatically

Install `@octane-xplat/haptics` and build for iOS. NativeScript now fetches and prepares the Swift dependency automatically. The first build needs Git and network access.

```sh
bun add @octane-xplat/haptics
bun run xplat build --targets ios
```

**Breaking change**

Remove any calls to `xplat-prepare-haptics-ios`. Existing apps must remove their manual `Pulsar` entry from `ios.SPMPackages` and `XplatPulsarBridge` entry from `ios.NativeSource` before rebuilding.

See [iOS haptics setup](https://octane-xplat.goddardai.org/package-haptics#set-up-ios).
