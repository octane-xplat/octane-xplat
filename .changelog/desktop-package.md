### Use one package for desktop services

**Breaking change:** Native application menus, tray icons, app residency, and global keyboard shortcuts now come from `@octane-xplat/desktop`. Replace the `@octane-xplat/app-menu`, `@octane-xplat/tray`, and `@octane-xplat/global-shortcuts` dependencies with the desktop package and update their imports. Existing function names, menu data, registration results, and cleanup behavior are retained. The old packages and feature subpaths are not provided.

```ts
import { appMenu, createTray, createGlobalShortcuts, keepAppResident } from '@octane-xplat/desktop'
```

See [Desktop application services](https://octane-xplat.goddardai.org/package-desktop) for setup and feature guides. Native macOS, GTK, and Windows hosts remain experimental; each feature retains its documented host requirements.
