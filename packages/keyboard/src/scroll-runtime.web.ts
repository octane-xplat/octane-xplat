import type { FocusScrollRuntime } from './scroll-runtime-types'
export const scrollRuntime: FocusScrollRuntime = {
	owner: (host) => (host as any).native ?? host,
	read: (owner) => (owner as HTMLElement).scrollTop,
	write(owner, offset) {
		;(owner as HTMLElement).scrollTop = offset
	},
	watchManual(host, listener) {
		const view = ((host as any).native ?? host) as HTMLElement
		const events = ['wheel', 'touchmove', 'pointermove']
		const manual = (event: Event) => {
			if (event.type !== 'pointermove' || (event as PointerEvent).buttons) {
				listener()
			}
		}
		for (const event of events) {
			view.addEventListener(event, manual, { passive: true })
		}
		return () => {
			for (const event of events) {
				view.removeEventListener(event, manual)
			}
		}
	},
}
