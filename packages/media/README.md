# `@octane-xplat/media`

```sh
pnpm add @octane-xplat/media @octane-xplat/files
```

Still-image picking and OS camera capture for Octane xplat apps. iOS runs
`@nativescript/imagepicker` + `@nativescript/camera`, Android the same
plugins over its photo picker/camera intent; web uses `<input
type="file">` (with the `capture` attribute for camera shots, which mobile
browsers route to the camera app). macOS AppKit uses the normal file picker
for existing images and an app-owned Capture/Cancel sheet for still photos.
Photos-library browsing and gallery saving remain unsupported.

```ts
import { media } from '@octane-xplat/media'

const image = await media.pickImage() // null when the user cancels
const shot = await media.capturePhoto()
```

Every method returns a `PickedImage` — a `FileRef` (`name`, opaque `uri`)
you can hand straight to `Image src`, or to `files.readBytes()` for an
upload body. Cancellation resolves `null` (or `[]` for `pickImages`), so
check the result rather than catching. `getPermissions('camera' | 'photos')`
reads without prompting and `requestPermissions('camera' | 'photos')` may
prompt — both resolve `{status, granted, canAskAgain}`.

```tsx
import { useState } from 'octane'
import { Button, Image } from '@octane-xplat/ui'
import { media } from '@octane-xplat/media'
import type { PickedImage } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export function PhotoPicker() {
	const [preview, setPreview] = useState<PickedImage | null>(null)
	async function pickPhoto() {
		const photo = await media.pickImage()
		if (!photo) return
		// The ref is a file handle — keep it alive while it displays; release
		// the previous pick once the new one is showing.
		const previous = preview
		setPreview(photo)
		if (previous) files.release(previous)
	}
	return (
		<>
			<Button clickAction={pickPhoto}>Choose photo</Button>
			{preview && <Image src={preview.uri} alt="Selected photo" />}
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
[`@octane-xplat/camera`](../camera/README.md)'s `CameraView`.

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen and
[`CameraDemo`](../demos/src/CameraDemo.tsrx).

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

[AppKit setup and ownership example](../../docs/platform/platform-services.md#appkit-still-photos).
