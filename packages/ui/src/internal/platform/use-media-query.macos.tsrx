import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useLayoutEffect, useMemo } from 'octane'
import { appKitHost } from './host-bridge'
import { createAppKitMediaQuerySource } from './media-query-source.macos'

/** AppKit media queries use the primary host window in dips, fine pointer
 * and hover traits. Supports the restricted native grammar; it does not
 * implement arbitrary CSS or per-secondary-window ownership. */
export function useMediaQuery$(query: string): DerivedSignal<boolean> {
  const host = appKitHost()
  const source = useMemo(() => createAppKitMediaQuerySource(query, host), [query, host])

  const matches$ = useSignal$(source.getSnapshot)

  useLayoutEffect(() => {
    const update = () => matches$.set(source.getSnapshot())
    const release = source.subscribe(update)

    update()
    return release
  }, [source])

  return derived$(() => matches$.get())
}
