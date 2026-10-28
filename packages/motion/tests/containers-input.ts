/** Mobile probe helpers are unavailable on other targets. */
export function captureDragInput(): {
	restore(): void
	send(view: object, phase: 'start' | 'move' | 'end' | 'cancel', x: number): void
} {
	throw new Error('Run the container probe on iOS or Android')
}
