# Convert a GIF to video

> GIF-to-video conversion jobs for Octane Xplat

Turn an animated GIF attachment into a video with
`@octane-xplat/media-converter`. Still-image resizing and JPEG/PNG/WebP encoding
belong in [image-manipulator](package-image-manipulator.md).

In an existing Xplat app, install the package. Rebuild native apps after
installation so their conversion bridge is included.

```sh
bun add @octane-xplat/media-converter
```


[Generated API reference](https://octane-xplat.goddardai.org/api-media-converter).

## Convert an attachment

Put this helper in your attachment action. Supply a readable GIF URI and your
upload function. It converts one traversal of the animation to MP4, uploads it,
and releases the temporary output even if uploading fails. The original GIF
is preserved. Native inputs must be local absolute paths or file URLs; copy
picked content into an app-owned local file first when necessary.

```ts
import { convertGif, isAvailable, releaseVideo } from '@octane-xplat/media-converter'

export async function uploadAnimation(
  sourceUri: string,
  upload: (videoUri: string) => Promise<void>,
) {
  if (!(await isAvailable('mp4'))) {
    throw new Error('MP4 conversion is unavailable on this device')
  }
  const job = convertGif(sourceUri, { format: 'mp4' })
  const video = await job.result
  try {
    await upload(video.uri)
  } finally {
    releaseVideo(video)
  }
}
```

A successful result contains the video URI, pixel dimensions, duration in
milliseconds, and MIME type. Keep the result while it is displayed or uploaded;
release it when its last consumer finishes. Copy it into durable storage if it
must survive the current page or temporary directory. The maintained
[attachment helper](../../packages/media-converter/examples/attachment.ts) follows the same ownership pattern.

```ts
import { convertGif, releaseVideo } from '@octane-xplat/media-converter'

export async function inspectConversion(sourceUri: string) {
  const video = await convertGif(sourceUri).result
  try {
    return { width: video.width, height: video.height, durationMs: video.duration }
  } finally {
    releaseVideo(video)
  }
}
```

## Show progress and cancel

The job exposes a promise and an idempotent cancellation function. Cancellation
rejects the promise with an error named `AbortError` after backend cleanup.
Progress is a fraction of frames processed, from zero to one; wait for the
promise before consuming the file. A throwing progress callback cancels the job
and rejects its promise. This helper gives the UI both operations.

```ts
import { convertGif } from '@octane-xplat/media-converter'

export function startAttachment(sourceUri: string, updateProgress: (value: number) => void) {
  const job = convertGif(sourceUri, {
    format: 'mp4',
    backgroundColor: '#ffffff',
    bitrate: 2_000_000,
    onProgress: updateProgress,
  })
  return { cancel: () => job.cancel(), result: job.result }
}
```

## Formats and limits

GIF frame delays are retained for one traversal; the GIF's repeat count is
ignored. A missing or zero frame delay becomes 100 milliseconds. Videos are
opaque: transparent pixels are composited onto black by default, or the supplied
`#RRGGBB` background. Odd widths/heights are padded on the right/bottom to the
next even pixel. The default target bitrate is 2,000,000 bits per second.

```ts
import { convertGif } from '@octane-xplat/media-converter'

export function whiteBackgroundVideo(sourceUri: string) {
  return convertGif(sourceUri, { backgroundColor: '#ffffff', bitrate: 2_000_000 })
}
```

| Target               | Inputs and outputs                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web                  | Fetchable GIF URLs, blob URLs, and data URLs. Remote servers must allow CORS. H.264/MP4 and VP9/WebM depend on the browser's WebCodecs encoders. Outputs are page-owned blob URLs.             |
| iOS / macOS          | Local GIF paths/file URLs. ImageIO decoding and AVFoundation H.264/MP4 encoding. WebM is unavailable.                                                                                          |
| Android              | Local GIF paths/file URLs. Glide GIF decoding and MediaCodec H.264/MP4 encoding. Requires an encoder accepting planar or semiplanar YUV buffers at the source dimensions. WebM is unavailable. |
| Native Windows / GTK | No backend is wired yet. Browser frontends use the web backend.                                                                                                                                |

Availability checks identify an encoder, not whether every input size can be
encoded. Invalid GIFs, unsupported dimensions/formats, read failures, and encoding
failures reject. Inputs are limited to 64 MiB, 1,000 frames, 4,194,304 canvas
pixels, and a 60-second traversal. These are admission limits, not a guaranteed
peak-memory bound: browser fetching/parsing and encoding can retain additional
buffers. Browser decoding/compositing runs on the calling thread and yields
between frames; native conversions run on background threads.

```ts
import { convertGif, isAvailable } from '@octane-xplat/media-converter'

export async function startWebM(sourceUri: string) {
  if (!(await isAvailable('webm'))) throw new Error('WebM encoding is unavailable')
  return convertGif(sourceUri, { format: 'webm' })
}
```

Chromium, the macOS engine, and the iOS simulator engine have programmatic
runtime coverage. Android has SDK compilation and delay-parser coverage.
macOS also has a source-consumer JavaScript/native bridge check. Android device
runtime and iOS installed-consumer bridge delivery remain separate checks.
See the [implementation and qualification boundaries](../../.agents/docs/notes/media-conversion.md).
