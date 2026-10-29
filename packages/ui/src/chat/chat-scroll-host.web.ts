import type { ChatHostAdapter } from './chat-scroll-host-types'

const scrollers = new WeakMap<object, any>()
export const chatHost: ChatHostAdapter = {
	scroll(host: HTMLElement) {
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
					host.scrollTo({
						top: offset,
						behavior: animated ? 'smooth' : ('instant' as ScrollBehavior),
					})
				},
				on(_name: string, callback: () => void) {
					host.addEventListener('scroll', callback, { passive: true })
				},
				off(_name: string, callback: () => void) {
					host.removeEventListener('scroll', callback)
				},
			}

			scrollers.set(host, port)
		}
		return port
	},
	height: (host) => Number((host as HTMLElement)?.getBoundingClientRect().height ?? 0),
	children: (host) => Array.from((host as HTMLElement)?.children ?? []),
	position(host: HTMLElement, viewport: HTMLElement) {
		const box = host.getBoundingClientRect(),
			root = viewport.getBoundingClientRect()
		return { y: box.y - root.y, height: box.height }
	},
	contains: (parent: HTMLElement, child: HTMLElement) => parent.contains(child),
	observeLayout(host: HTMLElement, changed) {
		const document = host.ownerDocument,
			window = document.defaultView!
		let active = true,
			frame = 0
		const observer = new window.ResizeObserver(() => {
			if (!active || frame) {
				return
			}
			frame = window.requestAnimationFrame(() => {
				frame = 0
				if (active) {
					changed()
				}
			})
		})
		observer.observe(host)
		return () => {
			active = false
			observer.disconnect()
			try {
				if (window.document === document) {
					window.cancelAnimationFrame(frame)
				}
			} catch {
				/* The host document was replaced. */
			}
		}
	},
}
