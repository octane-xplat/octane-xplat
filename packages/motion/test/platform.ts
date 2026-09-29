export function readReducedMotion() {
	return false
}

export function observeReducedMotion() {
	return () => {}
}

export const clock = {
	now: () => Date.now(),
	request: (callback: () => void) => setTimeout(callback, 16) as any,
	cancel: (id: number) => clearTimeout(id),
}
