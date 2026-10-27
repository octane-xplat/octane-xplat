### One native workshop chrome; Linux renders with GTK, not WebKitGTK

The workshop chrome on iOS/Android, macOS, and Linux is now one Octane
component styled by one stylesheet, instead of three separately built
shells. Your story still runs in its own area of the window, so opening
panels or resizing the window never restarts it.

- **Linux (breaking)**: `xplat workshop dev --target linux` now draws the
  chrome and your stories with real GTK4 widgets through
  `@octane-xplat/linux-gtk` instead of a WebKitGTK web view. It needs `gjs`,
  GTK4, and the `@octane-xplat/linux-gtk` package, which is only available
  inside this repository for now. DOM stories still open with
  `--target web`.
- **Story file names (breaking)**: `.stories.linux.*` files are no longer
  part of the Linux workshop. Rename them to `.stories.gtk.*`; the workshop
  prints a reminder for each one it finds:

  ```sh
  git mv src/button.stories.linux.tsrx src/button.stories.gtk.tsrx
  ```

- **`@octane-xplat/workshop/macos` (breaking)**: the export is now
  `NativeWorkshopController` (it replaces `MacOSWorkshopController`), next
  to `createMacOSStageHost`:

  ```ts
  import { createMacOSStageHost, NativeWorkshopController } from '@octane-xplat/workshop/macos'
  ```

- **`@octane-xplat/ui` on GTK**: GTK bundles that import `@octane-xplat/ui`
  get `Text` and `Pressable` only. Other components are not checked on GTK
  yet.

[Component workshop](https://github.com/octane-xplat/octane-xplat/blob/main/packages/workshop/README.md) ·
[GTK renderer guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/linux-gtk.md)
