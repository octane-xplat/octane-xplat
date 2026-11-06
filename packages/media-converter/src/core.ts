import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { aborted } from './backend-types'
import type { ConversionBackend } from './backend-types'
import type { ConversionJob, ConvertedVideo, GifConversionOptions, VideoFormat } from './types'

function formatValue(value: VideoFormat = 'mp4'): VideoFormat {
  if (value !== 'mp4' && value !== 'webm') {
    throw new TypeError('Expected mp4 or webm')
  }
  return value
}

export function createConverter(backend: ConversionBackend): {
  isAvailable(format?: VideoFormat): Promise<boolean>
  convertGif(source: string, options?: GifConversionOptions): ConversionJob
  releaseVideo(result: ConvertedVideo): void
} {
  const outputs = new Set<string>()
  return {
    async isAvailable(format = 'mp4') {
      return backend.isAvailable(formatValue(format))
    },
    convertGif(source, options = {}) {
      if (typeof source !== 'string' || !source.trim()) {
        throw new TypeError('A GIF source URI is required')
      }
      const format = formatValue(options.format)
      const backgroundColor = options.backgroundColor ?? '#000000'
      if (!/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
        throw new TypeError('backgroundColor must use #RRGGBB')
      }
      const bitrate = options.bitrate ?? 2_000_000
      if (!Number.isSafeInteger(bitrate) || bitrate < 1 || bitrate > 100_000_000) {
        throw new TypeError('bitrate must be an integer from 1 to 100000000')
      }
      if (options.onProgress !== undefined && typeof options.onProgress !== 'function') {
        throw new TypeError('onProgress must be a function')
      }
      let cancelled = false,
        settled = false,
        lastProgress = -1
      let progressError: unknown
      const cancelActions = new Set<() => void>()
      // Defer startup so callers can cancel before native work or decoding begins.
      const result = Promise.resolve()
        .then(async () => {
          if (cancelled) {
            throw aborted()
          }
          const available = await backend.isAvailable(format)
          if (cancelled) {
            throw aborted()
          }
          if (!available) {
            throw new UnavailabilityError(`GIF to ${format} conversion`)
          }
          const output = await backend.convert(
            source,
            { format, backgroundColor, bitrate },
            {
              cancelled: () => cancelled,
              onCancel(action) {
                if (cancelled) {
                  action()
                } else {
                  cancelActions.add(action)
                }
              },
              progress(value) {
                if (!cancelled && !settled && Number.isFinite(value)) {
                  const progress = Math.max(lastProgress, Math.min(1, Math.max(0, value)))
                  if (progress !== lastProgress) {
                    lastProgress = progress
                    try {
                      options.onProgress?.(progress)
                    } catch (error) {
                      progressError = error
                      cancelled = true
                      for (const action of cancelActions) {
                        action()
                      }
                    }
                  }
                }
              },
            },
          )
          if (cancelled) {
            backend.release(output.uri)
            throw progressError ?? aborted()
          }
          outputs.add(output.uri)
          return output
        })
        .catch((error: unknown) => {
          throw progressError ?? error
        })
        .finally(() => {
          settled = true
          cancelActions.clear()
        })
      return {
        result,
        cancel() {
          if (settled || cancelled) {
            return
          }
          cancelled = true
          for (const action of cancelActions) {
            action()
          }
          cancelActions.clear()
        },
      }
    },
    releaseVideo(result) {
      if (outputs.has(result.uri)) {
        backend.release(result.uri)
        outputs.delete(result.uri)
      }
    },
  }
}
