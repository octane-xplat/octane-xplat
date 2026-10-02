# `@octane-xplat/files`

Cross-platform file selection and file entry for Octane apps.

Install `@octane-xplat/files` and `@octane-xplat/ui`. `FileInput` uses the
platform picker by default: the browser file input on web, the NativeScript
document picker on iOS/Android, and AppKit `NSOpenPanel` on macOS. No
app-registered picker is needed. The optional `pick` prop can replace the
default for a custom source such as cloud storage.

```tsx
import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments() @{
	const [files, setFiles] = useState<FileInputFile[] | null>([])

	<FileInput
		label="Attachments"
		isMultiple
		value={files}
		onChange={(next) => setFiles(Array.isArray(next) ? next : next ? [next] : [])}
	/>
}
```

The portable value is `{ name, uri, size?, mimeType? }`. On web, the selected
browser `File` is also available as `file`; its `uri` is a temporary object
URL. Native platforms return a local path or content URI, which apps should
retain as an opaque reference and pass to `files.readText` where supported.
AppKit provides native picking, but its current `readText` and `writeText`
methods are unsupported. Web file references should be released with
`files.release` when no longer needed.
