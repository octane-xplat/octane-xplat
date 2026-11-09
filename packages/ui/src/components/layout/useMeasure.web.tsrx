/** @jsxImportSource @octane-xplat/jsx/dom */
import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useCallback, useEffect, useState } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from '../../props'

function readBounds(element: HTMLElement): MeasureBounds {
  const rect = element.getBoundingClientRect()

  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
}

/** Binds to a web element and observes app-surface (viewport-relative) px
 *  bounds by default — the shared `MeasureBounds` coordinate space. */
export function useMeasure$(options: UseMeasureOptions = {}): MeasureResult {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const bounds$ = useSignal$<MeasureBounds | null>(null)
  const observe = options.observe ?? true
  const ref = useCallback((next: any) => {
    setElement((current) => (current === next ? current : next))
  }, [])

  useEffect(() => {
    if (!element) {
      bounds$.set(null)
      return
    }

    let active = true
    const update = () => {
      if (!active) {
        return
      }

      const next = readBounds(element)

      bounds$.set((previous) =>
        previous &&
        previous.x === next.x &&
        previous.y === next.y &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next,
      )
    }

    update()
    if (!observe) {
      return
    }

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)

    resizeObserver?.observe(element)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      active = false
      resizeObserver?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [element, observe])

  return { ref, bounds$: derived$(() => bounds$.get()) }
}
