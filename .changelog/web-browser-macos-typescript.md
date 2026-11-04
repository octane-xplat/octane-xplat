### In-app browser window on macOS, with no native rebuild

On macOS, `webBrowser.openBrowser` now presents an owned in-app WebKit window with native history, reload/stop, address and close controls. The former external-browser delegation is removed; use `openUrl` from `@octane-xplat/platform` when another application should own the destination.

```ts
import { openUrl } from '@octane-xplat/platform'

export function showExternalPage(address: string) {
  return openUrl(address)
}
```

The AppKit backend is TypeScript over the host's Objective-C bridge, so installing or updating `@octane-xplat/web-browser` needs no plugin rebuild on macOS. iOS and Android are unchanged.

See [`@octane-xplat/web-browser`](https://octane-xplat.goddardai.org/package-web-browser).
