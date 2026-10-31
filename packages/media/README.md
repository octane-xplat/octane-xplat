# `@octane-xplat/media`

Still-image picking and OS camera capture for Octane xplat apps. iOS runs
`@nativescript/imagepicker` + `@nativescript/camera`, Android the same
plugins over its photo picker/camera intent; web uses `<input
type="file">` (with the `capture` attribute for camera shots, which mobile
browsers route to the camera app). macOS AppKit uses the normal file picker
for existing images and an app-owned Capture/Cancel sheet for still photos.
Photos-library browsing and gallery saving remain unsupported.

```sh
bun add @octane-xplat/media @octane-xplat/files
```

```ts
import { media } from '@octane-xplat/media'

const image = await media.pickImage() // null when the user cancels
const shot = await media.capturePhoto()
```

Every method returns a `PickedImage` — a `FileRef` (`name`, opaque `uri`)
you can hand straight to `Image src`, or to `files.readBytes()` for an
upload body. Cancellation resolves `null` (or `[]` for `pickImages`), so
check the result for cancellation; other failures can still reject. `getPermissions('camera' | 'photos')`
reads without prompting and `requestPermissions('camera' | 'photos')` may
prompt — both resolve `{status, granted, canAskAgain}`.

This preview owns its selected file. Replacing the photo or removing the
component releases it; a picker finishing after unmount releases its result too.

```tsx
import { useEffect, useRef, useState } from 'octane'
import { Button, Image, Text } from '@octane-xplat/ui'
import { media } from '@octane-xplat/media'
import type { PickedImage } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export function PhotoPicker() {
	const [preview, setPreview] = useState<PickedImage | null>(null)
	const [error, setError] = useState('')
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => { mounted.current = false }
	}, [])
	useEffect(() => () => { if (preview) files.release(preview) }, [preview])

	async function pickPhoto() {
		try {
			const photo = await media.pickImage()
			if (!photo) return
			if (!mounted.current) {
				files.release(photo)
				return
			}
			setError('')
			setPreview(photo)
		} catch (error) {
			if (mounted.current) setError(String(error))
		}
	}
	return (
		<>
			<Button clickAction={pickPhoto}>Choose photo</Button>
			{preview && <Image src={preview.uri} alt="Selected photo" />}
			{error && <Text>{error}</Text>}
		</>
	)
}
```

On macOS, call the picker directly from a button. It reads only the selected
files, keeps their pixel dimensions and aspect ratio, and returns an app-owned
temporary JPEG ref. Install `@octane-xplat/files` and release that JPEG after
preview/upload use — the ref is dead once released.
Failed conversion or writing rejects and cleans outputs from that selection.
Real macOS panel selection is a separate runtime qualification gate.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

const images = await media.pickImages() // [] on cancel
try {
	console.log(images.map((image) => image.uri))
} finally {
	for (const image of images) files.release(image)
}
```

For a live preview surface instead of one-shot capture, use
[`@octane-xplat/camera`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/camera/README.md)'s `CameraView`.

Guide: [Using device features](https://octane-xplat.goddardai.org/platform-services);
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen and
[`CameraDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/CameraDemo.tsrx).

On AppKit, invoke capture from a user action. The first Capture press authorizes
and starts the camera preview; the next takes the photo. Cancel or failure keeps
a null result. Add `NSCameraUsageDescription` to your macOS package's Info.plist.
The still-photo flow requests no microphone permission and rejects gallery saving
before permission or UI. Actual camera capture on AppKit remains unqualified;
deterministic sheet and lifecycle checks use an injected camera backend.

```ts
import { media } from '@octane-xplat/media'

export async function onCapturePress() {
	return media.capturePhoto({ width: 800, height: 600, saveToGallery: false })
}
```

[AppKit setup and ownership example](https://octane-xplat.goddardai.org/platform-services#appkit-still-photos).
