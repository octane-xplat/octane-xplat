### Confirm choices in native Windows dialogs

Use the window-owned message box on experimental Windows hosts that provide Windows Common Controls version 6. Rebuild the native app after updating the desktop package.

```ts
import { dialog } from '@octane-xplat/desktop'

if (dialog.supportsMessageBox) {
  const { response } = await dialog.showMessageBox(inspector, {
    message: 'Discard unsaved changes?',
    buttons: ['Keep Editing', 'Discard Changes'],
    cancelId: 0,
  })
  if (response === 1) inspector.destroy()
}
```

See [Confirm before discarding changes](https://octane-xplat.goddardai.org/package-desktop#confirm-before-discarding-changes).
