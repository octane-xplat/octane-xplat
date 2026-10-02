export function dispatchScrub(view, points, touchType) {
	if (
		!Array.isArray(points) ||
		!points.length ||
		points.some((point) => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))
	) {
		throw new Error('Probe scrub requires a nonempty array of finite {x, y} points')
	}

	const observers = view.getGestureObservers?.(touchType) ?? []
	if (!view.isLoaded || !observers.length) {
		throw new Error('Probe view has no loaded touch observer: ' + view.id)
	}

	const dispatch = (action, { x, y }) => {
		const touch = { getX: () => x, getY: () => y }
		const event = {
			eventName: 'touch',
			type: touchType,
			view,
			object: view,
			action,
			...touch,
			getPointerCount: () => 1,
			getActivePointers: () => [touch],
			getAllPointers: () => [touch],
		}

		for (const observer of observers) {
			observer.callback.call(observer.context, event)
		}
	}

	dispatch('down', points[0])
	for (const point of points.slice(1)) {
		dispatch('move', point)
	}

	dispatch('up', points[points.length - 1])
}
