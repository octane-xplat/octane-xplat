### Move files to the Windows Recycle Bin

Use `shell.trashItem()` on supported Windows hosts after rebuilding the native app. The operation fails if the item cannot be recycled.

```ts
import { shell } from '@octane-xplat/desktop'

if (shell.canTrashItem) {
  await shell.trashItem('C:\\Users\\Example\\Downloads\\example.txt')
}
```

See [Move an item to Trash](https://octane-xplat.goddardai.org/package-desktop#move-an-item-to-trash).
