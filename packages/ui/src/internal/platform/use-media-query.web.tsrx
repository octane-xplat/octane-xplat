import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useLayoutEffect } from 'octane'

/** `useMediaQuery$` (Astryx), web leaf — evaluates a CSS media query against
 *  `window.matchMedia` and subscribes to changes. Returns `false` when
 *  `matchMedia` is unavailable (SSR/harness). */
export function useMediaQuery$(query: string): DerivedSignal<boolean> {
  const matches$ = useSignal$(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  )

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      matches$.set(false)
      return
    }

    const mql = window.matchMedia(query)
    const update = () => matches$.set(mql.matches)

    update()
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [query])

  return derived$(() => matches$.get())
}
