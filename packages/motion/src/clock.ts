import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import type { Clock } from './clock-types'
export const clock: Clock = {
	now: () => Date.now(),
	request: requestAnimationFrame,
	cancel: cancelAnimationFrame,
}
