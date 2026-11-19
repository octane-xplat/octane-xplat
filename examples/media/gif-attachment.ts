import { convertGif, isAvailable, releaseVideo } from '@octane-xplat/media-converter'

/** An attachment owner uploads a temporary video, then releases it. */
export async function uploadGifAsVideo(
  sourceUri: string,
  upload: (uri: string) => Promise<void>,
): Promise<void> {
  // 1. Check whether this host can produce an MP4.
  if (!(await isAvailable('mp4'))) {
    throw new Error('MP4 conversion is unavailable on this device')
  }

  // 2. Convert the GIF and wait for the temporary video.
  const job = convertGif(sourceUri, { format: 'mp4' })
  const video = await job.result

  try {
    // 3. Keep the video until the upload finishes.
    await upload(video.uri)
  } finally {
    // 4. Release the temporary file even when upload fails.
    releaseVideo(video)
  }
}
