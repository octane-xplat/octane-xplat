/** @jsxImportSource @octane-xplat/jsx */
import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from '../../props'

/** GTK computes bounds relative to the root's content host, without global
 * screen coordinates (which Wayland intentionally does not expose). */
function readBounds(view: any): MeasureBounds | null {
  return view?.getBounds?.() ?? null
}

/** Binds to a GTK widget and observes app-surface DIP bounds by default. */
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

      // A widget reporting 0×0 before its first layout is not yet usable; a
      // real zero-size element publishes 0×0 once a layout has completed.
      // `layoutChanged` is that witness; a nonzero size proves a layout
      // already ran.
      let laidOut = false
      let released = false

      const release = () => {
        if (released) {
          return
        }

        released = true
        view.off?.('loaded', onLoad)
        view.off?.('layoutChanged', onLayout)
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

      // Reload precedes the reattached widget's next allocation; wait for
      // layoutChanged before trusting a zero-size read again.
      const onLoad = () => {
        laidOut = false
        update()
      }

      view.on?.('loaded', onLoad)
      view.on?.('layoutChanged', onLayout)

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
