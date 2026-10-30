# Files, capture, and playback

Use for picked-file lifetime, Windows file/audio boundaries, view capture, and long-form speech. Handle unavailable capabilities and release ownership through the [owning package](../services.md#locate-the-owning-package).

## Windows audio import boundary

The Windows audio leaf keeps mobile backends out of native imports, but
createAudioPlayer still throws: no Windows playback backend is supplied.
Do not treat a clean import graph as playback support or call capabilities()
without first handling unsupported creation. See the
[audio package boundary](../../../../../packages/audio/README.md).

## Read picked images before releasing them

`media.pickImages()` returns temporary `{ name, uri }` references, not data URLs.
Read uploads with `files.readBytes`; await each read before owner cleanup. In a
`try/finally`, returning an unawaited promise runs cleanup before the read finishes.
The [media guide](../../../../../docs/platform/platform-services.md#pick-and-capture-images)
shows selection, cancellation and replacement ownership.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export async function readImages() {
	const images = await media.pickImages()
	try {
		const bytes: Uint8Array[] = []
		for (const image of images) bytes.push(await files.readBytes(image))
		return bytes
	} finally {
		for (const image of images) files.release(image)
	}
}
```

## Windows file I/O boundary

The experimental [Windows file leaf](../../../../../packages/files/README.md#experimental-native-windows-file-io)
provides text/binary I/O candidates without importing mobile picker plugins.
Writes are temporary copies, not durable documents; release owns only those
copies. Native Windows picking rejects as unavailable and export returns
`unavailable`. A custom FileInput picker is app-owned. Standalone x64 NativeScript
text/bounded-byte reads and writes, unique names and owned-only release passed
against a task-owned folder; packaged TemporaryFolder access, app integration
and cancellation require separate target qualification. Use `OpenSequentialReadAsync` with
`IInputStream.ReadAsync`, and `OpenAsync().GetOutputStreamAt(0)` for writes:
alpha.144 omits inherited methods on `OpenReadAsync` results, and the standalone
`DataReader.LoadAsync` check crashed. Input-stream `Close` is also absent, so
reclamation depends on the runtime releasing its proxy. Do not infer
attachment-dialog support from the component export.

The existing Windows test project uses App SDK 1.6.250205002. The newer
Microsoft.Windows.Storage.Pickers API requires 1.8; changing the namespace alone
does not supply a usable picker. The older Windows.Storage.Pickers API requires
IInitializeWithWindow bound to the actual owner HWND. Qualify that host bridge
before enabling pick/export. See the [picker prerequisites](../../../../docs/exploration.md#operational-evidence).

```ts
import { files } from '@octane-xplat/files'

const copy = await files.writeText('report.txt', 'Packing list')
try {
  const bytes = await files.readBytes(copy, { maxBytes: 1024 })
} finally {
  files.release(copy)
}
```

### Long-form speech playback

Use the audio leaf for speech speed and player gain. Mute preserves the stored
volume; speed is clamped to 0.5–3 and volume to 0–1. Nonfinite settings reject.
See [playback speed and volume](../../../../../docs/platform/media-services.md#playback-speed-and-volume)
for lifecycle and target qualification; changing a native property is not
physical output evidence.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
await player.setPlaybackRate(1.5)
await player.setVolume(0.4)
await player.setMuted(true)
player.dispose()
```

For generated speech chunks, retain stable IDs and update future items instead
of replacing the playing queue. Incomplete exhaustion is `waiting`; explicit
pause cancels append auto-resume. Do not infer background JavaScript scheduling
from audio capability flags. See [growing queues](../../../../../docs/platform/media-services.md#add-items-without-restarting-the-current-track).

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
const first = { id: '1', source: 'https://example.com/1.mp3' }
await player.setQueue([first], 0, { complete: false })
await player.updateQueue([first, { id: '2', source: 'https://example.com/2.mp3' }], { complete: true })
player.dispose()
```

## Capture an app view

Use [ViewShot](../../../../../packages/view-shot/README.md) for a mounted card or
host subtree. Use Octane refs, never numeric React handles. Await the consumer
before releasing manual tmpfile results; the wrapper owns automatic results
until replacement/disposal. Wait for loaded images/fonts explicitly. Continuous
mode, full-scroll content, RAW/ZIP and Android GL handling reject. Check the
selected backend's capabilities: only phones implement primary app-screen
capture; GTK/experimental Windows implement PNG views only. Source/compiler/API
checks have passed, but no capture output is runtime-qualified. Do not treat
those checks as pixel evidence or bypass a visual-analysis restriction.

```ts
import { captureRef, releaseCapture } from '@octane-xplat/view-shot'

const uri = await captureRef(card, { format: 'png' })
try {
	// Await the operation that consumes uri.
} finally {
	releaseCapture(uri)
}
```

## AppKit file input ownership

AppKit FileInput now owns picking and saving as one busy operation. Async results
use current validation/values/blocking state; detached completions are ignored.
Clear/removal share the same guard, and row removal follows URI after reorder.
changeAction failure reports validation status without rolling back parent-owned
value. Custom picker promises are ignored after detach, not cancelled; ownership
is per control. Native panels/ref lifecycle/VoiceOver and drag/drop remain
unqualified; local file-drop source ownership is described below. See the [files contract](../../../../../packages/files/README.md#appkit-attachment-picker-lifetime).

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: {
	value: FileInputFile[]
	change(value: FileInputFile | FileInputFile[] | null): void
	save(value: FileInputFile | FileInputFile[] | null): Promise<void>
}) {
	return <FileInput value={props.value} onChange={props.change} changeAction={props.save} isMultiple />
}
```


Default AppKit FileInput picks now receive finite filename MIME hints and
best-effort Foundation size metadata before validation. Custom pickers retain
their supplied metadata; files.pick's FileRef contract is unchanged. Unknown MIME
hints stay absent and missing sizes skip maxSize. Treat these as metadata, never
content verification or a memory bound; use readBytes maxBytes when reading.
Native metadata/grants/picker behavior requires separate target qualification.

```ts
import { files } from '@octane-xplat/files'

const file = await files.pick('image/*')
if (file) await files.readBytes(file, { maxBytes: 5000000 })
```


AppKit FileInput now attaches a private destination lease in both presentations to its
existing wrapper when the matching renderer is present. Copy-delivered local URLs
must pass regular-file inspection, then reuse the picker/save token and current
validation/parent feedback. Loading/read-only/disabled state, an active
operation and detach decline delivery. Ref/node teardown releases ownership and
other registered drag types are preserved.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Attachments" mode="dropzone" value={props.value} onChange={props.change}
		isMultiple accept=".txt,.pdf" maxSize={5000000} maxFiles={3} />
}
```

Do not equate native drop acceptance with successful validation/save or a durable
sandbox grant. Directories, symlinks, uninspectable/promised/non-file items are
excluded. MIME hints remain filename-based; missing sizes skip maxSize.  Native ABI/registration,
hit routing/drag, grants, hover/AX/focus and packaging require qualification;
custom hover/autoscroll and promised-file support remain gaps. See [AppKit file drops](../../../../../packages/files/README.md#appkit-local-file-drops).
