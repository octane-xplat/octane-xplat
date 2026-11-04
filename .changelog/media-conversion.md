### Turn GIF attachments into videos and encode WebP images

Use `@octane-xplat/media-converter` for GIF-to-MP4 jobs with progress, cancellation, and temporary-output cleanup. Browser hosts can also produce WebM when their encoder supports it. Native converters take local files; native Windows and GTK adapters are not available yet.

```ts
import { convertGif, releaseVideo } from '@octane-xplat/media-converter'

export async function uploadAnimation(source: string, upload: (uri: string) => Promise<void>) {
  const video = await convertGif(source, { format: 'mp4' }).result
  try {
    await upload(video.uri)
  } finally {
    releaseVideo(video)
  }
}
```

`@octane-xplat/image-manipulator` adds Apple WebP encoding and a bundled browser fallback when canvas cannot encode WebP. Rebuild native apps after installation.

```ts
import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'

export async function toWebP(source: string) {
  const context = ImageManipulator.manipulate(source)
  let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
  try {
    image = await context.renderAsync()
    return await image.saveAsync({ format: SaveFormat.WEBP })
  } finally {
    image?.release()
    context.release()
  }
}
// The receiving owner releases the saved result after its last use.
```

[GIF conversion guide](https://octane-xplat.goddardai.org/package-media-converter) · [WebP encoding guide](https://octane-xplat.goddardai.org/package-image-manipulator#encode-webp)
