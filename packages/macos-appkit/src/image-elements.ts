import type { createAccessibleHost } from './accessible-host'
import type { createCssCascade } from './css-cascade'
import type { PropBag, ElementNode } from './model'
import { NSImageView, NativeClass } from '@octane-xplat/platform/macos'
import { setImageGeometryHandler, notifyImageGeometry } from './image-geometry.ts'
import { disposeImage, updateImage } from './image'
import { drawImageContent } from './image-drawing'

interface Dependencies {
  accessibleHost: Pick<ReturnType<typeof createAccessibleHost>, 'inputTransparentViews'>
  cssCascade: Pick<ReturnType<typeof createCssCascade>, 'setNodeInlineStyle' | 'applyClassName'>
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
  function applyBuiltinImageProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'src' || name === 'placeholder' || name === 'imageCachePolicy') {
      updateImage(
        node.view as NSImageView,
        node.props.src,
        node.props.placeholder,
        node.props.imageCachePolicy,
      )
    } else if (name === 'stretch' && node.type === 'animatedimage') {
      // NSImageScaling — same constants as the objectFit writer.
      // 'aspectFill' degrades to scale-down: AppKit has no crop
      // mode (documented on the shared 'cover' mapping too).
      const scaling: Record<string, number> = {
        aspectFit: 3,
        aspectFill: 0,
        fill: 1,
        none: 2,
      }

      node.view!.imageScaling = scaling[String(value)] ?? 0
    } else if (name === 'autoPlayAnimations' && node.type === 'animatedimage') {
      node.view!.animates = value !== false
    } else if (name === 'animatedImageView' && node.type === 'animatedimage') {
      // The AppKit host is always the animated view.
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'id' || name === 'alt') {
      return
    } else if (name === 'accessibilityLabel') {
      node.view!.accessibilityLabel = String(value ?? '')
      node.view!.accessibilityElement = !!value
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
    }
  }

  function disposeBuiltinImage(node: ElementNode) {
    if ((node.type === 'image' || node.type === 'animatedimage') && node.view) {
      if (node.type === 'image') {
        setImageGeometryHandler(node.view as NSImageView, undefined)
      }

      disposeImage(node.view as NSImageView)
    }
  }

  return { makeImageView, makeAnimatedImageView, applyBuiltinImageProp, disposeBuiltinImage }
}
