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
the app sandbox (Documents on iOS/Android/macOS, temporary copies on experimental
Windows) and returns a `FileRef`; on web it starts a
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
qualification. Neither picking nor reading persists a security bookmark for a
later app session.

## AppKit file type filters

On AppKit, pass comma-separated filename extensions or MIME types (labels such
as `application/pdf`) to limit a picker. The image, audio, video and text wildcard
families use OS type groups. Concrete MIME types use registered OS types, with a
small extension table as a fallback for known types when native lookup is absent.

```ts
// AttachmentActions.macos.ts
import { files } from '@octane-xplat/files'

export async function chooseDocuments() {
	return files.pickMultiple('.pdf,.docx')
}
export async function chooseImagesOrPDF() {
	return files.pickMultiple('image/*,.pdf')
}
```

An empty filter or `*/*` allows any file, including when mixed with other
entries. A malformed or unresolved restriction rejects the whole request with
`UnsupportedFileTypeError` before the panel opens. Use explicit extensions for
unregistered formats; other wildcard families such as `application/*` are not
supported. FileInput displays picker errors as field status.

```ts
// AttachmentActions.macos.ts
import { files } from '@octane-xplat/files'

export async function chooseAnyFile() {
	return files.pick('*/*')
}
export async function chooseCustomDocument() {
	try { return await files.pick('application/x-my-document') }
	catch (error) {
		if (error instanceof Error && error.name === 'UnsupportedFileTypeError') {
			return files.pick('.mydoc')
		}
		throw error
	}
}
```

Native type groups can include aliases and conforming formats rather than only
literal extensions. The panel does not verify file contents. Framework loading,
native type bridging, actual enabled files and installed-app behavior remain
unqualified. See [attachment metadata](#appkit-file-metadata).

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

The default AppKit FileInput adapter asks the OS for a MIME hint from the
filename extension, then falls back to known extension hints. A requested
concrete MIME alias is retained when the table recognizes it or it resolves to
the same native type. Optional file-size metadata from Foundation gives `maxSize`
a byte count to check. Custom pickers keep their own metadata. FileInput checks
its current accept rule against names and available MIME hints, so a file enabled
by the OS panel can still fail field validation.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Images(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Images" value={props.value} onChange={props.change} isMultiple accept="image/*" maxSize={5000000} />
}
```

Filename MIME hints do not inspect bytes. Unknown metadata or failed discovery
leaves fields absent; a missing MIME hint can fail a MIME accept rule. Size is a
snapshot: missing sizes skip maxSize, and later reads still need their own
`readBytes` maxBytes limit. Foundation attributes use
[FileManager attributes](https://developer.apple.com/documentation/foundation/filemanager/attributesofitem(atpath:));
any metadata security-scope claim is released. Nine authored metadata/controller
cases remain unrun. Real native type discovery, Foundation values, sandbox grants
and packaged picker validation remain unqualified.


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

## Experimental native Windows file I/O

The Windows leaf is a candidate for text and binary I/O through WinRT. It
requires the host's `ApplicationData.Current.TemporaryFolder` and creates
uniquely named files there, without replacing
existing files. Keep the returned reference and release it when done. These
files are temporary, so they are unsuitable for durable drafts or preferences.
Text/binary reads, writes and owned-only release passed a standalone NativeScript
Windows DLL check on x64 using a task-owned folder. Packaged temporary-folder
access, app integration, cancellation and packaging remain unqualified.
The preview does not project `Close` on the input stream;
reclamation depends on the runtime releasing the proxy.

```ts
import { files } from '@octane-xplat/files'

const copy = await files.writeText('report.txt', 'Packing list')
try {
  const text = await files.readText(copy)
  const bytes = await files.readBytes(copy, { maxBytes: 1024 * 1024 })
} finally {
  files.release(copy)
}
```

Windows binary reads use bounded chunks, check size limits before and during
reading, and request cancellation when the abort signal fires. Binary writes
preserve the supplied view's byte range and reject partial writes or failed
flushes. A failed write removes its newly created copy. Release schedules
best-effort deletion of owned copies only; it never deletes an externally
supplied reference. A later release can retry a failed cleanup.

```ts
import { files } from '@octane-xplat/files'

const backing = new Uint8Array([0, 1, 2, 0])
const copy = await files.writeBytes('selection.bin', backing.subarray(1, 3))
const controller = new AbortController()
try {
  const bytes = await files.readBytes(copy, { maxBytes: 2, signal: controller.signal })
} finally {
  files.release(copy)
}
```

Native Windows picking and user-directed export are unavailable until the
host supplies qualified picker-window interop. `pick` and `pickMultiple`
reject with `UnavailabilityError`; export returns `unavailable`. This differs
from user cancellation. `FileInput` reports the default picker's rejection;
a custom `pick` prop remains an app-owned integration. No built-in attachment
dialog support is claimed for Windows.

```ts
import { files } from '@octane-xplat/files'

const result = await files.export('report.txt', new Uint8Array([65]))
if (result === 'unavailable') {
  // Use an app-provided destination workflow; no file was exported.
}
```

See [Windows evidence and deferred checks](../../.agents/docs/parity/windows-support-progress.md)
and Microsoft's [desktop picker-window requirements](https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers#use-winrt-pickers-with-hwnd-interop).
