import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { Application } from '@nativescript/core'
import type { Clock } from './clock-types'

const platform = globalThis as any

const now: () => number = Application.ios
	? platform.CACurrentMediaTime
		? () => platform.CACurrentMediaTime() * 1000
		: (platform.__time ?? Date.now)
	: platform.java?.lang?.System
		? () => platform.java.lang.System.nanoTime() / 1e6
		: Date.now

export const clock: Clock = {
	now,
	request: requestAnimationFrame,
	cancel: cancelAnimationFrame,
}
