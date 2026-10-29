import { bindRangeInstance } from './range-instance.js'
import { bindTooltips } from './tooltip-instance.js'
import { bindMotion } from './motion-instance.js'
import { bindScrolling } from './scroll-instance.js'
import type { ElementNode, GtkView } from './index.js'

export interface GtkBounds {
	x: number
	y: number
	width: number
	height: number
}

type RefEvent =
	| 'loaded'
	| 'unloaded'
	| 'layoutChanged'
	| 'scroll'
	| 'pan'
	| 'fontChanged'
	| 'accessibilityIncrement'
	| 'accessibilityDecrement'
type Listener = (event: { eventName: RefEvent; object: unknown; [key: string]: unknown }) => void

const NUMERIC_STYLE_KEYS = new Set([
	'opacity',
	'translateX',
	'translateY',
	'scale',
	'scaleX',
	'scaleY',
	'rotate',
	'rotateX',
	'rotateY',
	'perspective',
	'width',
	'height',
	'minWidth',
	'minHeight',
	'maxWidth',
	'maxHeight',
	'margin',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
	'padding',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'borderWidth',
	'borderTopWidth',
	'borderRightWidth',
	'borderBottomWidth',
	'borderLeftWidth',
	'borderRadius',
	'borderTopLeftRadius',
	'borderTopRightRadius',
	'borderBottomLeftRadius',
	'borderBottomRightRadius',
	'fontSize',
	'letterSpacing',
	'lineHeight',
])

interface StyleHost {
	watchFont(notify: () => void): () => void
	read(property: string): unknown
	write(property: string, value: number | undefined): void
}

/** Keep refs as real Gtk widgets, with app-surface measurement and subscriptions.
 * A frame callback observes ancestor allocation/scroll changes too; GTK's
 * notify::width alone does not observe changes to position. */
