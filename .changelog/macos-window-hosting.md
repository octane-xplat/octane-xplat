### Open secondary windows in native macOS apps

Use `setWindowContentResolver` to choose the component that `openWindow` renders. For native views outside Octane, use the host’s `createHostedWindow`.

```ts
import { setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
import { openWindow } from '@octane-xplat/ui'
import { PreviewWindow } from './PreviewWindow'

setWindowContentResolver((data) => {
  if (data && typeof data === 'object' && 'kind' in data && data.kind === 'preview') {
    return PreviewWindow
  }
  return null
})
openWindow({ title: 'Preview', data: { kind: 'preview' } })
```

[AppKit windows](https://octane-xplat.goddardai.org/package-macos-appkit#start-an-app)
