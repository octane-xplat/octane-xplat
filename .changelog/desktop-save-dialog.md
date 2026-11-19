### Choose where to save files on desktop

Use the native Save dialog to choose a file path from an existing desktop window. Save the contents after the user confirms the path.

```ts
import { dialog } from '@octane-xplat/desktop'

const result = await dialog.showSaveDialog(inspector, { suggestedName: 'notes.txt' })
if (!result.canceled) await writeNotes(result.filePath)
```

See [Choose where to save a file](https://octane-xplat.goddardai.org/package-desktop#choose-where-to-save-a-file).
