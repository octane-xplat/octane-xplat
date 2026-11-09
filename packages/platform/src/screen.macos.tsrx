import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useLayoutEffect } from 'octane'
import type { WindowSize } from './types'
import { appKitWindowSource } from './appkit-state.macos'

/** Read-only signal of primary AppKit host-window content size in points.
 * Treat each sampled size as immutable.
 * @example
 * import { useWindowSize$ } from '@octane-xplat/platform'
 * const size$ = useWindowSize$()
 * const width = size$.get().width
 */
export function useWindowSize$(): DerivedSignal<WindowSize> {
  const source = appKitWindowSource()

  const size$ = useSignal$(source.getSnapshot)

  useLayoutEffect(() => {
    const update = () => size$.set(source.getSnapshot())
    const release = source.subscribe(update)

    update()
    return release
  }, [source])

  return derived$(() => size$.get())
}
