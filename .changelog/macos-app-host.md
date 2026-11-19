---
hype: 60
---

### Run a macOS app with `runMacOSApp`

Use `runMacOSApp` from `@octane-xplat/macos-appkit/host` to open a main window and render your app in it. The host also connects platform services such as clipboard and storage.

```ts
import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
import { App } from './App'

runMacOSApp({ title: 'Notes' }, ({ root, window }) => {
  root.render(App, { parentWindow: window })
  return () => console.log('app is closing')
})
```

[Start an AppKit app](https://octane-xplat.goddardai.org/package-macos-appkit#start-an-app)
