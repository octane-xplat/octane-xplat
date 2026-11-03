import { backend } from './backend'
import { createConverter } from './core'
import type { ConversionJob, ConvertedVideo, GifConversionOptions, VideoFormat } from './types'
const converter = createConverter(backend)
/** Check the requested output encoder. Actual dimensions and input validity are checked by conversion.
 * @example
 * import { isAvailable } from '@octane-xplat/media-converter'
 * const enabled = await isAvailable('mp4')
 */
export function isAvailable(format?: VideoFormat): Promise<boolean> {
  return converter.isAvailable(format)
}

/** Convert one GIF traversal to an opaque video. Odd dimensions are padded on the right/bottom.
 * @example
 * import { convertGif } from '@octane-xplat/media-converter'
 * const job = convertGif(sourceUri, { format: 'mp4' })
 * const video = await job.result
 */
export function convertGif(source: string, options?: GifConversionOptions): ConversionJob {
  return converter.convertGif(source, options)
}

/** Release a temporary output created by this API instance; never deletes an input.
 * @example
 * import { releaseVideo } from '@octane-xplat/media-converter'
 * releaseVideo(video)
 */
export function releaseVideo(result: ConvertedVideo): void {
  converter.releaseVideo(result)
}
