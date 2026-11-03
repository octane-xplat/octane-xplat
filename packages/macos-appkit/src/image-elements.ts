import { NSImageView, NativeClass } from '@octane-xplat/platform/macos'
import { drawImageContent } from './image-drawing'
import { notifyImageGeometry } from './image-geometry.ts'
import type { PropBag } from './model'
import { updateImage } from './image'

import type { createAccessibleHost } from './accessible-host'

interface Dependencies {
  accessibleHost: Pick<ReturnType<typeof createAccessibleHost>, 'inputTransparentViews'>
}

export function createImageElements(deps: Dependencies) {
  class InputImageView extends NSImageView {
    static {
      NativeClass(this)
    }
    // Custom fit drawing must also run for layer-backed image views.
    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    get wantsUpdateLayer(): boolean {
      return false
    }
    drawRect(rect: any): void {
      if (!drawImageContent(this)) {
        super.drawRect(rect)
      }
    }
    setFrameSize(size: { width: number; height: number }): void {
      const previousWidth = this.frame.size.width,
        previousHeight = this.frame.size.height
      super.setFrameSize(size)
      if (size.width !== previousWidth || size.height !== previousHeight) {
        this.needsDisplay = true
        notifyImageGeometry(this)
      }
    }
    viewDidMoveToWindow(): void {
      super.viewDidMoveToWindow()
      notifyImageGeometry(this)
    }
    viewDidChangeBackingProperties(): void {
      super.viewDidChangeBackingProperties()
      notifyImageGeometry(this)
    }
    hitTest(point: any): any {
      return deps.accessibleHost.inputTransparentViews.has(this) ? null : super.hitTest(point)
    }
  }

  function makeImageView(props: PropBag) {
    const image = InputImageView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 24, height: 24 },
    })

    image.translatesAutoresizingMaskIntoConstraints = false
    updateImage(image, props.src, props.placeholder, props.imageCachePolicy)

    return image
  }

  /** `animatedimage` — the shared animation extension element. Same decode
   *  path as `image` (an NSImage decoded from GIF data carries its frames);
   *  `animates` is the only difference. The property is deprecated in macOS 14
   *  but still drives GIF playback — AppKit has no replacement animation view. */
  function makeAnimatedImageView(props: PropBag) {
    const image = makeImageView(props)
    image.animates = true
    return image
  }
  return {
    makeImageView,
    makeAnimatedImageView,
  }
}
