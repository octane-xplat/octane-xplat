import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from '../../props'
import { readBounds } from './measure-bounds.macos'

/** Observe app-surface (window-content-relative) layout and ancestor
 *  scrolling — the shared `MeasureBounds` coordinate space; release all
 *  observers on rebind/unmount. */
export function useMeasure$(options: UseMeasureOptions = {}): MeasureResult {
  const bounds$ = useSignal$<MeasureBounds | null>(null)
  const detach = useRef<(() => void) | null>(null)
  const pendingClear = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const disposed = useRef(false)
  const observe = options.observe ?? true
  const ref = useCallback(
    (view: any) => {
      if (pendingClear.current !== undefined) {
        clearTimeout(pendingClear.current)
        pendingClear.current = undefined
      }

      detach.current?.()
      detach.current = null
      // Universal roots retire hook signals before delivering null refs.
      if (disposed.current) {
        return
      }

      if (!view) {
        // Ref replacement can clear and rebind the same view in one commit.
        // Publishing null during that commit would invalidate the bounds reader.
        if (bounds$.get() !== null) {
          pendingClear.current = setTimeout(() => {
            pendingClear.current = undefined
            bounds$.set(null)
          }, 0)
        }

        return
      }

      let released = false
      const release = () => {
        if (released) {
          return
        }

        released = true
        for (const observer of observers) {
          center.removeObserver(observer)
        }
      }

      const update = () => {
        if (released || disposed.current) {
          return
        }

        const next = readBounds(view)

        bounds$.set((previous: MeasureBounds | null) =>
          previous &&
          next &&
          previous.x === next.x &&
          previous.y === next.y &&
          previous.width === next.width &&
          previous.height === next.height
            ? previous
            : next,
        )

        // A null read means the view is not in a window yet — keep the
        // observers so a single read can still land on its first layout.
        if (next !== null && !observe) {
          release()
        }
      }

      const appKit = globalThis as Record<string, any>
      const center = appKit.NSNotificationCenter.defaultCenter
      const observers: any[] = []
      let ancestor = view

      while (ancestor) {
        ancestor.postsFrameChangedNotifications = true
        ancestor.postsBoundsChangedNotifications = true
        for (const name of [
          appKit.NSViewFrameDidChangeNotification,
          appKit.NSViewBoundsDidChangeNotification,
        ]) {
          observers.push(
            center.addObserverForNameObjectQueueUsingBlock(name, ancestor, null, update),
          )
        }

        ancestor = ancestor.superview
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
      if (pendingClear.current !== undefined) {
        clearTimeout(pendingClear.current)
        pendingClear.current = undefined
      }
      detach.current?.()
      detach.current = null
    }
  }, [])

  return { ref, bounds$: derived$(() => bounds$.get()) }
}
