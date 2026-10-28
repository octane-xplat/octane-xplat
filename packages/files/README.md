# `@octane-xplat/files`

File picking, reading, writing, and export for Octane apps — one `files`
service plus a `FileInput` component on web, iOS, Android, and macOS.

Install `@octane-xplat/files` and `@octane-xplat/ui`. `FileInput` uses the
platform picker by default: the browser file input on web, the NativeScript
document picker on iOS/Android, and AppKit `NSOpenPanel` on macOS. No
app-registered picker is needed. The optional `pick` prop can replace the
default for a custom source such as cloud storage.

From an existing Xplat app, install the package before using the example:

```sh
pnpm add @octane-xplat/files
```

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
retain as an opaque reference and pass to `files.readText`. AppKit reads
local files as UTF-8 and writes into Documents. Web file references should be released with
`files.release` when no longer needed.

```ts
import { files } from '@octane-xplat/files'

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
`ContentResolver`), iOS picker copies, macOS local files, sandbox files, and web object URLs.
`maxBytes` rejects oversized files mid-read instead of loading them, and
`signal` aborts the read with an `AbortError`.

```ts
const bytes = await files.readBytes(file, { maxBytes: 10 * 1024 * 1024 })
```

`files.writeBytes(name, bytes)` mirrors `writeText`: on native it writes into
the app sandbox (Documents) and returns a `FileRef`; on web it starts a
browser download. `name` must be a bare file name — paths like `../x` or
`a/b` are rejected, and `writeText` enforces the same rule.

```ts
import { files } from '@octane-xplat/files'

const saved = await files.writeBytes('draft.bin', new Uint8Array([1, 2, 3]))
```

`files.export(name, bytes, { mimeType? })` asks the user where to save the
data and resolves `saved`, `cancelled`, or `unavailable`. `saved` means the
platform committed the bytes — Android flushes them through
`ContentResolver` to the picked document, iOS completes the export-as-copy
flow, macOS writes atomically to the `NSSavePanel` destination, and web closes
a File System Access writable. Browsers without `showSaveFilePicker` and
AppKit hosts without `NSSavePanel` report `unavailable`; a share-sheet
presentation never counts as `saved`. Only one export can run at a time — a
concurrent call rejects with an `ExportBusyError` rather than stealing the
open picker's result.

```ts
const result = await files.export('report.pdf', pdfBytes, { mimeType: 'application/pdf' })
if (result === 'cancelled') console.log('user dismissed')
```

Picked refs are only guaranteed readable within the picking session. Android
`content://` grants are not persisted by the picker, and iOS import-mode
copies live in a temp folder — copy what you need with `writeBytes`, and
call `files.release(ref)` when done.

The AppKit implementation is experimental. Native bridge availability, real
picker interaction, sandbox access and packaged operation still need runtime
qualification. MIME filters use a finite extension table; unrecognized types
do not restrict the picker. Neither picking nor reading persists a security
bookmark for a later app session.

Continue with [File entry and picking](https://octane-xplat.goddardai.org/date-picker).

## AppKit attachment picker lifetime

On experimental AppKit, each FileInput owns one picker/save operation at a time.
The trigger stays busy until picking and changeAction settle. Accepted results
use current values, validation limits and disabled/read-only state. Picker or save
errors become field status; the parent still owns value, so a save failure does
not undo the parent's selection. Removing a row follows its URI after reorder.

```tsx
import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments({ save }: { save(value: FileInputFile | FileInputFile[] | null): Promise<void> }) {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	return <FileInput label="Attachments" value={value} onChange={setValue} changeAction={save} isMultiple />
}
```

Cancellation retains selection and existing validation messages. Results and
errors after detachment are ignored; a custom picker promise is not cancelled.
This is per-control ownership, not a global panel broker. The seven authored
controller cases remain unrun and do not prove native refs, panel interaction,
focus, sandbox access, VoiceOver or packaged behavior. AppKit dropzone file-URL
ownership is described below; native drag delivery remains unqualified.

### AppKit file metadata

The default AppKit FileInput adapter adds known MIME hints from the filename
extension and, when available, file-size metadata from Foundation. This lets
common image picks reach `accept="image/*"` validation and gives `maxSize` a byte
count to check. Custom pickers keep their own metadata; unknown types or failed
metadata reads leave fields absent. The files service's FileRef contract is unchanged.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Images(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Images" value={props.value} onChange={props.change} isMultiple accept="image/*" maxSize={5000000} />
}
```

MIME hints use a finite extension table, not OS content-type discovery or byte
inspection. Size is a metadata snapshot: missing sizes skip maxSize, and later
reads still need their own `readBytes` maxBytes limit. Foundation attributes use
[FileManager attributes](https://developer.apple.com/documentation/foundation/filemanager/attributesofitem(atpath:));
any metadata security-scope claim is released. Recognized concrete MIME aliases use the matching table hint. Five authored
metadata/controller cases remain unrun. Real Foundation values, sandbox grants and packaged picker
validation remain unqualified.


### AppKit local file drops

With the matching AppKit renderer, both input and dropzone presentations register
the existing field wrapper as a local file-URL destination. Inspectable regular files join the same
per-control picker/save token, current accept/count/size validation and parent-owned
value flow. Keep the picker available
for sources that cannot supply local file URLs:

```tsx
import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments() {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	return <FileInput label="Attachments" mode="dropzone" value={value} onChange={setValue}
		isMultiple accept=".txt,.pdf" maxSize={5000000} maxFiles={3} />
}
```

The source path advertises copy, reads file URLs on delivery, and checks Foundation
regular-file attributes before accepting references. Directories, symlinks,
uninspectable files, promised files and non-file payloads are declined. Filename
MIME hints are not content inspection; missing sizes still skip maxSize. An
accepted native drop means the controller received references, not that validation
or saving succeeded. Save errors keep the parent-owned selection. Busy, blocked,
or detached controls cannot accept through a cached callback. Inspection
security scopes are released; persistent sandbox grants are not provided.

Four registry, one bridge, two inspection and two controller cases remain unrun.
The [maintained fixture](../../examples/probes/fileinput-drop.macos.tsrx) mounts the
controls but synthesizes no OS drag. Native registration/ABI, destination hit
routing, cursor/hover presentation, drag delivery, sandbox/grants, actual validation
and save behavior, focus/VoiceOver and packaging remain unqualified. File promises,
custom drag hover feedback and autoscroll remain outside this source path. Older
renderer bridges retain picker entry.
