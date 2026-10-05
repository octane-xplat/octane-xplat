# `@octane-xplat/files`

Cross-platform file selection and file entry for Octane apps.

Install `@octane-xplat/files` and `@octane-xplat/ui`. `FileInput` uses the
platform picker by default: the browser file input on web, the NativeScript
document picker on iOS/Android, and AppKit `NSOpenPanel` on macOS. No
app-registered picker is needed. The optional `pick` prop can replace the
default for a custom source such as cloud storage.

```tsrx
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

```ts
import { files } from '@octane-xplat/files'

// Run in a .web.ts file: AppKit currently does not support readText.
const file = await files.pick('text/plain')
if (file) {
	try {
		console.log(await files.readText(file))
	} finally {
		files.release(file)
	}
}
```

## Binary reads, writes, and export

`files.readBytes(ref, { maxBytes?, signal? })` reads the full contents as a
`Uint8Array`. It works on `content://` picks (read through Android's
`ContentResolver`), iOS picker copies, sandbox files, and web object URLs.
`maxBytes` rejects oversized files mid-read instead of loading them, and
`signal` aborts the read with an `AbortError`.

```ts
const bytes = await files.readBytes(file, { maxBytes: 10 * 1024 * 1024 })
```

`files.writeBytes(name, bytes)` mirrors `writeText`: on native it writes into
the app sandbox (Documents) and returns a `FileRef`; on web it starts a
browser download. `name` must be a bare file name — paths like `../x` or
`a/b` are rejected, and `writeText` enforces the same rule.

`files.export(name, bytes, { mimeType? })` asks the user where to save the
data and resolves `saved`, `cancelled`, or `unavailable`. `saved` means the
platform committed the bytes — Android flushes them through
`ContentResolver` to the picked document, iOS completes the export-as-copy
flow, and web closes a File System Access writable. Browsers without
`showSaveFilePicker` and the AppKit leaf report `unavailable`; a share-sheet
presentation never counts as `saved`.

```ts
const result = await files.export('report.pdf', pdfBytes, { mimeType: 'application/pdf' })
if (result === 'cancelled') console.log('user dismissed')
```

Picked refs are only guaranteed readable within the picking session. Android
`content://` grants are not persisted by the picker, and iOS import-mode
copies live in a temp folder — copy what you need with `writeBytes`, and
call `files.release(ref)` when done.
