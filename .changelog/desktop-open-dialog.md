### Open files from a native desktop window

Use `dialog.showOpenDialog()` to attach a native file picker to a shown secondary window. The result tells you whether the user canceled or selected files.

```ts
import { dialog, type DesktopWindow } from '@octane-xplat/desktop'

export async function openFromInspector(inspector: DesktopWindow) {
  if (!dialog.supported) return
  const result = await dialog.showOpenDialog(inspector)
  if (!result.canceled) console.log(result.filePaths)
}
```

See [Open a file dialog from a window](https://octane-xplat.goddardai.org/package-desktop#open-a-file-dialog-from-a-window) for filters, cancellation, and Windows setup.
