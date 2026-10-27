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
export const Utils = { layout: { toDevicePixels: (v: number) => v * 2 } }
export const isIOS = true
export const isAndroid = false
