import { measureKeyboardHost } from './keyboard-host-bounds'
import type { ChatHostAdapter } from './chat-scroll-host-types'

export const chatHost: ChatHostAdapter = {
	scroll: (host) => host,
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
