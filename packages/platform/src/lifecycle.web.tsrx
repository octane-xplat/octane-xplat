/** @jsxImportSource @octane-xplat/jsx/dom */
// App lifecycle follows browser visibility and page lifecycle events.
import { useEffect, useState } from 'octane'
import type { AppState } from './types'

function browserAppState(): AppState {
  return document.visibilityState === 'visible' ? 'active' : 'background'
}

/** Current app lifecycle state; maps browser visibilitychange/pagehide/pageshow onto 'active',
 *  'background', and 'inactive'. */
export function useAppState(): AppState {
  const [state, setState] = useState<AppState>(browserAppState())

  useEffect(() => {
    const onVis = () => setState(browserAppState())
    const onHide = () => setState('inactive')

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onVis)
    }
  }, [])

  return state
}

/** Browser back is already real history — nothing to intercept on web. */
export function useBackHandler(_fn: () => boolean): void {}
