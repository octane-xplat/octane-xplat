/** @jsxImportSource @octane-xplat/jsx */
import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useCallback, useLayoutEffect, useRef } from 'octane'
import { View } from '@nativescript/core'
import type { ViewBase } from '@nativescript/core'
import { NSWinRT } from '@octane-xplat/platform/windows'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from '../../props'

// The preview's event-property projection owns one JS handler per native event.
// Multiplex hook readers rather than replacing each other's LayoutUpdated delegate.
type LayoutObserver = {
  native: any
  delegate: any
  callbacks: Set<() => void>
  sync: () => void
}

const layoutObservers = new WeakMap<View, LayoutObserver>()

function observeLayout(view: View, callback: () => void): () => void {
  let entry = layoutObservers.get(view)

  if (!entry) {
    const callbacks = new Set<() => void>()
    const state: LayoutObserver = {
      native: undefined,
      delegate: undefined,
      callbacks,
      sync: () => {
        const native = view.nativeViewProtected

        if (native === state.native) {
          return
        }

        if (state.native && state.native.LayoutUpdated === state.delegate) {
          state.native.LayoutUpdated = null
        }

        state.native = undefined
        state.delegate = undefined
        if (!native) {
          return
        }

        if (native.LayoutUpdated != null) {
          throw new Error(
            'Windows useMeasure$ requires ownership of the native LayoutUpdated handler',
          )
        }

        if (native.LayoutUpdated != null) {
          throw new Error(
            'Windows useMeasure$ requires ownership of the native LayoutUpdated handler',
          )
        }

        const delegate = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () => {
          for (const notify of callbacks) {
            notify()
          }
        })

        native.LayoutUpdated = delegate
        state.native = native
        state.delegate = delegate
      },
    }

    entry = state
    layoutObservers.set(view, entry)
    view.on('loaded', entry.sync)
  }

  entry.callbacks.add(callback)

  const observed = entry
  let active = true
  const release = () => {
    if (!active) {
      return
    }

    active = false
    observed.callbacks.delete(callback)
    if (observed.callbacks.size) {
      return
    }

    view.off('loaded', observed.sync)
    if (observed.native && observed.native.LayoutUpdated === observed.delegate) {
      observed.native.LayoutUpdated = null
    }

    observed.native = undefined
    observed.delegate = undefined
    layoutObservers.delete(view)
  }

  try {
    observed.sync()
  } catch (error) {
    release()
    throw error
  }

  return release
}

/** Screen position of the app surface's top-left — the topmost attached
 *  ancestor's location. `(0,0)` for full-screen windows; non-zero under
 *  Android multi-window or a moved iPadOS window. A detached or oddly
 *  rooted ancestor still reports its own position, so the subtraction
 *  degrades to the old screen-relative value rather than failing. */
function surfaceOrigin(view: View): { x: number; y: number } {
  let root: ViewBase = view

  while (root?.parent) {
    root = root.parent
  }

  const point = root instanceof View ? root.getLocationOnScreen() : undefined

  return point ? { x: point.x, y: point.y } : { x: 0, y: 0 }
}

function readBounds(view: View): MeasureBounds | null {
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

/** Observe Windows layout, including same-size native views reattached by keyed moves. */
export function useMeasure$(options: UseMeasureOptions = {}): MeasureResult {
  const bounds$ = useSignal$<MeasureBounds | null>(null)
  const detach = useRef<(() => void) | null>(null)
  const pendingClear = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const disposed = useRef(false)
  const observe = options.observe ?? true
  const ref = useCallback(
    (element: unknown) => {
      if (pendingClear.current !== undefined) {
        clearTimeout(pendingClear.current)
        pendingClear.current = undefined
      }

      detach.current?.()
      detach.current = null
      if (!(element instanceof View)) {
        // A replaced callback ref is cleared and rebound in one commit.
        // Clearing bounds synchronously makes that commit schedule another
        // render even when the same view still has identical bounds.
        if (!disposed.current && bounds$.get() !== null) {
          pendingClear.current = setTimeout(() => {
            pendingClear.current = undefined
            bounds$.set(null)
          }, 0)
        }

        return
      }

      const view = element

      // LayoutUpdated (or the platform's layout-valid flag) marks the first
      // completed arrange — before it a 0×0 read means "not laid out yet";
      // a real zero-size element publishes 0×0 once layout has run.
      let laidOut = view.isLayoutValid === true
      const update = () => {
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
      }

      // Reattached same-size views may not emit SizeChanged. LayoutUpdated
      // observes their final arrange; defer state writes out of that callback.
      let pending: ReturnType<typeof setTimeout> | undefined
      const afterAttach = () => {
        if (pending !== undefined) {
          return
        }

        pending = setTimeout(() => {
          pending = undefined
          update()
        }, 0)
      }

      const onLayout = () => {
        laidOut = true
        update()
      }

      let releaseLayout: (() => void) | undefined
      const attachLayout = () => {
        releaseLayout ??= observeLayout(view, () => {
          laidOut = true
          afterAttach()
          if (!observe) {
            releaseLayout?.()
            releaseLayout = undefined
          }
        })
      }

      update()
      attachLayout()
      view.on('loaded', attachLayout)

      const scrollParents: ViewBase[] = []

      if (observe) {
        view.on?.('layoutChanged', onLayout)

        let parent = view.parent

        while (parent) {
          parent.on?.('scroll', update)
          scrollParents.push(parent)
          parent = parent.parent
        }
      }

      detach.current = () => {
        view.off('loaded', attachLayout)
        releaseLayout?.()
        if (pending !== undefined) {
          clearTimeout(pending)
        }

        if (observe) {
          view.off?.('layoutChanged', onLayout)
          for (const parent of scrollParents) {
            parent.off?.('scroll', update)
          }
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
      if (pendingClear.current !== undefined) {
        clearTimeout(pendingClear.current)
        pendingClear.current = undefined
      }
    }
  }, [])

  return { ref, bounds$: derived$(() => bounds$.get()) }
}
