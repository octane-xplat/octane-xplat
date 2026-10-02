import type { ProbeContext } from '../../../scripts/probe/context'

/** Handler dispatch only: this does not prove OS input or hit-testing. */
export function pan(ctx: ProbeContext, id: string, dx: number, cancelled = false) {
	const view = ctx.find(id)
	const observers = view.getGestureObservers?.(8) ?? []
	if (!observers.length) {
		throw new Error(`No native pan observer: ${id}`)
	}
	for (const [state, deltaX] of [
		[1, 0],
		[2, dx],
		[cancelled ? 0 : 3, dx],
	]) {
		for (const observer of observers) {
			observer.callback.call(observer.context, {
				eventName: 'pan',
				object: view,
				view,
				state,
				deltaX,
				deltaY: 0,
				ios: { velocityInView: () => ({ x: 0, y: 0 }) },
			})
		}
	}
}
