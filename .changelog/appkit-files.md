### Read and save files in native macOS apps

The experimental AppKit files service now implements UTF-8 text reads,
chunked binary reads with size limits and cancellation, Documents writes,
and user-directed export through the native save panel. Real AppKit and
packaged-app qualification remain pending.

```ts
import { files } from '@octane-xplat/files'

const draft = await files.writeBytes('draft.bin', new Uint8Array([1, 2, 3]))
const bytes = await files.readBytes(draft, { maxBytes: 1024 })
const result = await files.export('draft.bin', bytes)
```

[Files documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/files)
