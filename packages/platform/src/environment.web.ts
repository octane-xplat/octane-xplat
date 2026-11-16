import { connectivity } from './connectivity.web'
import type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

export type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

/** Browser visibility and connectivity. */
export const environment: RuntimeEnvironment = {
  getSnapshot() {
    const network =
      typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
        ? undefined
        : connectivity.getState()

    return {
      online: network?.online,
      active: typeof document === 'undefined' ? undefined : document.visibilityState === 'visible',
      capabilities: {
        connectivity: network !== undefined,
        activity: typeof document !== 'undefined',
      },
    }
  },
  subscribe(listener) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      listener(environment.getSnapshot())
      return () => {}
    }

    let active = environment.getSnapshot().active
    const snapshot = (): RuntimeEnvironmentSnapshot => ({ ...environment.getSnapshot(), active })
    const network = () => listener(snapshot())
    const visibility = () => {
      active = document.visibilityState === 'visible'
      listener(snapshot())
    }

    const hide = () => {
      active = false
      listener(snapshot())
    }

    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pageshow', visibility)
    window.addEventListener('pagehide', hide)

    const stopNetwork = connectivity.subscribe(network)

    return () => {
      stopNetwork()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pageshow', visibility)
      window.removeEventListener('pagehide', hide)
    }
  },
}
