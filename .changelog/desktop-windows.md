### Open and manage a second desktop window

Use `windows.open()` from `@octane-xplat/desktop` to open a regular window on AppKit or Linux GTK. Install your host's content resolver first. The `close` event lets you protect unsaved edits, and `closed` fires after the window's content has unmounted.

```ts
import { windows } from '@octane-xplat/desktop'

if (windows.supported) {
  const inspector = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
  inspector.on('closed', () => console.log('Inspector closed'))
}
```

See [Open a second window](https://octane-xplat.goddardai.org/package-desktop#open-a-second-window) for setup and cleanup.
