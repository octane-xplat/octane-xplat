// Shared implementation for @octane-xplat/ui/routing/dev — each platform leaf
// binds its own default-router module to this seam. Framework-owned dev
// actions: `xplat.navigate` plus the DevActionNavigator that drives
// route-declared dev actions to their screen before they run.

import {
	registerDevAction,
	setDevActionNavigator,
	DevNavigationError,
	type DevNavigationResult,
} from '@octane-xplat/platform/dev-actions'

import { hasNavigationBlockers, resetNavigationBlockers } from './navigation-blocker'
import { bindRouterFlow } from './router-instance'
import type { NavigationResult, RouterInstance } from '../props'

const GLOBAL_KEY = 'octane-xplat.routing-dev'

/** `xplat.navigate`'s handler — a committed outcome or DevNavigationError. @internal */
export async function runXplatNavigate(
	router: RouterInstance,
	input: Record<string, unknown>,
	context: { signal: AbortSignal },
): Promise<{ status: string; route: string }> {
	const navigation = await devNavigate(router, String(input.url), context.signal, {
		replace: input.replace === true,
	})
	if (navigation.ok) {
		return { status: 'committed', route: navigation.route ?? '' }
	}

	throw new DevNavigationError(
		navigation.code,
		`navigation to "${input.url}" did not commit (${navigation.code}, status "${navigation.status}"): ${navigation.message}`,
	)
}

/** How often a held navigation attempt is re-checked for blockers. */
const BLOCKER_POLL_MS = 150

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const describe = (result: NavigationResult): string => {
	switch (result.status) {
		case 'not-found':
			return `no route matches the URL (${result.reason})`
		case 'forbidden':
			return 'a route guard forbade the navigation'
		case 'invalid-input':
			return 'the destination failed input validation'
		case 'redirect':
			return 'the navigation was redirected and not followed'
		case 'failed':
			return `the route failed during ${result.phase}${result.error !== undefined ? `: ${result.error instanceof Error ? result.error.message : String(result.error)}` : ''}`
		case 'cancelled':
			return `the navigation was cancelled (${result.reason})`
		case 'blocked':
			return `the host refused the navigation${result.reason ? ` (${result.reason})` : ''}`
		case 'unsupported':
			return `unsupported navigation (${result.operation})`
		default:
			return `the navigation did not commit (${result.status})`
	}
}

const currentLocation = (router: RouterInstance) => {
	try {
		const snapshot = router.getSnapshot()
		return { route: snapshot.route?.href ?? null, modal: snapshot.modal }
	} catch {
		// The default client is not configured yet.
		return undefined
	}
}

const blocked = (status: string, message: string): DevNavigationResult => ({
	ok: false,
	code: 'navigation_blocked',
	status,
	message,
})

const failed = (status: string, message: string): DevNavigationResult => ({
	ok: false,
	code: 'navigation_failed',
	status,
	message,
})

/**
 * Navigate the app's root flow for a dev action. Only a committed result is
 * `ok`; a `useNavigationBlocker` hold is never auto-proceeded past — the held
 * attempt is cancelled by resetting the flow's blockers so no confirmation is
 * left open, and `navigation_blocked` is reported. The abort signal cancels
 * the same way.
 */
export async function devNavigate(
	router: RouterInstance,
	url: string,
	signal: AbortSignal,
	options?: { replace?: boolean },
): Promise<DevNavigationResult> {
	if (signal.aborted) {
		return failed('cancelled', 'the invocation was cancelled before navigation')
	}

	let flowNavigator
	try {
		// The blocker registry binds to the flow's bound navigator, not the
		// public facade — resolve it so active blockers are observable.
		flowNavigator = bindRouterFlow(router, 'root')
	} catch (error) {
		return failed(
			'unconfigured',
			`the router is not usable yet: ${(error as Error)?.message ?? error}`,
		)
	}

	const pending = router.navigateUrl(url, options)
	const outcome = await new Promise<NavigationResult | 'held' | 'aborted'>((resolve) => {
		let done = false
		const finish = (value: NavigationResult | 'held' | 'aborted') => {
			if (!done) {
				done = true
				resolve(value)
			}
		}

		pending.then(finish, (error) =>
			finish({ status: 'failed', phase: 'commit', error } as NavigationResult),
		)
		if (signal.aborted) {
			finish('aborted')
		} else {
			signal.addEventListener('abort', () => finish('aborted'), { once: true })
		}

		void (async () => {
			while (!done) {
				await sleep(BLOCKER_POLL_MS)
				if (done) {
					return
				}

				try {
					// A blocker-held attempt stays pending; an unblocked one commits
					// or fails without waiting on a confirmation.
					if (
						hasNavigationBlockers(flowNavigator) &&
						router.getSnapshot().navigation.status === 'pending'
					) {
						finish('held')
						return
					}
				} catch {
					return
				}
			}
		})()
	})

	if (outcome === 'held' || outcome === 'aborted') {
		// Resetting the flow's blockers cancels the held attempt and clears the
		// published confirmation — no navigation side effect, nothing left open.
		try {
			resetNavigationBlockers(flowNavigator)
		} catch {
			// The attempt dies with the router either way.
		}

		return outcome === 'held'
			? blocked('pending', 'a navigation blocker held the attempt for confirmation')
			: failed('cancelled', 'the invocation was cancelled during navigation')
	}

	if (outcome.status === 'committed') {
		return { ok: true, route: outcome.route?.href ?? null }
	}

	if (
		outcome.status === 'blocked' ||
		(outcome.status === 'cancelled' && hasNavigationBlockers(flowNavigator))
	) {
		return blocked(outcome.status, describe(outcome))
	}

	return failed(outcome.status, describe(outcome))
}

/**
 * Register the framework-owned `xplat.navigate` dev action and install the
 * router navigator route-declared dev actions use. Realm-singleton and
 * idempotent — HMR re-evaluations of generated route modules return the same
 * live handle. `dispose()` removes the action and uninstalls the navigator.
 * Call behind a development gate (`import.meta.env.DEV`); generated routes
 * already do.
 */
export function registerRouterDevActionsFor(router: RouterInstance): { dispose(): void } {
	const g = globalThis as unknown as Record<string, { dispose(): void } | undefined>
	const existing = g[GLOBAL_KEY]
	if (existing) {
		return existing
	}

	const handle = registerDevAction({
		id: 'xplat.navigate',
		title: 'Navigate',
		description:
			"Navigate the app's root flow to a URL, e.g. before invoking an action whose screen is not mounted.",
		input: {
			fields: {
				url: { type: 'string', description: 'URL to navigate to, e.g. /checkout' },
				replace: { type: 'boolean', default: false },
			},
		},
		result: {
			fields: {
				status: { type: 'string' },
				route: { type: 'string' },
			},
		},
		effects: { summary: 'Navigates the app root flow to a URL', navigation: true },
		execution: { concurrency: 'serialized', retryable: false },
		run: (input, context) => runXplatNavigate(router, input, context),
	})

	const restore = setDevActionNavigator({
		navigate: (url, signal) => devNavigate(router, url, signal),
		location: () => currentLocation(router),
		subscribe: (listener) => {
			try {
				return router.subscribe(listener)
			} catch {
				return () => {}
			}
		},
	})

	const registration = {
		dispose() {
			handle.dispose()
			restore()
			if (g[GLOBAL_KEY] === registration) {
				delete g[GLOBAL_KEY]
			}
		},
	}
	g[GLOBAL_KEY] = registration
	return registration
}
