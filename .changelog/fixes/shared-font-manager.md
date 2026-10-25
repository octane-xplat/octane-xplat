---
release: lockstep
---

### Build iOS apps with shared font support

iOS apps can use Mason core and `@nativescript/font-manager` together without
duplicate FontManager module errors. The app now links one native font library.
Upgrading also aligns an explicitly declared FontManager plugin with the
supported version. Rebuild the native app to receive the correction:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm build:ios
```

[Upgrade framework packages](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)
