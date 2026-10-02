const transformPaths: Record<string, string> = {
	translateX: 'transform.translation.x',
	translateY: 'transform.translation.y',
	scale: 'transform.scale',
	scaleX: 'transform.scale.x',
	scaleY: 'transform.scale.y',
	rotate: 'transform.rotation.z',
}

export function readReducedMotion(): boolean {
	return Boolean(
		(globalThis as any).NSWorkspace?.sharedWorkspace?.accessibilityDisplayShouldReduceMotion,
	)
}

/** Refs are NSViews, not NativeScript views. Keep the renderer's y-down convention. */
export function writeAnimatedProperty(view: any, property: string, value: number): void {
	if (property === 'opacity') {
		view.alphaValue = value
		return
	}

	const path = transformPaths[property]
	if (path) {
		view.wantsLayer = true
		// Explicit per-frame samples must not acquire implicit CA interpolation.
		const transaction = (globalThis as any).CATransaction
		transaction.begin()
		try {
			transaction.setDisableActions(true)
			view.layer.setValueForKeyPath(
				property === 'rotate'
					? (value * Math.PI) / 180
					: property === 'translateY'
						? -value
						: value,
				path,
			)
		} finally {
			transaction.commit()
		}

		return
	}

	throw new Error('useAnimation: unsupported AppKit property ' + property)
}
