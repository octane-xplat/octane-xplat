import type { PanCallbacks } from './host-types'

// Keep the mobile gesture plugin out of the macOS import graph. A real AppKit
// drag backend is a separate qualification gate, not a compatibility shim.
export function attachPan(
	_node: any,
	_axis: true | 'x' | 'y',
	_callbacks: PanCallbacks,
): () => void {
	throw new Error('motion: macOS drag backend is not implemented')
}
