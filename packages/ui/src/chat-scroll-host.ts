import { measureKeyboardHost } from './keyboard-host-bounds'
import type { ChatHostAdapter } from './chat-scroll-host-types'

// MasonKit elements expose browser scrolling (scrollTop/scrollHeight/
// clientHeight, scrollTo, on/off('scroll')); adapt it to the shared chat port.
const scrollers = new WeakMap<object, any>()
export const chatHost: ChatHostAdapter = {
	scroll(host) {
		if (!host) {
			return null
		}
		let port = scrollers.get(host)
		if (!port) {
			port = {
				get verticalOffset() {
					return host.scrollTop
				},
				get scrollableHeight() {
					return Math.max(0, host.scrollHeight - host.clientHeight)
				},
				scrollToVerticalOffset(offset: number, animated = false) {
					host.scrollTo({ top: offset, behavior: animated ? 'smooth' : 'instant' })
				},
				on(_name: string, callback: () => void) {
					host.on?.('scroll', callback)
				},
				off(_name: string, callback: () => void) {
					host.off?.('scroll', callback)
				},
			}

			scrollers.set(host, port)
		}
		return port
	},
	height: (host) =>
		measureKeyboardHost(host)?.height ?? Number(host?.getActualSize?.().height ?? 0),
	children(host) {
		return Array.from({ length: host?.getChildrenCount?.() ?? 0 }, (_, index) =>
			host.getChildAt(index),
		)
	},
	position(host, viewport) {
		const box = measureKeyboardHost(host),
			root = measureKeyboardHost(viewport)
		if (box && root) {
			return { y: box.y - root.y, height: box.height }
		}
		if (host?.nativeViewProtected || viewport?.nativeViewProtected) {
			return null
		}
		const point = host?.getLocationRelativeTo?.(viewport)
		return point ? { y: point.y, height: host.getActualSize?.().height ?? 0 } : null
	},
	contains(parent, child) {
		for (let view = child; view; view = view.parent) {
			if (view === parent) {
				return true
			}
		}
		return false
	},
	observeLayout(host, changed, afterChildren = false) {
		let active = true,
			timer: ReturnType<typeof setTimeout> | undefined
		const notify = () => {
			if (!active) {
				return
			}
			if (!afterChildren) {
				changed()
				return
			}
			if (timer === undefined) {
				timer = setTimeout(() => {
					timer = undefined
					if (active) {
						changed()
					}
				}, 0)
			}
		}
		host?.on?.('layoutChanged', notify)
		return () => {
			active = false
			if (timer !== undefined) {
				clearTimeout(timer)
			}
			host?.off?.('layoutChanged', notify)
		}
	},
}
