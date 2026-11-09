import { derived$, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useLayoutEffect } from 'octane'

export interface UseMediaQueryOptions {
  /** Initial match when matchMedia is unavailable. */
  defaultIsMobile?: boolean
}

/** Private AppShell query with its configured no-matchMedia fallback. */
export function useMediaQuery$(
  query: string,
  options?: UseMediaQueryOptions,
): DerivedSignal<boolean> {
  const read = () =>
    typeof matchMedia === 'function'
      ? matchMedia(query).matches
      : (options?.defaultIsMobile ?? false)

  const matches$ = useSignal$(read)

  useLayoutEffect(() => {
    if (typeof matchMedia !== 'function') {
      matches$.set(read())
      return
    }

    const mq = matchMedia(query)
    const update = () => matches$.set(mq.matches)

    update()
    if (mq.addEventListener) {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }

    mq.addListener?.(update)
    return () => mq.removeListener?.(update)
  }, [query, options?.defaultIsMobile])

  return derived$(() => matches$.get())
}
