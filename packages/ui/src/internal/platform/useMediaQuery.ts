// Type contract for the private web-only AppShell media-query hook.
import type { DerivedSignal } from 'octane/signals'

export interface UseMediaQueryOptions {
  /** Initial match when matchMedia is unavailable. */
  defaultIsMobile?: boolean
}

export declare function useMediaQuery$(
  query: string,
  options?: UseMediaQueryOptions,
): DerivedSignal<boolean>
