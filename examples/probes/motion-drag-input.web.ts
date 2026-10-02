export function dragInput(
	node: HTMLElement,
	phase: 'start' | 'move' | 'end' | 'cancel',
	x: number,
	_velocity = 0,
) {
	node.dispatchEvent(
		new PointerEvent(
			phase === 'start'
				? 'pointerdown'
				: phase === 'move'
					? 'pointermove'
					: phase === 'end'
						? 'pointerup'
						: 'pointercancel',
			{ clientX: x, clientY: 0, pointerId: 71, isPrimary: true, bubbles: true, button: 0 },
		),
	)
}
