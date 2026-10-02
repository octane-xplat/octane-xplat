import { Application } from '@nativescript/core'
import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import { getStack, pushDeepLink } from '@octane-xplat/ui'

let wired = false
export function wireRouteLinks(): void {
	if (wired) {
		return
	}
	wired = true
	const pending: string[] = []
	let scheduled = false
	const drain = (tries = 100) => {
		scheduled = false
		if (!getStack('root')?.currentPage?.isLoaded) {
			if (tries > 0) {
				scheduled = true
				setTimeout(() => drain(tries - 1), 100)
			} else {
				console.warn('[harness] incoming link host did not load; link remains queued')
			}

			return
		}

		const initial = consumeInitialUrl()
		if (initial) {
			pending.unshift(initial)
		}
		for (const url of pending.splice(0)) {
			pushDeepLink(url)
		}
	}

	const schedule = () => {
		if (!scheduled) {
			scheduled = true
			setTimeout(() => drain(), 0)
		}
	}

	onDeepLink((url) => {
		pending.push(url)
		schedule()
	})
	Application.on(Application.launchEvent, schedule)
	schedule()
}
