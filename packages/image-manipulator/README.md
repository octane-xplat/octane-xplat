# Transform images

Resize an attachment, rotate a photo, or produce a cropped image file with
`@octane-xplat/image-manipulator`. Its chainable API follows Expo's modern
ImageManipulator API and uses Octane hooks. Image picking remains in
`@octane-xplat/media`; crop selection remains in `@octane-xplat/image-crop`.

```sh
bun add @octane-xplat/image-manipulator
```

In an existing Xplat app, call this helper from your photo attachment action.
Pass the picked photo's URI. It returns a new JPEG without changing the source.
Keep the returned URI while your preview or upload uses it, then release it.

```ts
import { ImageManipulator, SaveFormat, releaseImage } from '@octane-xplat/image-manipulator'

export async function resizeAttachment(source: string) {
	const context = ImageManipulator.manipulate(source)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.resize({ width: 800 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}

// Later, after a returned result is no longer being displayed or uploaded:
export const discardAttachment = releaseImage
```

Use the returned `uri` as an image source while the result's owner is alive.
This preview component owns the result: replacing its prop or removing the
component releases the previous file. A parent that keeps the result for another
consumer must instead own that cleanup itself.

```tsx
import { useEffect } from 'octane'
import { Image } from '@octane-xplat/ui'
import { releaseImage } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'

export function AttachmentPreview({ result }: { result: ImageResult }) {
	useEffect(() => () => releaseImage(result), [result])
	return <Image src={result.uri} alt="Resized attachment" />
}
```

## Crop a selection

`image-crop` reports selection geometry, not image files. Pass the natural
rectangle from `toNaturalCrop` to the maintained [exportCrop helper](examples/crop.ts).
Copy that helper into your app. It rounds the selection outward to whole image
pixels and clips it to the source bounds. This continuation assumes `crop`,
`viewportSize`, and `naturalSize` describe your current selection and image.

```ts
import { containFrame, toNaturalCrop } from '@octane-xplat/image-crop'
import { exportCrop } from './export-crop'

// Inside your Crop action, with the current image and selection:
const frame = containFrame(viewportSize, naturalSize)
const natural = toNaturalCrop(crop, { width: frame.width, height: frame.height }, naturalSize)
const result = await exportCrop(sourceUri, natural)
// The caller now owns result; preview/upload it, then call releaseImage(result).
```

For a known rectangle, queue the operations directly. Coordinates refer to
the image produced by all preceding operations. Crop rectangles and resize
dimensions must be whole pixels; an empty or out-of-bounds crop rejects.
Positive rotation angles turn clockwise.

```ts
import { ImageManipulator, FlipType } from '@octane-xplat/image-manipulator'

export async function transformPhoto(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.crop({ originX: 20, originY: 10, width: 100, height: 80 })
		context.rotate(90).flip(FlipType.Horizontal)
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'png' })
	} finally {
		image?.release()
		context.release()
	}
}
```

## Own contexts, pixels, and files

`renderAsync()` returns an immutable snapshot of the operations queued at that
call. A later edit or `reset()` does not change that snapshot. Reset starts again
from the initially loaded image. An unreleased image reference can become the
source of another context; the child retains its source independently.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function makeThumbnail(sourceUri: string) {
	const original = ImageManipulator.manipulate(sourceUri)
	const pixels = await original.renderAsync()
	const thumbnail = ImageManipulator.manipulate(pixels)
	pixels.release()
	original.release()
	let image: Awaited<ReturnType<typeof thumbnail.renderAsync>> | undefined
	try {
		thumbnail.resize({ width: 160 })
		image = await thumbnail.renderAsync()
		return await image.saveAsync({ format: 'png' })
	} finally {
		image?.release()
		thumbnail.release()
	}
}
```

The three owners have different lifetimes. `context.release()` ends the editing
queue; `image.release()` ends a rendered reference; `releaseImage(result)` deletes
only an encoded output created by this API instance. Each release is idempotent.
Already-started saves retain their pixels until they finish, and saved files
survive context/image release. Never release a result while it is displayed or
being uploaded.

```ts
import { releaseImage } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'

