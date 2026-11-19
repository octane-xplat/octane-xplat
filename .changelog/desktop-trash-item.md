### Move files to Trash

Use `shell.trashItem()` with an absolute native path to move an item to the system Trash on AppKit or GTK.

```ts
import { shell } from '@octane-xplat/desktop'

export async function moveToTrash(path: string) {
  if (shell.canTrashItem) {
    await shell.trashItem(path)
  }
}
```

See [Move an item to Trash](https://octane-xplat.goddardai.org/package-desktop#move-an-item-to-trash).
