### Show a file in its folder

Use `shell.showItemInFolder()` with an absolute native path to reveal an exported file in the desktop file manager.

```ts
import { shell } from '@octane-xplat/desktop'

export async function revealExport(path: string) {
  if (shell.canShowItemInFolder) {
    await shell.showItemInFolder(path)
  }
}
```

See [Show a file in its folder](https://octane-xplat.goddardai.org/package-desktop#show-a-file-in-its-folder).
