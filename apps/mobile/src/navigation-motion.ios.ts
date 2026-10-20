/** Text-only fixture telemetry; never captures rendered images. */
export const nativeMotion = {
	factories: 0,
	events: [] as string[],
	directions: [] as string[],
}

/** iOS Core Animation exposes the presented values on the target's layer. */
export function sampleViewMotion(view: any) {
	const layer = view.nativeViewProtected.layer
	return { opacity: Number(layer.opacity), translateX: Number(layer.transform.m41) }
}
