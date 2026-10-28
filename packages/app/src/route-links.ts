import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import { router } from '@octane-xplat/ui/routing'

let wired = false

export function wireRouteLinks(): void {
	if (wired) {
		return
	}

	wired = true
	onDeepLink((url) => {
		void router.navigateUrl(url)
	})
	const initial = consumeInitialUrl()
	if (initial) {
		void router.navigateUrl(initial)
	}
}
