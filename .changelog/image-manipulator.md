### Resize and crop photo attachments

The new image-manipulator package transforms image pixels and exports JPEG or
PNG files using an Expo-shaped editing context. Rendered images and saved files
have separate cleanup so a preview can outlive its editing context.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function resizePhoto(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.resize({ width: 800 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'jpeg', compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}
// The result's preview/upload owner calls releaseImage(result) when finished.
```

[Image manipulation guide and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/image-manipulator/README.md)
