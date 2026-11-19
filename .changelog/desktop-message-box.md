### Ask for a choice in a native message box

Use a window-owned message box for confirmation prompts on AppKit and GTK. The result identifies the button by its position in the list.

```ts
import { dialog } from '@octane-xplat/desktop'

const { response } = await dialog.showMessageBox(inspector, {
  message: 'Discard unsaved changes?',
  buttons: ['Keep Editing', 'Discard Changes'],
  cancelId: 0,
})
```

See [Confirm before discarding changes](https://octane-xplat.goddardai.org/package-desktop#confirm-before-discarding-changes).
