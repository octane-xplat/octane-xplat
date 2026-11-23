import { media, type PickedImage } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

/** Bind capture to a button; dispose when this screen's owner ends. */
export function createStillPhotoAction(show: (image: PickedImage) => void) {
  // 1. Track the screen's lifetime, an in-flight capture, and its current image.
  let disposed = false
  let pending = false
  let current: PickedImage | null = null

  return {
    async capture() {
      // 2. Start at most one capture while the screen is active.
      if (disposed || pending) {
        return
      }

      pending = true
      try {
        const next = await media.capturePhoto({ saveToGallery: false })

        if (!next) {
          return
        } // Cancel or failure keeps the current preview.

        // 3. Release an image received after disposal, or replace the old one.
        if (disposed) {
          files.release(next)
          return
        }

        if (current) {
          files.release(current)
        }

        current = next
        show(next)
      } finally {
        pending = false
      }
    },
    dispose() {
      // 4. End ownership and release the remaining image when the screen closes.
      disposed = true
      if (current) {
        files.release(current)
      }

      current = null
    },
  }
}
