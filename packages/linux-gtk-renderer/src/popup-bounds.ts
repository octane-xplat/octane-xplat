import Graphene from 'gi://Graphene'
import type { GtkBounds } from './public-instance.js'

/** GTK widget transforms stop at Gtk.Native boundaries. Popup positions join
 * those native coordinate spaces without requiring desktop/global coordinates. */
function surfaceOrigin(native: any) {
	let surface = native.get_surface()
	if (!surface) {
		return null
	}
	let x = 0,
		y = 0
	while (typeof surface.get_parent === 'function') {
		const parent = surface.get_parent()
		if (!parent) {
			return null
		}
		x += surface.get_position_x()
		y += surface.get_position_y()
		surface = parent
	}
	const [tx, ty] = native.get_surface_transform()
	return { surface, x: x - tx, y: y - ty }
}

/** Bounds in the original root host's content coordinates, including portals
 * in nested native popups. Unrelated/unrealized surfaces remain unmeasurable. */
export function popupBounds(view: any, host: any): GtkBounds | null {
	const native = view.get_native(),
		hostNative = host.get_native()
	if (!native || !hostNative || native === hostNative) {
		return null
	}
	const source = surfaceOrigin(native),
		target = surfaceOrigin(hostNative)
	if (!source || !target || source.surface !== target.surface) {
		return null
	}
	const [ok, rect] = view.compute_bounds(view)
	if (!ok) {
		return null
	}
	const points: Array<{ x: number; y: number }> = []
	for (const x of [rect.origin.x, rect.origin.x + rect.size.width]) {
		for (const y of [rect.origin.y, rect.origin.y + rect.size.height]) {
			const [fromOk, from] = view.compute_point(native, new Graphene.Point({ x, y }))
			if (!fromOk) {
				return null
			}
			const [toOk, to] = hostNative.compute_point(
				host,
				new Graphene.Point({
					x: from.x + source.x - target.x,
					y: from.y + source.y - target.y,
				}),
			)
			if (!toOk) {
				return null
			}
			points.push(to)
		}
	}
	const x = Math.min(...points.map((point) => point.x)),
		y = Math.min(...points.map((point) => point.y))
	const right = Math.max(...points.map((point) => point.x)),
		bottom = Math.max(...points.map((point) => point.y))
	if (![x, y, right, bottom].every(Number.isFinite)) {
		return null
	}
	return { x, y, width: right - x, height: bottom - y }
}