export function discardPreview(result: ImageResult) {
	releaseImage(result)
}
```

## Use a context in a component

`useImageManipulator` owns the context for a component. A source or initial-size
change creates a new context and releases the old one. Unmount releases it too.
Rendered references and encoded results still need their own cleanup. Pending
operations can finish with the earlier source; the app owns whether to accept
or discard such a result.

```tsx
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { useImageManipulator, releaseImage } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'

export function ResizeAction(props: { source: string; onResult: (result: ImageResult) => void }) {
	const context = useImageManipulator(props.source)
	const [status, setStatus] = useState('Ready')
	async function resize() {
		let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
		let result: ImageResult | undefined
		try {
			context.reset().resize({ width: 800 })
			image = await context.renderAsync()
			result = await image.saveAsync({ format: 'jpeg', compress: 0.8 })
			props.onResult(result) // The receiving owner must eventually release this result.
			result = undefined // Ownership was accepted by the callback.
			setStatus('Photo resized')
		} catch {
			setStatus('Could not resize this photo')
		} finally {
			if (result) releaseImage(result)
			image?.release()
		}
	}
	return (
		<VStack>
			<Button
				label="Resize photo"
				clickAction={() => {
					void resize()
				}}
			/>
			<Text>{status}</Text>
		</VStack>
	)
}
```

## Platforms and failure behavior

Check availability before offering the action. A missing backend throws
`UnavailabilityError`; decode, bounds, encoding, and file errors reject rather
than returning the original image or reporting a successful save.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function canTransformImages() {
	return ImageManipulator.supported && (await ImageManipulator.isAvailable())
}
```

| Target               | Source and output constraints                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web                  | Browser-readable image URLs/data URLs. Remote servers must permit CORS. Results are blob URLs scoped to the current page. Encoding support follows the browser; an unavailable format rejects. |
| iOS                  | App file/resource paths, file URLs, base64 data URLs, and HTTP(S) downloads. UIKit produces app-temporary JPEG/PNG files; WEBP encoding rejects.                                               |
| Android              | File/resource paths, file/content URLs, base64 data URLs, and HTTP(S) downloads. Bitmap/Canvas produces app-temporary files. Runtime verification is deferred.                                 |
| macOS AppKit         | Absolute file paths, file URLs, base64 data URLs, and HTTP(S) downloads. NSBitmapImageRep produces app-temporary JPEG/PNG files; WEBP encoding rejects.                                        |
| Native Windows / GTK | No image backend is wired yet; availability is false. A browser frontend on either OS uses the web backend.                                                                                    |

The API follows Expo's current context, option, result, and constant names.
`ImageManipulatorContext` and `ImageRef` are public TypeScript interfaces; create
them through the factory and render method. The deprecated `manipulateAsync`
API is not exported. Extent is web-only, matching Expo's platform scope.

```ts
// Web-specific .web.ts module:
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function addBorder(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.extent({
			width: 400,
			height: 400,
			originX: 20,
			originY: 20,
			backgroundColor: '#ffffff',
		})
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'png', base64: true })
	} finally {
		image?.release()
		context.release()
	}
}
```

Native transformations execute on the calling JavaScript thread, so large images
can delay interaction. Initial size bounds limit working pixels, not peak decoder
memory. Animated inputs are processed as still images. Temporary files and blob
URLs are not durable application records; copy/upload a result before releasing
it when you need to retain it.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export function boundedContext(sourceUri: string) {
	return ImageManipulator.manipulate(sourceUri, { maxWidth: 1200, maxHeight: 1200 })
}
```

Verification distinguishes [programmatic pixel/runtime checks](../../.agents/docs/notes/image-manipulator.md)
from source checks and OS interaction. No screenshots are required.
