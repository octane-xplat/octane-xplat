### Add experimental Windows text and binary file I/O

Native Windows selects a file-service leaf without loading the mobile document
picker. Text and bounded binary reads/writes are implemented as WinRT candidates.
Writes create uniquely named temporary copies; release schedules deletion of
owned copies only.

```ts
import { files } from '@octane-xplat/files'

const copy = await files.writeText('report.txt', 'Packing list')
try {
  const bytes = await files.readBytes(copy, { maxBytes: 1024 })
} finally {
  files.release(copy)
}
```

Windows picker and export dialogs remain unavailable. Actual NativeScript/WinRT
I/O and packaging are unverified; focused host tests use mocked projections.
[Windows file I/O boundary](https://github.com/octane-xplat/octane-xplat/blob/main/packages/files/README.md#experimental-native-windows-file-io)
