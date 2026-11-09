/** @jsxImportSource @octane-xplat/jsx */
import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
// Window size + orientation — native leaf. Screen.mainScreen gives DIPs;
// Application.orientationChangedEvent drives updates.
import { useLayoutEffect } from 'octane'
import type { WindowSize } from './types'
import { Application, Screen } from '@nativescript/core'

function read(): WindowSize {
  const s = Screen.mainScreen

  return {
    width: s.widthDIPs,
    height: s.heightDIPs,
    orientation: s.widthDIPs >= s.heightDIPs ? 'landscape' : 'portrait',
  }
}

/** Read-only signal of main-screen size in DIPs and orientation; updates on
 *  orientation changes.
 * @example
 * import { useWindowSize$ } from '@octane-xplat/platform'
 * const size$ = useWindowSize$()
 * const width = size$.get().width
 */
export function useWindowSize$(): DerivedSignal<WindowSize> {
  const size$ = useSignal$<WindowSize>(read)

  useLayoutEffect(() => {
    const update = () => size$.set(read())

    Application.on(Application.orientationChangedEvent, update)
    return () => Application.off(Application.orientationChangedEvent, update)
  }, [])

  return derived$(() => size$.get())
}
