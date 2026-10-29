/** @internal Sample the OS preference before selecting a native page effect. */
export function readNativeReducedMotion(): boolean {
	try {
		const read = (globalThis as any).UIAccessibilityIsReduceMotionEnabled
		return typeof read === 'function' && Boolean(read())
	} catch {
		return false
	}
}
