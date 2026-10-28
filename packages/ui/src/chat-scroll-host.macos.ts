import { readBounds } from './measure-bounds.macos'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'
import type { ChatHostAdapter } from './chat-scroll-host-types'

const scrollers = new WeakMap<object, any>()
const flags = new WeakMap<object, Map<string, { count: number; previous: boolean }>>()
const observe = (view: any, name: string, flag: string, callback: () => void) => {
	if (!view) {
		return () => {}
	}
	const center = (globalThis as any).NSNotificationCenter.defaultCenter
	const entries = flags.get(view) ?? new Map<string, { count: number; previous: boolean }>()
	flags.set(view, entries)
	let entry = entries.get(flag)
	if (!entry) {
		entry = { count: 0, previous: !!view[flag] }
		entries.set(flag, entry)
		view[flag] = true
	}
	entry.count++
	let active = true
	const token = center.addObserverForNameObjectQueueUsingBlock(name, view, null, () => {
		if (active) {
			callback()
		}
	})
	const owned = entry
	return () => {
		if (!active) {
			return
		}
		active = false
		center.removeObserver(token)
		if (!--owned.count) {
			entries.delete(flag)
			if (!entries.size) {
				flags.delete(view)
			}

			if (view[flag] === true) {
				view[flag] = owned.previous
			}
		}
	}
}

export const chatHost: ChatHostAdapter = {
	scroll(host: any) {
		if (!host) {
			return null
		}
		let port = scrollers.get(host)
		if (!port) {
			const listeners = new Map<() => void, () => void>()
			port = {
				get verticalOffset() {
					return scrollableAreaMetrics(host).y
				},
				get scrollableHeight() {
					return scrollableAreaMetrics(host).maxY
				},
				scrollToVerticalOffset(offset: number, animated = false) {
					scrollableAreaOffset(host, { block: offset }, animated)
				},
				on(_name: string, callback: () => void) {
					if (listeners.has(callback)) {
						return
					}
					let origin = Number(host.contentView.bounds.origin.y)
					const scrolled = () => {
						const nextOrigin = Number(host.contentView.bounds.origin.y)
						const moved = Math.abs(nextOrigin - origin) > 0.5
						origin = nextOrigin
						// Range drift alone changes top offsets without native clip movement.
						if (moved) {
							callback()
						}
					}
					listeners.set(
						callback,
						observe(
							host.contentView,
							'NSViewBoundsDidChangeNotification',
							'postsBoundsChangedNotifications',
							scrolled,
						),
					)
				},
				off(_name: string, callback: () => void) {
					listeners.get(callback)?.()
					listeners.delete(callback)
				},
			}

			scrollers.set(host, port)
		}
		return port
	},
	height: (host) => Number(host?.bounds?.size?.height ?? 0),
	children(host: any) {
		const children = host?.arrangedSubviews ?? host?.subviews
		if (Array.isArray(children)) {
			return children
		}
		return Array.from({ length: children?.count ?? 0 }, (_, index) => children.objectAtIndex(index))
	},
	position(host, viewport) {
		const box = readBounds(host),
			root = readBounds(viewport.contentView)
		return box && root ? { y: box.y - root.y, height: box.height } : null
	},
	contains(parent, child) {
		for (let view = child; view; view = view.superview) {
			if (view === parent) {
				return true
			}
		}
		return false
	},
	observeLayout(host, callback, afterChildren = false) {
		let active = true,
			timer: ReturnType<typeof setTimeout> | undefined
		const off = observe(
			host,
			'NSViewFrameDidChangeNotification',
			'postsFrameChangedNotifications',
			() => {
				if (!active) {
					return
				}
				if (!afterChildren) {
					callback()
					return
				}
				if (timer === undefined) {
					timer = setTimeout(() => {
						timer = undefined
						if (active) {
							callback()
						}
					}, 0)
				}
			},
		)
		return () => {
			active = false
			if (timer !== undefined) {
				clearTimeout(timer)
			}
			off()
		}
	},
}
