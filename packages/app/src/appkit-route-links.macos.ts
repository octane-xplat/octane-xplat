import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import { router } from '@octane-xplat/ui/routing'

let current: (() => void) | undefined

function report(message: string): void {
	try { console.warn(message) } catch { /* Diagnostics cannot own navigation. */ }
}

/** The primary AppKit root owns this binding after outlet layout setup. */
export function bindAppKitRouteLinks(): () => void {
	const previous = current
	let active = true, armed = false
	let remove: (() => void) | undefined
	const pending: string[] = []
	const stop = () => {
		if (!active) return
		active = false
		pending.length = 0
		if (current === stop) current = undefined
		const release = remove
		remove = undefined
		try { release?.() } catch { report('[macos] Incoming link cleanup failed') }
	}
	current = stop
	previous?.()
	if (!active || current !== stop) { stop(); return stop }
	const forward = (url: string) => {
		if (!active) return
		try {
			void Promise.resolve(router.navigateUrl(url)).then((result) => {
				if (active && result?.status !== 'committed' && result?.status !== 'cancelled') {
					report('[macos] Incoming link navigation did not commit')
				}
			}, () => {
				if (active) report('[macos] Incoming link navigation failed')
			})
		} catch { if (active) report('[macos] Incoming link navigation failed') }
	}
	const receive = (url: string) => {
		if (!active) return
		if (typeof url !== 'string') {
			report('[macos] Incoming link was not a string')
			return
		}
		if (armed) forward(url)
		else pending.push(url)
	}
	try {
		const release = onDeepLink(receive)
		if (!active) {
			try { release() } catch { report('[macos] Incoming link cleanup failed') }
			return stop
		}
		remove = release
		const initial = consumeInitialUrl()
		if (active && initial !== null) {
			if (typeof initial === 'string') pending.unshift(initial)
			else report('[macos] Incoming link was not a string')
		}
		// Let the root's effect return its cleanup before any initial navigation.
		void Promise.resolve().then(() => {
			if (!active) return
			armed = true
			for (const url of pending.splice(0)) forward(url)
		})
	} catch (error) {
		stop()
		throw error
	}
	return stop
}

const hot = (import.meta as { hot?: { dispose(callback: () => void): void } }).hot
hot?.dispose(() => current?.())
