import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import { pushDeepLink } from '@octane-xplat/ui'

let wired = false

export function wireRouteLinks(): void {
	if (wired) {
		return
	}

	wired = true
	onDeepLink((url) => pushDeepLink(url))
	const initial = consumeInitialUrl()
	if (initial) {
		pushDeepLink(initial)
	}
}
