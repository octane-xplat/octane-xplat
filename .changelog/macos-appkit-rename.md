---
hype: 25
---

### AppKit renderer renamed to `@octane-xplat/macos-appkit`

The experimental macOS AppKit renderer now ships as `@octane-xplat/macos-appkit`, replacing `@octane-xplat/macos-renderer`. The API is unchanged; only the package name moved.

**Breaking change**: `@octane-xplat/macos-renderer` no longer receives new releases. Point your dependency and every import at the new name.

```sh
bun add @octane-xplat/macos-appkit
```

```ts
import { createMacOSRoot } from '@octane-xplat/macos-appkit'
```

See the [AppKit renderer package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-appkit).
