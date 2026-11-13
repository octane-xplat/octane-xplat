import type { SmoothCornersProps } from './props'

/** This target has no qualified smooth-path surface adapter. */
export function SmoothCorners(_props: SmoothCornersProps): unknown {
  throw new Error(
    'SmoothCorners is unavailable on native Windows; use a supported web, iOS, Android or AppKit host',
  )
}
