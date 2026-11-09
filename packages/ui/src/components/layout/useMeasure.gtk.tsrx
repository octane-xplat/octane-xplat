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

      const update = () => {
        if (disposed.current) {
          return
        }

        const next = readBounds(view)

        // Fresh object each read — skip publication when nothing moved
        // or the re-render → layoutChanged → update loop never ends.
        bounds$.set((prev: MeasureBounds | null) => {
          return prev &&
            next &&
            prev.x === next.x &&
            prev.y === next.y &&
            prev.width === next.width &&
            prev.height === next.height
            ? prev
            : next
        })
      }

      view.on?.('loaded', update)
      update()
      if (observe) {
        view.on?.('layoutChanged', update)
      }

      detach.current = () => {
        view.off?.('loaded', update)
        if (observe) {
          view.off?.('layoutChanged', update)
        }
      }
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
