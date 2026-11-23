### macOS runs on NativeScript Core

The existing `macos` target now runs NativeScript Core on AppKit. The target still uses the same window host and packaging command. Apply the updated framework patches before rebuilding.

```sh
xplat patches apply
bun install
xplat build --targets macos
```

**Breaking change:** Custom macOS elements use NativeScript Core and the NativeScript Octane element registry. Declare `@nativescript/core` and `@octane-xplat/nativescript-octane` in your app's dependencies. Use the Core version from the toolchain setup.

```ts
import { View } from '@nativescript/core'
import { registerElement } from '@octane-xplat/nativescript-octane'
import { NSView } from '@octane-xplat/platform/macos'

class AppKitBadge extends View {
  createNativeView() {
    return NSView.alloc().init()
  }
}

registerElement('appkitbadge', AppKitBadge)
```

[Configure the macOS target](https://octane-xplat.goddardai.org/package-macos-appkit#configure-an-app) · [Toolchain setup](https://octane-xplat.goddardai.org/package-toolchain)
