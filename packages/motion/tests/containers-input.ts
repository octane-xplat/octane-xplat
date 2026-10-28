import {
	Manager,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
	GestureState,
} from '@nativescript-community/gesturehandler'

/** Capture this case's handlers on both platforms; dispatch is not OS input evidence. */
export function captureDragInput() {
	const manager = Manager.getInstance() as any
	const original = manager.createGestureHandler
	const handlers = new WeakMap<object, any>()
	const create = function (this: any, ...args: any[]) {
		const handler = original.apply(this, args)
		const attach = handler.attachToView
		handler.attachToView = function (view: object) {
			handlers.set(view, handler)
			return attach.call(this, view)
		}
		return handler
	}
	manager.createGestureHandler = create
	return {
		restore() {
			if (manager.createGestureHandler === create) {
				manager.createGestureHandler = original
			}
		},
		send(view: object, phase: 'start' | 'move' | 'end' | 'cancel', x: number) {
			const handler = handlers.get(view)
			if (!handler) {
				throw new Error('Missing case drag handler')
			}
			handler.notify({
				eventName: phase === 'move' ? GestureHandlerTouchEvent : GestureHandlerStateEvent,
				object: handler,
				data: {
					state:
						phase === 'end'
							? GestureState.END
							: phase === 'cancel'
								? GestureState.CANCELLED
								: GestureState.ACTIVE,
					extraData: {
						translationX: x,
						translationY: 0,
						absoluteX: x,
						absoluteY: 0,
						velocityX: 0,
						velocityY: 0,
					},
					view,
				},
			})
		},
	}
}
