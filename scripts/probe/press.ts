/** Synthesized handler dispatch; this does not exercise OS input/hit-testing. */
export function dispatchPress(view: any) {
	if (!view.isLoaded) {
		throw new Error('Probe view has no loaded press handler: ' + view.id)
	}

	const observers = view.getGestureObservers?.(1) ?? []
	if (observers.length) {
		for (const observer of observers) {
			observer.callback.call(observer.context, { eventName: 'tap', object: view })
		}
		return
	}

	// MasonKit beta.110 aliases tap to click and registers an Observable
	// listener alongside its native event listener, rather than a core gesture.
	if (view.hasListeners?.('click')) {
		view.notify({ eventName: 'click', object: view })
		return
	}

	throw new Error('Probe view has no loaded press handler: ' + view.id)
}