export function bindPublicInstance(
	node: ElementNode,
	styles: StyleHost,
	subscribePan: (listener: (payload: any) => void) => () => void,
): () => void {
	const view = node.view
	if (!view) return () => {}
	let host: typeof view | null = node.container.host
	let styleHost: StyleHost | null = styles
	let panHost: typeof subscribePan | null = subscribePan
	let disposePan: (() => void) | null = null
	let disposeFont: (() => void) | null = null
	let motion: ReturnType<typeof bindMotion> | null = null
	let disposed = false
	let tick: number | null = null
	let previous: string | undefined
	const listeners = new Map<RefEvent, Set<Listener>>()
	// Match native view lookup on the logical subtree, including viewless
	// parents. Automation names and private GTK control hosts are separate.
	view.getViewById = (id: string): GtkView | undefined => {
		if (disposed) return undefined
		const find = (current: ElementNode): GtkView | undefined => {
			if (current.destroyed) return undefined
			if (current.view && current.props.id === id) return current.view
			for (const child of current.children) {
				const match = find(child)
				if (match) return match
			}
			return undefined
		}
		return find(node)
	}
	view.focus = () => !disposed && view.grab_focus()
	view.blur = () => {
		if (disposed) return
		const root = view.get_root()
		const focused = root?.get_focus()
		// Entry delegates focus to its internal GtkText. Only release focus
		// owned by this widget; a stale blur must not clear a sibling's focus.
		if (focused && (focused === view || focused.is_ancestor(view))) root.set_focus(null)
	}
	const bounds = (): GtkBounds | null => {
		if (disposed || !host || !view.get_parent()) return null
		const [ok, rect] = view.compute_bounds(host) as [boolean, any]
		return ok
			? { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height }
			: null
	}
	const emit = (eventName: RefEvent, detail: Record<string, unknown> = {}) => {
		for (const listener of [...(listeners.get(eventName) ?? [])]) {
			if (disposed) break
			listener({ eventName, object: view, ...detail })
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
	const range = bindRangeInstance(view, emit, (name) => !!listeners.get(name as RefEvent)?.size)
	const disposeTooltips = bindTooltips(view)
	const disposeScrolling = bindScrolling(view, emit)
	const mapped = view.connect('map', () => {
		emit('loaded')
		start()
	})
	const unmapped = view.connect('unmap', () => {
		stop()
		emit('unloaded')
	})
	const readStyle = (name: string) => {
		const key = name === 'scale' ? 'scaleX' : name
		const value = styleHost?.read(key)
		if (value != null) return value
		switch (key) {
			case 'scaleX':
			case 'scaleY':
				return 1
			case 'perspective':
				return 300
			case 'opacity':
				return view.get_opacity()
			case 'width':
				return view.get_width()
			case 'height':
				return view.get_height()
			default:
				return 0
		}
	}

	const writeStyle = (name: string, value: unknown) => {
		if (!styleHost) return
		if (!NUMERIC_STYLE_KEYS.has(name))
			throw new Error('linux-gtk ref: unsupported numeric style ' + name)
		if (value != null && (typeof value !== 'number' || !Number.isFinite(value)))
			throw new Error('linux-gtk ref: numeric style requires a finite number: ' + name)
		motion?.beforeWrite(name)
		for (const key of name === 'scale' ? ['scaleX', 'scaleY'] : [name])
			styleHost.write(key, value == null ? undefined : (value as number))
	}
	motion = bindMotion(view, { read: readStyle, write: writeStyle })
	view.style = new Proxy(Object.create(null), {
		get: (_target, key) => (typeof key === 'string' ? readStyle(key) : undefined),
		set: (_target, key, value) => {
			writeStyle(String(key), value)
			return true
		},
		deleteProperty: (_target, key) => {
			writeStyle(String(key), undefined)
			return true
		},
	})
	for (const name of [
		'translateX',
		'translateY',
		'scale',
		'scaleX',
		'scaleY',
		'rotate',
		'rotateX',
		'rotateY',
		'perspective',
	]) {
		Object.defineProperty(view, name, {
			configurable: true,
			get: () => readStyle(name),
			set: (value) => writeStyle(name, value),
		})
	}
	view.getActualSize = () => {
		if (disposed) return { width: 0, height: 0 }
		const [ok, rect] = view.compute_bounds(view) as [boolean, any]
		return ok
			? { width: rect.size.width, height: rect.size.height }
			: { width: view.get_width(), height: view.get_height() }
	}
	view.getBounds = bounds
	view.on = (name: RefEvent, listener: Listener) => {
		if (disposed) return
		if (
			![
				'loaded',
				'unloaded',
				'layoutChanged',
				'scroll',
				'pan',
				'fontChanged',
				'accessibilityIncrement',
				'accessibilityDecrement',
			].includes(name)
		) {
			throw new Error(`linux-gtk ref: unsupported subscription ${name}`)
		}
		let set = listeners.get(name)
		if (!set) listeners.set(name, (set = new Set()))
		set.add(listener)
		if (name === 'accessibilityIncrement' || name === 'accessibilityDecrement') range.refresh()
		if (name === 'fontChanged' && !disposeFont && styleHost)
			disposeFont = styleHost.watchFont(() => emit('fontChanged'))
		if (name === 'pan' && !disposePan && panHost) {
			disposePan = panHost((payload) =>
				emit('pan', {
					...payload,
					state: ({ began: 1, moved: 2, ended: 3, cancelled: 0 } as Record<string, number>)[
						payload.state
					],
					deltaX: payload.x,
					deltaY: payload.y,
				}),
			)
		}

		if (name === 'layoutChanged') start()
	}
	view.off = (name: RefEvent, listener?: Listener) => {
		if (listener) listeners.get(name)?.delete(listener)
		else listeners.delete(name)
		if (!listeners.get('pan')?.size && disposePan) {
			disposePan()
			disposePan = null
		}
		if (!listeners.get('fontChanged')?.size && disposeFont) {
			disposeFont()
			disposeFont = null
		}
		if (!listeners.get('layoutChanged')?.size) stop()
	}
	return () => {
		disposePan?.()
		disposePan = null
		panHost = null
		motion?.dispose()
		motion = null
		disposeFont?.()
		disposeFont = null
		range.dispose()
		disposeTooltips()
		disposeScrolling()
		disposed = true
		host = null
		styleHost = null
		stop()
		listeners.clear()
		view.disconnect(mapped)
		view.disconnect(unmapped)
	}
}
