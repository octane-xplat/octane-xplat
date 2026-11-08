import { CameraCaptureError } from './types'

const failed = (message: string) =>
  new CameraCaptureError({ kind: 'unavailable', operation: 'switchCamera', message })

/** Fixed-size video track. Hardware video sources can be replaced without
 *  replacing the track observed by MediaRecorder or the preview. */
export interface RecordingVideoSource {
  readonly stream: MediaStream
  /** Retain the last canvas frame while the old camera is released. */
  hold(): void
  /** Resolve only after drawing a decoded frame from this source. */
  setSource(stream: MediaStream): Promise<void>
  release(): void
}

export function supportsRecordingVideoSource(): boolean {
  return (
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    typeof CanvasCaptureMediaStreamTrack !== 'undefined' &&
    typeof CanvasCaptureMediaStreamTrack.prototype.requestFrame === 'function'
  )
}

export function createRecordingVideoSource(
  width: number,
  height: number,
  frameRate: number,
): RecordingVideoSource {
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw failed('A 2D recording surface is unavailable')
  }

  const stream = canvas.captureStream(0)
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
  let active: HTMLVideoElement | undefined
  let pending:
    | { video: HTMLVideoElement; resolve: () => void; reject: (error: Error) => void }
    | undefined

  let released = false
  const clearVideo = (video: HTMLVideoElement) => {
    video.pause()
    video.srcObject = null
  }

  const hold = () => {
    if (active) {
      clearVideo(active)
      active = undefined
    }

    if (pending) {
      clearVideo(pending.video)
      pending.reject(failed('Camera switching was cancelled'))
      pending = undefined
    }
  }

  const forgetPending = (video: HTMLVideoElement) => {
    if (pending?.video === video) {
      pending = undefined
    }
  }

  const timer = setInterval(
    () => {
      if (released) {
        return
      }

      try {
        const video = pending && pending.video.readyState >= 2 ? pending.video : active

        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
          const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
          const w = video.videoWidth * scale
          const h = video.videoHeight * scale

          context.drawImage(video, (width - w) / 2, (height - h) / 2, w, h)
        } else {
          // requestFrame alone may not encode an unchanged canvas. Mark
          // the retained content dirty without changing its pixels.
          context.drawImage(canvas, 0, 0)
        }

        track.requestFrame()
        if (video && video.videoWidth > 0 && video.videoHeight > 0 && pending?.video === video) {
          const completed = pending

          pending = undefined
          if (active) {
            clearVideo(active)
          }

          active = video
          completed.resolve()
        }
      } catch (error) {
        pending?.reject(error instanceof Error ? error : failed('Could not draw a camera frame'))
      }
    },
    1000 / Math.min(60, Math.max(1, frameRate)),
  )

  return {
    stream,
    hold,
    setSource: async (source) => {
      if (released) {
        throw failed('The recording source is released')
      }

      if (pending) {
        throw failed('Another camera source is pending')
      }

      const video = document.createElement('video')

      video.muted = true
      video.playsInline = true
      video.srcObject = source

      let timeout: ReturnType<typeof setTimeout> | undefined

      try {
        await new Promise<void>((resolve, reject) => {
          pending = { video, resolve, reject }
          timeout = setTimeout(
            () => reject(failed('The camera did not provide a frame before timeout')),
            5000,
          )

          void video.play().catch(reject)
        })
      } catch (error) {
        forgetPending(video)
        clearVideo(video)
        throw error
      } finally {
        clearTimeout(timeout)
      }
    },
    release: () => {
      released = true
      clearInterval(timer)
      hold()
      stream.getTracks().forEach((track) => track.stop())
    },
  }
}
