### Match phone updates to their native binary

The new fingerprint build tool adds Expo-shaped hash/source/diff APIs for
NativeScript inputs. OTA publishing, staging and native startup now require
the exact fingerprint baked into the binary. Publishing rejects changed native
inputs and debug payloads; different native binaries retain separate channel
pointers.

This replaces minimum-native-version manifests and channel keys. Add the build
tool as a development dependency, review/regenerate the existing prepare hook,
rebuild binaries and deploy the matching server. Preserve the private build
record with your release payload. Android runtime qualification is unverified.

```sh
pnpm add -D @octane-xplat/fingerprint
pnpm exec xplat updates init
pnpm exec xplat-fingerprint --dir . --platform ios
```

[Phone update setup and migration](https://octane-xplat.goddardai.org/updates) ·
[Fingerprint API and custom inputs](https://github.com/octane-xplat/octane-xplat/blob/main/packages/fingerprint/README.md)
