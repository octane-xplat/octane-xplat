import type { ElementNode } from './index.js'

export interface GtkBounds {
	x: number
	y: number
	width: number
	height: number
}

type LayoutEvent = 'loaded' | 'unloaded' | 'layoutChanged'
type Listener = (event: { eventName: LayoutEvent; object: unknown }) => void

/** Keep refs as real Gtk widgets, with app-surface measurement and subscriptions.
 * A frame callback observes ancestor allocation/scroll changes too; GTK's
 * notify::width alone does not observe changes to position. */
export function bindPublicInstance(node: ElementNode): () => void {
	const view = node.view
	if (!view) return () => {}
	let host: typeof view | null = node.container.host
	let disposed = false
	let tick: number | null = null
	let previous: string | undefined
	const listeners = new Map<LayoutEvent, Set<Listener>>()
	const bounds = (): GtkBounds | null => {
		if (disposed || !host || !view.get_parent()) return null
		const [ok, rect] = view.compute_bounds(host) as [boolean, any]
		return ok
			? { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height }
			: null
	}
	const emit = (eventName: LayoutEvent) => {
		for (const listener of [...(listeners.get(eventName) ?? [])]) {
			if (disposed) break
			listener({ eventName, object: view })
		}
	}
	const stop = () => {
		if (tick !== null) view.remove_tick_callback(tick)
		tick = null
	}
	const start = () => {
		if (disposed || tick !== null || !listeners.get('layoutChanged')?.size) return
		previous = undefined
		tick = view.add_tick_callback(() => {
			const next = JSON.stringify(bounds())
			if (next !== previous) {
				previous = next
				emit('layoutChanged')
			}
			return !disposed && !!listeners.get('layoutChanged')?.size
		})
	}
	const mapped = view.connect('map', () => {
		emit('loaded')
		start()
	})
	const unmapped = view.connect('unmap', () => {
		stop()
		emit('unloaded')
	})
	view.getActualSize = () => ({ width: view.get_width(), height: view.get_height() })
	view.getBounds = bounds
	view.on = (name: LayoutEvent, listener: Listener) => {
		if (disposed) return
		if (!['loaded', 'unloaded', 'layoutChanged'].includes(name)) {
			throw new Error(`linux-gtk ref: unsupported subscription ${name}`)
		}
		let set = listeners.get(name)
		if (!set) listeners.set(name, (set = new Set()))
		set.add(listener)
		if (name === 'layoutChanged') start()
	}
	view.off = (name: LayoutEvent, listener?: Listener) => {
		if (listener) listeners.get(name)?.delete(listener)
		else listeners.delete(name)
		if (!listeners.get('layoutChanged')?.size) stop()
	}
	return () => {
		disposed = true
		host = null
		stop()
		listeners.clear()
		view.disconnect(mapped)
		view.disconnect(unmapped)
	}
}
