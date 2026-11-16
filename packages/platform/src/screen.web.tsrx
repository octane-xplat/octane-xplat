/** @jsxImportSource @octane-xplat/jsx/dom */
import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
// Window size and orientation use browser geometry and DOM resize events.
import { useLayoutEffect } from 'octane'
import type { WindowSize } from './types'

function read(): WindowSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
  }
}

/** Read-only signal of window size in CSS px and derived orientation.
 *  Listens for browser resize/orientationchange.
 * @example
 * import { useWindowSize$ } from '@octane-xplat/platform'
 * const size$ = useWindowSize$()
 * const width = size$.get().width
 */
export function useWindowSize$(): DerivedSignal<WindowSize> {
  const size$ = useSignal$<WindowSize>(read)

  useLayoutEffect(() => {
    const update = () => size$.set(read())

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return derived$(() => size$.get())
}
