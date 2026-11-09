/** @jsxImportSource @octane-xplat/jsx/dom */
import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
// Window size + orientation — desktop webviews follow the owning native window;
// browsers use window geometry and DOM resize events.
import { useLayoutEffect } from 'octane'
import type { WindowSize } from './types'
import { desktopHostBootstrap, desktopHostClient } from './host-runtime.web'

function read(): WindowSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
  }
}

/** Read-only signal of window size in CSS px and derived orientation.
 *  Inside a desktop webview this follows host `window.resize` events; in a
 *  browser it listens for window resize/orientationchange.
 * @example
 * import { useWindowSize$ } from '@octane-xplat/platform'
 * const size$ = useWindowSize$()
 * const width = size$.get().width
 */
export function useWindowSize$(): DerivedSignal<WindowSize> {
  const bootstrap = desktopHostBootstrap()
  const size$ = useSignal$<WindowSize>(bootstrap?.windowSize ?? read)

  useLayoutEffect(() => {
    const host = desktopHostClient()

    if (host) {
      return host.on('window.resize', (size) => size$.set(size))
    }

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
