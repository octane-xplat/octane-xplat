/** Encoded video containers. MP4 uses H.264; WebM uses VP9 (web only). */
export type VideoFormat = 'mp4' | 'webm'

/** Options for one traversal of a GIF's frames, ignoring its loop count. */
export interface GifConversionOptions {
  /** Output container. @default 'mp4' */
  format?: VideoFormat
  /** Opaque background for transparent pixels, in #RRGGBB form. @default '#000000' */
  backgroundColor?: string
  /** Target video bitrate in bits per second. @default 2000000 */
  bitrate?: number
  /** Fraction of frames processed, from 0 to 1. Completion is established by result. */
  onProgress?: (progress: number) => void
}

/** A temporary encoded file. The receiving owner must eventually release it. */
export interface ConvertedVideo {
  uri: string
  width: number
  height: number
  /** One traversal's duration in milliseconds. */
  duration: number
  mimeType: 'video/mp4' | 'video/webm'
}

/** Conversion work with explicit cancellation; cancellation rejects result with AbortError. */
export interface ConversionJob {
  result: Promise<ConvertedVideo>
  /** Idempotent. Has no effect after the result settles. */
  cancel(): void
}
