import {
  NSAttributedString,
  NSBundle,
  NSColor,
  NSFontAttributeName,
  NSForegroundColorAttributeName,
  NSImage,
  NSTabViewItem,
  NSURL,
  NSURLSession,
  type NSURLSessionDataTask,
} from '@octane-xplat/platform/macos'
import { resolveFont } from './fonts'
import { registerGestureClass } from './gestures'
import { loadImage } from './image'

/** NSTabView's ordinary tabs do not display the item's image. Include it in
 * label measurement/drawing rather than accepting an invisible iconSource. */
export class IconTabItem extends NSTabViewItem {
  static {
    registerGestureClass(this)
  }
  sizeOfLabel(minimum: boolean) {
    const size = super.sizeOfLabel(minimum)

    return this.image ? { width: size.width + 20, height: Math.max(16, size.height) } : size
  }

  drawLabelInRect(truncate: boolean, rect: any) {
    if (!this.image) {
      super.drawLabelInRect(truncate, rect)
      return
    }

    this.image.drawInRectFromRectOperationFraction(
      { origin: rect.origin, size: { width: 16, height: 16 } },
      { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
      2,
      1,
    )

    super.drawLabelInRect(truncate, {
      origin: { x: rect.origin.x + 20, y: rect.origin.y },
      size: { width: Math.max(0, rect.size.width - 20), height: rect.size.height },
    })
  }
}

export function resolveTabIcon(
  source: any,
  style: Record<string, any>,
  resolveIconColor: (value: any) => NSColor,
): NSImage | null {
  if (source == null || source === '') {
    return null
  }

  if (typeof source !== 'string') {
    // Shared ImageSource-like handles expose their platform image.
    const image = source.macos ?? source.nativeImage ?? source

    if (typeof image.drawInRectFromRectOperationFraction !== 'function') {
      throw new TypeError('AppKit tabviewitem iconSource host object must contain an NSImage')
    }

    return image
  }

  if (source.startsWith('sys://')) {
    return NSImage.imageWithSystemSymbolNameAccessibilityDescription(source.slice(6), null)
  }

  if (source.startsWith('font://')) {
    const text = NSAttributedString.alloc().initWithStringAttributes(source.slice(7), {
      [NSFontAttributeName]: resolveFont(
        Number(style.fontSize ?? 17),
        style.fontWeight ?? 400,
        style.iconFontFamily ?? style.fontFamily,
      ),
      [NSForegroundColorAttributeName]:
        style.color == null ? NSColor.labelColor : resolveIconColor(style.color),
    })

    const size = text.size()

    if (size.width <= 0 || size.height <= 0) {
      return null
    }

    const image = NSImage.alloc().initWithSize(size)

    image.lockFocus()
    try {
      text.drawAtPoint({ x: 0, y: 0 })
    } finally {
      image.unlockFocus()
    }

    return image
  }

  if (source.startsWith('res://')) {
    return NSImage.imageNamed(source.slice(6))
  }

  if (source.startsWith('~/')) {
    return loadImage(NSBundle.mainBundle.resourcePath + '/' + source.slice(2))
  }

  return loadImage(source)
}

interface IconRequest {
  source: unknown
  fontInputs: unknown[]
  task?: NSURLSessionDataTask
}

interface TabIconTarget {
  // AppKit accepts nil to clear an existing tab image.
  image: NSImage | null
}

const iconRequests = new WeakMap<TabIconTarget, IconRequest>()

export function cancelTabIcon(item: TabIconTarget) {
  const request = iconRequests.get(item)
  iconRequests.delete(item)
  request?.task?.cancel()
}

export function updateTabIcon(
  item: TabIconTarget,
  source: unknown,
  style: Record<string, any>,
  resolveIconColor: (value: any) => NSColor,
  onImageLoaded: () => void,
) {
  const fontInputs =
    typeof source === 'string' && source.startsWith('font://')
      ? [style.fontSize, style.fontWeight, style.fontFamily, style.iconFontFamily, style.color]
      : []
  const previous = iconRequests.get(item)
  if (
    previous &&
    Object.is(previous.source, source) &&
    fontInputs.every((value, index) => Object.is(value, previous.fontInputs[index]))
  ) {
    return
  }

  cancelTabIcon(item)
  const request: IconRequest = { source, fontInputs }
  if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
    item.image = null
    request.task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(
      NSURL.URLWithString(source),
      (data, _response, error) => {
        if (iconRequests.get(item) !== request) {
          return
        }
        item.image = data && !error ? NSImage.alloc().initWithData(data) : null
        onImageLoaded()
      },
    )
    iconRequests.set(item, request)
    request.task.resume()
  } else {
    item.image = resolveTabIcon(source, style, resolveIconColor)
    iconRequests.set(item, request)
  }
}
