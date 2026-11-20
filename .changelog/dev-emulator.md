### Run development on a virtual device without its ID

Use `xplat dev --emulator` to select an iOS simulator or a running Android emulator. Physical devices are excluded. When several virtual devices match, Xplat uses the only running one or lists the matching IDs so you can retry with `--device`.

```sh
bun run xplat dev ios --emulator
bun run xplat dev android --emulator
```

[Run on iOS and Android](https://octane-xplat.goddardai.org/toolchain#run-on-ios-and-android).
