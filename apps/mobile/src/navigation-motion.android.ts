/** Text-only fixture telemetry; never captures rendered images. */
export const nativeMotion = {
	factories: 0,
	events: [] as string[],
	directions: [] as string[],
}

/** Android animates the native view's alpha/translation — JS props lag. */
export function sampleViewMotion(view: any) {
	const native = view.nativeViewProtected
	return { opacity: Number(native.getAlpha()), translateX: Number(native.getTranslationX()) }
}
