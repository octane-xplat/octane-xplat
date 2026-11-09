import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useLayoutEffect } from 'octane'
import { hostGlobal } from './host-bridge'

/** `useMediaQuery$` (Astryx), GTK leaf — evaluates the query through the
 *  renderer's `__octaneGtkHost` bridge, which runs the same css-engine
 *  media evaluator and environment (live host size, color scheme,
 *  reduced-motion) the cascade uses. Re-evaluates on window resize and
 *  Gtk.Settings changes; unsupported features evaluate to `false`, and a
 *  missing bridge (no live root) reports `false`. */
export function useMediaQuery$(query: string): DerivedSignal<boolean> {
  const matches$ = useSignal$(
    () => hostGlobal<Record<string, any>>('__octaneGtkHost')?.matchMedia?.(query) === true,
  )

  useLayoutEffect(() => {
    const host = hostGlobal<Record<string, any>>('__octaneGtkHost')
    const update = () => matches$.set(host?.matchMedia?.(query) === true)

    update()
    return host?.onMediaChange?.(update) ?? (() => {})
  }, [query])

  return derived$(() => matches$.get())
}
