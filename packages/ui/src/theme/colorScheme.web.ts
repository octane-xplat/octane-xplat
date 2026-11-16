import { useSyncExternalStore } from 'octane'
import type { ColorScheme } from '../props'

export type { ColorScheme } from '../props'

export function getColorScheme(): ColorScheme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function subscribeSystemScheme(cb: () => void): () => void {
  if (typeof matchMedia !== 'function') {
    return () => {}
  }

  const mq = matchMedia('(prefers-color-scheme: dark)')

  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribeSystemScheme, getColorScheme)
}
