import type { ConvertedVideo, VideoFormat } from './types'

export interface ConversionRequest {
  format: VideoFormat
  backgroundColor: string
  bitrate: number
}

export interface ConversionControl {
  cancelled(): boolean
  onCancel(action: () => void): void
  progress(value: number): void
}

export interface ConversionBackend {
  isAvailable(format: VideoFormat): Promise<boolean>
  convert(
    source: string,
    request: ConversionRequest,
    control: ConversionControl,
  ): Promise<ConvertedVideo>
  release(uri: string): void
}

export function aborted(): Error {
  const error = new Error('Media conversion was cancelled')

  error.name = 'AbortError'
  return error
}
