/** @jsxImportSource @octane-xplat/jsx */
import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from '../../props'

/** Screen position of the app surface's top-left — the topmost attached
 *  ancestor's location. `(0,0)` for full-screen windows; non-zero under
 *  Android multi-window or a moved iPadOS window. A detached or oddly
 *  rooted ancestor still reports its own position, so the subtraction
 *  degrades to the old screen-relative value rather than failing. */
function surfaceOrigin(view: any): { x: number; y: number } {
  let root = view

  while (root?.parent) {
    root = root.parent
  }

  const point = root?.getLocationOnScreen?.()

  return point ? { x: point.x, y: point.y } : { x: 0, y: 0 }
}

function readBounds(view: any): MeasureBounds | null {
  const point = view?.getLocationOnScreen?.()
  const size = view?.getActualSize?.()

  if (!point || !size) {
    return null
  }

  const origin = surfaceOrigin(view)

  return {
    x: point.x - origin.x,
    y: point.y - origin.y,
    width: size.width,
    height: size.height,
  }
}

/** Binds to a NativeScript view and observes app-surface DIP bounds by default. */
export function useMeasure$(options: UseMeasureOptions = {}): MeasureResult {
  const bounds$ = useSignal$<MeasureBounds | null>(null)
  const detach = useRef<(() => void) | null>(null)
  const disposed = useRef(false)
  const observe = options.observe ?? true
  const ref = useCallback(
    (view: any) => {
      detach.current?.()
      detach.current = null
      // Universal roots retire hook signals before delivering null refs.
      if (disposed.current) {
        return
      }

      if (!view) {
        bounds$.set(null)
        return
      }

      // A view reporting 0×0 before its first layout is not yet usable; a
      // real zero-size element publishes 0×0 once a layout has completed.
      // `layoutChanged` (or the platform's layout-valid flag) is that
      // witness; a nonzero size proves a layout already ran.
      let laidOut = view.isLayoutValid === true
      let released = false
      const scrollParents: any[] = []

      const release = () => {
        if (released) {
          return
        }

        released = true
        view.off?.('loaded', onLoad)
        view.off?.('layoutChanged', onLayout)
        for (const parent of scrollParents) {
          parent.off?.('scroll', update)
        }
      }

      const update = () => {
        if (disposed.current) {
          return
        }

        const next = readBounds(view)

        if (next === null) {
          bounds$.set(null)
          return
        }

        if (!laidOut && next.width === 0 && next.height === 0) {
          return
        }

        // Fresh object each read — skip publication when nothing moved
        // or the re-render → layoutChanged → update loop never ends.
        bounds$.set((prev: MeasureBounds | null) => {
          return prev &&
            prev.x === next.x &&
            prev.y === next.y &&
            prev.width === next.width &&
            prev.height === next.height
            ? prev
            : next
        })

        if (!observe) {
          release()
        }
      }

      const onLayout = () => {
        laidOut = true
        update()
      }

      // Reload precedes the reattached view's arrange; trust only the
      // platform's flag until a layoutChanged marks it complete again.
      const onLoad = () => {
        laidOut = view.isLayoutValid === true
        update()
      }

      view.on?.('loaded', onLoad)
      view.on?.('layoutChanged', onLayout)

      if (observe) {
        let parent = view.parent

        while (parent) {
          parent.on?.('scroll', update)
          scrollParents.push(parent)
          parent = parent.parent
        }
      }

      detach.current = release
      update()
    },
    [observe],
  )

  useLayoutEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      detach.current?.()
      detach.current = null
    }
  }, [])

  return { ref, bounds$: derived$(() => bounds$.get()) }
}
