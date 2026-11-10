import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import type { Clock } from './clock-types'

// The AppKit host uses mach_absolute_time, matching its native display link.
export const clock: Clock = {
  now: () => performance.now(),
  request: requestAnimationFrame,
  cancel: cancelAnimationFrame,
}
