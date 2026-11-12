import { createSharedObserver, type SharedObserver } from './shared-observer'

export function readReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function startObservation(notify: () => void): () => void {
  if (typeof matchMedia !== 'function') {
    return () => {}
  }

  const media = matchMedia('(prefers-reduced-motion: reduce)')

  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

/** Share one platform observer across all mounted Motion readers. */
export const observeReducedMotion: SharedObserver = createSharedObserver(startObservation)
