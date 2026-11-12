import { useLayoutEffect, useRef } from 'octane'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'
import {
  NSNotificationCenter,
  NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

// AppKit's nested Mason document can retain its initial empty height while
// descendants lay out beyond its bounds. Feed their measured extent back as
// a minimum, including after disclosure, filtering, and new rows.
export function usePanelContent(_minHeight: number, onMeasure: (height: number) => void) {
  const ref = useRef<any>(null)
  const viewportRef = useRef<ScrollableAreaHandle | null>(null)
  const pendingOffset = useRef<number | null>(null)
  const requestMeasure = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastHeight = 0
    let positioned = false
    const children = (view: any): any[] => {
      const views = view?.subviews

      return Array.from({ length: Number(views?.count ?? 0) }, (_, i) => views.objectAtIndex(i))
    }

    const watch = (view: any) => {
      view.postsFrameChangedNotifications = true
      for (const child of children(view)) {
        watch(child)
      }
    }

    const measure = () => {
      timer = undefined

      const view = ref.current

      if (disposed || !view) {
        return
      }

      watch(view)

      const frames = children(view)
        .filter((child) => !child.hidden && Number(child.frame?.size?.height) > 0)
        .map((child) => child.frame)

      if (!frames.length) {
        return
      }

      const start = Math.min(...frames.map((f) => Number(f.origin.y)))
      const end = Math.max(...frames.map((f) => Number(f.origin.y) + Number(f.size.height)))
      const flipped = typeof view.isFlipped === 'function' ? view.isFlipped() : view.isFlipped
      // The stylesheet uses symmetric block padding. Read its rendered inset
      // rather than duplicating the stylesheet's spacing in this helper.
      const inset = Math.max(0, flipped ? start : Number(view.frame.size.height) - end)
      const height = Math.ceil(end - start + inset * 2)

      if (height !== lastHeight) {
        const scroll: any = viewportRef.current?.native

        if (scroll && pendingOffset.current === null) {
          const clip = scroll.contentView.bounds
          const document = scroll.documentView
          const range = Math.max(0, Number(document.frame.size.height) - Number(clip.size.height))
          const flipped =
            typeof document.isFlipped === 'function' ? document.isFlipped() : document.isFlipped

          pendingOffset.current = positioned
            ? flipped
              ? Number(clip.origin.y)
              : range - Number(clip.origin.y)
            : 0
        }

        lastHeight = height
        onMeasure(height)
      }

      const viewport = viewportRef.current

      if (viewport && pendingOffset.current !== null) {
        const scroll: any = viewport.native

        scroll.window?.contentView?.layoutSubtreeIfNeeded()

        const viewportHeight = Number(scroll.contentView.bounds.size.height)
        const documentHeight = Number(scroll.documentView.frame.size.height)

        // Keep the request until AppKit has applied the new document size.
        if (Math.abs(documentHeight - Math.max(height, viewportHeight)) < 1) {
          viewport.scrollToOffset({ block: pendingOffset.current })
          pendingOffset.current = null
          positioned ||= documentHeight > viewportHeight
        }
      }
    }

    const schedule = () => {
      if (!disposed && timer === undefined) {
        timer = setTimeout(measure, 0)
      }
    }

    const center = NSNotificationCenter.defaultCenter

    requestMeasure.current = schedule

    const observer = center.addObserverForNameObjectQueueUsingBlock(
      NSViewFrameDidChangeNotification,
      null,
      null,
      (notification: any) => {
        let view = notification.object
        const scroll: any = viewportRef.current?.native

        if (view === scroll?.documentView || view === scroll?.contentView) {
          schedule()
          return
        }

        while (view && view !== ref.current) {
          view = view.superview
        }

        if (view) {
          schedule()
        }
      },
    )

    schedule()
    return () => {
      disposed = true
      requestMeasure.current = null
      clearTimeout(timer)
      center.removeObserver(observer)
    }
  }, [])

  // Rows can mount without changing the initially collapsed parent's frame.
  // Rebind frame observers after each render as well as after native layout.
  // null opts out of Octane's inferred dependencies for this ref-only effect.
  useLayoutEffect(() => requestMeasure.current?.(), null)
  return {
    ref,
    viewportRef,
  }
}
