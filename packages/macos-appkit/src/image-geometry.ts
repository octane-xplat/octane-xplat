/** Coalesced image-box metrics, separate from margin-host layout events. */
export interface ImageGeometry { width: number; height: number; scale: number }
interface GeometryView {
	bounds: { size: { width: number; height: number } }
	window?: { backingScaleFactor: number } | null
}
interface Subscription {
	handler: (geometry: ImageGeometry) => void
	last?: ImageGeometry
	timer?: ReturnType<typeof setTimeout>
}
const subscriptions = new WeakMap<object, Subscription>()
const positive = (value: unknown, fallback: number) => {
	const n = Number(value)
	return Number.isFinite(n) && n > 0 ? n : fallback
}

export function setImageGeometryHandler(view: GeometryView, handler?: (geometry: ImageGeometry) => void): void {
	const previous = subscriptions.get(view)
	if (typeof handler !== 'function') {
		if (previous?.timer !== undefined) {clearTimeout(previous.timer)}
		subscriptions.delete(view)
		return
	}
	if (previous) {previous.handler = handler}
	else {subscriptions.set(view, { handler })}
	notifyImageGeometry(view)
}

/** Called after frame, window or backing-store changes. Never reenter native layout. */
export function notifyImageGeometry(view: GeometryView): void {
	const subscription = subscriptions.get(view)
	if (!subscription || subscription.timer !== undefined) {return}
	subscription.timer = setTimeout(() => {
		subscription.timer = undefined
		if (subscriptions.get(view) !== subscription) {return}
		try {
			if (!view.window) {return}
			const geometry = {
				width: positive(view.bounds.size.width, 0),
				height: positive(view.bounds.size.height, 0),
				scale: positive(view.window.backingScaleFactor, 1),
			}
			const last = subscription.last
			if (last && last.width === geometry.width && last.height === geometry.height && last.scale === geometry.scale) {return}
			subscription.last = geometry
			subscription.handler(geometry)
		} catch (error) { console.error('[macos-image] geometry handler failed', error) }
	}, 0)
}
