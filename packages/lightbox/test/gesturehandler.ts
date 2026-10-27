// Object-driver stand-in (mirrors packages/motion/test/gesturehandler.ts):
// no OS recognizers — tests dispatch plugin-shaped events.
export const GestureState = {
	UNDETERMINED: 0,
	FAILED: 1,
	BEGAN: 2,
	CANCELLED: 3,
	ACTIVE: 4,
	END: 5,
}
export const HandlerType = { PAN: 'pan', PINCH: 'pinch', TAP: 'tap' }
export const GestureHandlerStateEvent = 'GestureHandlerStateEvent'
export const GestureHandlerTouchEvent = 'GestureHandlerTouchEvent'
export const handlers: any[] = []
export const Manager = {
	getInstance: () => ({
		createGestureHandler(type: string, tag: number, options: any) {
			const listeners = new Map<string, Function>()
			const handler = {
				type,
				tag,
				options,
				node: undefined as any,
				on: (name: string, fn: Function) => listeners.set(name, fn),
				off: (name: string) => listeners.delete(name),
				attachToView(node: any) {
					this.node = node
				},
				detachFromView() {
					this.node = undefined
				},
				emit: (name: string, data: any) => listeners.get(name)?.({ data }),
			}
			handlers.push(handler)
			return handler
		},
	}),
}
export function reset() {
	handlers.length = 0
}
