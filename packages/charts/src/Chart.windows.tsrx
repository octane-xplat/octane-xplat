/** @jsxImportSource @octane-xplat/jsx */
// Chart — Windows leaf. The AppKit/Metal pointer+render path has no
// Windows backend; renders an empty host so callers mount without
// crashing. Scene compute stays shared; scrub/tooltip/press do not emit.
import type { ChartProps } from './props'

export function Chart(_props: ChartProps): unknown @{
  <masonview />
}
