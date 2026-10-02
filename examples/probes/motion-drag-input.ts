import {
	Manager,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
	GestureState,
} from '@nativescript-community/gesturehandler'

/** iOS handler-level dispatch, not OS touch or scroll arbitration evidence. */
export function dragInput(
	node: any,
	phase: 'start' | 'move' | 'end' | 'cancel',
	x: number,
	velocity = 0,
) {
	const manager = Manager.getInstance() as any
	const handler = [...(manager.attachedHandlers?.values() ?? [])].find(
		(candidate: any) => candidate.attachedView === node,
	) as any

	if (!handler) {
		throw new Error('Motion probe could not find attached iOS PanGestureHandler')
	}

	const state =
		phase === 'end'
			? GestureState.END
			: phase === 'cancel'
				? GestureState.CANCELLED
				: GestureState.ACTIVE

	handler.notify({
		eventName: phase === 'move' ? GestureHandlerTouchEvent : GestureHandlerStateEvent,
		object: handler,
		data: {
			state,
			extraData: {
				translationX: x,
				translationY: 0,
				absoluteX: x,
				absoluteY: 0,
				velocityX: velocity,
				velocityY: 0,
			},
			view: node,
		},
	})
}
