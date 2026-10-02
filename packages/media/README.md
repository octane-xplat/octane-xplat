# `@octane-xplat/media`

```sh
pnpm add @octane-xplat/media
```

Still-image picking and OS camera capture for Octane xplat apps. iOS runs
`@nativescript/imagepicker` + `@nativescript/camera`, Android the same
plugins over its photo picker/camera intent; web uses `<input
type="file">` (with the `capture` attribute for camera shots, which mobile
browsers route to the camera app); the macOS AppKit dev host reports
`unsupported`.

```ts
import { media } from '@octane-xplat/media'

await media.ensure('photos')
const image = await media.pickImage() // null when the user cancels
const shot = await media.capturePhoto()
```

Every method returns a `PickedImage` — `FileRef` (`name`, opaque `uri`)
plus a `dataUrl` you can hand straight to `Image src`. Cancellation
resolves `null` (or `[]` for `pickImages`), so check the result rather
than catching. `ensure('camera' | 'photos')` resolves
`'granted' | 'denied' | 'unsupported'`.

```tsx
import { useState } from 'octane'
import { Button, Image } from '@octane-xplat/ui'
import { media } from '@octane-xplat/media'

export function PhotoPicker() {
	const [preview, setPreview] = useState<string | null>(null)
	async function pickPhoto() {
		if ((await media.ensure('photos')) !== 'granted') return
		const photo = await media.pickImage()
		if (photo) setPreview(photo.dataUrl)
	}
	return (
		<>
			<Button onPress={pickPhoto}>Choose photo</Button>
			{preview && <Image src={preview} alt="Selected photo" />}
		</>
	)
}
```

For a live preview surface instead of one-shot capture, use
[`@octane-xplat/camera`](../camera/README.md)'s `CameraView`.

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
Exercised by the harness `Services` screen and
[`CameraDemo`](../demos/src/CameraDemo.tsrx).
