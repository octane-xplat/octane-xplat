import { convertGif, isAvailable, releaseVideo } from '@octane-xplat/media-converter'

/** An attachment owner uploads a temporary video, then releases it. */
export async function uploadGifAsVideo(
  sourceUri: string,
  upload: (uri: string) => Promise<void>,
): Promise<void> {
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
