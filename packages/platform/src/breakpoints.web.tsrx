import { useMemo } from 'octane'
import { derived$, type DerivedSignal } from 'octane/signals'
import type { BreakpointMap, BreakpointMatches } from './breakpoints.types'
import { useWindowSize$ } from './screen.web.tsrx'

/** Read-only named minimum-width matches in CSS px/DIPs. Uses the same
 * host dimensions and lifetime as useWindowSize$; mobile measures the main
 * screen. Dispose the hook owner to release its dimension subscription.
 * @example
 * import { useBreakpoints$ } from '@octane-xplat/platform'
 * const matches$ = useBreakpoints$({ compact: 0, wide: 900 })
 * const wide = matches$.get().wide
 */
export function useBreakpoints$<T extends BreakpointMap>(
  thresholds: T,
): DerivedSignal<BreakpointMatches<T>> {
  const size$ = useWindowSize$()
  // Callers commonly pass inline maps. Equal thresholds must not redeclare
  // an object-valued derived result on each reader render.
  const entries = useMemo(() => Object.entries(thresholds), Object.entries(thresholds).flat())

  return derived$(() => {
    const width = size$.get().width

    // Object.fromEntries cannot preserve the generic threshold keys.
    return Object.fromEntries(
      entries.map(([name, threshold]) => [name, width >= threshold]),
    ) as BreakpointMatches<T>
  })
}
