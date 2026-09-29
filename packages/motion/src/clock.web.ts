import type { Clock } from './clock-types'
export const clock: Clock = {
	now: () => performance.now(),
	request: (callback) => requestAnimationFrame(callback),
	cancel: (id) => cancelAnimationFrame(id),
}
