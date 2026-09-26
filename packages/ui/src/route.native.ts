/** Native twin of route.web — same Route contract over Frame/Page stacks.
 *  `pushRoute` resolves a stack ('root' = the app's root Frame — an
 *  explicit registerStack('root') or, by default, the Frame returned by
 *  Application.getRootView(); named stacks come from TabSpec.stack panes
 *  or registerStack) and pushes a Page hosting the registered screen —
 *  each pushed Page is its own Octane root (decision #9: pages never
 *  share context with their presenter). Params land as props; named-stack
 *  pushes get `_stack` injected so the screen can popRoute its own stack.
 *
 *  Registration contract (the footgun this module exists to defuse):
 *  - `registerScreens(table)` once — pushRoute resolves `name` through it.
 *  - 'root' needs nothing when the app boots a Frame as its root view
 *    (the standard shape); non-Frame roots can't host pushes at all.
 *  - named stacks register via `TabSpec.stack` or `registerStack`.
 *  Every drop path warns loudly — silent no-ops are how apps ship a
 *  default route on native while working fine on web. */

import { Application, Frame, GridLayout, Page } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal/native'

import { useSyncExternalStore } from 'octane'
import { getStack, onStackRegistered, stackEntries } from './stacks.native'
import { buildRoutePath, layoutChain, linkPath, matchUrl, RouteRedirect } from './route-table'
import { RouteHost } from './RouteHost.native'
import { modalPresenter } from './modal-presenter.native'
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props'

export type { Route } from './props'

// ---------- screen registry ----------

let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}
let routeLoaders: NonNullable<RouteManifest['loaders']> = {}

/** Register the app's name → screen table (call once, from the shared
 *  routes module). Native `pushRoute` resolves `route.name` through it;
 *  on web the table feeds `screenFor` for outlets without a
 *  `resolveScreen` prop. `manifest` (from deriveRouteManifest) is stored
 *  for parity — the web leaf matches URLs through it; native navigation
 *  is name+params and only needs the table. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	screens = table
	routes = manifest ?? []
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	registerScreens(manifest.screens, manifest.routes)
	routeLayouts = manifest.layouts ?? {}
	routeLoaders = manifest.loaders ?? {}
}

export function layoutsForRoute(name: string): any[] {
	return layoutChain(routeLayouts, name)
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name]
}

/** Wrap a screen in its directory `_layout` chain (outermost →
 *  innermost) as a single root component — pushed Pages and modal roots
 *  render this, matching web's outlet wrapping. */
// ---------- stack resolution ----------

const tracked = new WeakSet<Frame>()
const listeners = new Set<() => void>()
const pageRoutes = new WeakMap<Page, Route>()
const warned = new Set<string>()

function emit() {
	listeners.forEach((l) => l())
}

function warnOnce(key: string, msg: string): void {
	if (warned.has(key)) {
		return
	}

	warned.add(key)
	console.warn('[octane-xplat] ' + msg)
}

/** Attach the route-store emission hook once per frame. `navigatedTo`
 *  fires on push AND on pop (the revealed page re-fires it), so one
 *  listener keeps every useRoute snapshot honest. */
function trackFrame(frame: Frame): void {
	if (tracked.has(frame)) {
		return
	}

	tracked.add(frame)
	frame.on('navigatedTo', () => {
		// A page re-shown by pop can stay unloaded when the frame's nav
		// bookkeeping stalls mid-transition (the iOS strand of #11444 — the
		// same hole the isLoaded/callLoaded workaround in commitRoute covers
		// for the frame itself). Views render but their gesture recognizers
		// detached on unload never re-attach: real taps die while notify()
		// probes still dispatch. onLoaded() early-returns when the flag is
		// already set, so forcing the load pass is free on the normal path.
		const page = frame.currentPage as any
		if (page && page.isLoaded === false) {
			page.callLoaded?.()
		}

		emit()
	})
}

function resolveStack(stack: string): Frame | undefined {
	const frame = getStack(stack)
	if (frame) {
		trackFrame(frame)
	}

	return frame
}

onStackRegistered((_name, frame) => {
	trackFrame(frame)
	emit()
})

// ---------- the contract ----------

// Open modal hosts, in open order — popRoute dismisses the newest first.
// showModal isn't a frame push: the underlying stack's currentPage never
// changes, so the route store emits through the modal's own bookkeeping.
const modalHosts: { host: GridLayout; route: Route; dismiss: () => void }[] = []
const swapTabRoutes = new Map<string, Route[]>()
const swapTabOrder: string[] = []

function presentationFor(name: string): Route['presentation'] {
	return routes.find((m) => m.name === name)?.presentation
}

function metaFor(name: string): RouteMeta | undefined {
	return routes.find((meta) => meta.name === name)
}

function headFor(r: Route): { title?: string; meta?: Record<string, string> } | undefined {
	const head = metaFor(r.name)?.head
	return (typeof head === 'function' ? head(r.params) : head) as
		| { title?: string; meta?: Record<string, string> }
		| undefined
}

function contextFor(r: Route): Record<string, unknown> {
	return r.context ?? {}
}

async function prepareRoute(r: Route, redirects = 0): Promise<void> {
	const beforeLoad = metaFor(r.name)?.beforeLoad
	if (!beforeLoad) {
		commitRoute(r)
		return
	}

	if (redirects > 16) {
		console.warn(`[octane-xplat] beforeLoad redirect loop for '${r.name}'`)
		return
	}

	try {
		const returned = await beforeLoad({ params: r.params, context: contextFor(r) })
		const context = returned ? { ...contextFor(r), ...returned } : contextFor(r)
		commitRoute({
			...r,
			context,
		})
	} catch (e) {
		if (e instanceof RouteRedirect) {
			await prepareRoute(e.route, redirects + 1)
			return
		}

		console.warn(`[octane-xplat] beforeLoad('${r.name}') rejected: ${(e as Error)?.message ?? e}`)
	}
}

export function redirect(r: Route): never {
	throw new RouteRedirect(r)
}

export function pushRoute(r: Route): void {
	if (metaFor(r.name)?.beforeLoad) {
		void prepareRoute(r)
		return
	}

	commitRoute(r)
}

function commitRoute(r: Route): void {
	const C = screenFor(r.name)
	if (!C) {
		warnOnce(
			'screen:' + r.name,
			`pushRoute('${r.name}') dropped — '${r.name}' isn't in the screen table. Call registerScreens({ ${r.name}: ... }) at boot.`,
		)

		return
	}

	const presentation = r.presentation ?? presentationFor(r.name)
	const loader = routeLoaders[r.name]
	if (
		loader &&
		!Object.prototype.hasOwnProperty.call(r, 'loaderData') &&
		!Object.prototype.hasOwnProperty.call(r, 'loaderError')
	) {
		void Promise.resolve()
			.then(() => loader(r.params))
			.then(
				(loaderData) => commitRoute({ ...r, loaderData }),
				(loaderError) => commitRoute({ ...r, loaderError }),
			)

		return
	}

	if (presentation === 'modal') {
		const presenter = resolveStack(r.stack) ?? resolveStack('root')
		if (presenter) {
			pushModal(presenter, { ...r, presentation }, C)
		} else {
			warnOnce('modal:' + r.name, `modal route '${r.name}' dropped — no loaded presenter Frame.`)
		}

		return
	}

	if (Application.android && r.stack !== 'root') {
		const entries = swapTabRoutes.get(r.stack) ?? []
		entries.push({ ...r, presentation })
		swapTabRoutes.set(r.stack, entries)
		const at = swapTabOrder.indexOf(r.stack)
		if (at !== -1) {
			swapTabOrder.splice(at, 1)
		}

		swapTabOrder.push(r.stack)
		const title = headFor(r)?.title
		const page = resolveStack(r.stack)?.currentPage
		if (title !== undefined && page) {
			page.actionBar.title = title
		}

		emit()
		return
	}

	const frame = resolveStack(r.stack)
	if (!frame) {
		warnOnce(
			'stack:' + r.stack,
			r.stack === 'root'
				? `pushRoute('${r.name}') dropped — no root Frame. Boot with a Frame as the app root (Application.run create() returning new Frame) or call registerStack('root', frame).`
				: `pushRoute('${r.name}') dropped — no stack '${r.stack}' is registered. Named stacks come from TabSpec.stack on <Tabs> or registerStack('${r.stack}', frame).`,
		)

		return
	}

	// TabViewItem-hosted frames report isLoaded=false after tab-selection
	// lifecycle churn; without this the nav queue defers forever (iOS
	// strand of #11444). callLoaded is idempotent once the flag holds.
	if (!(frame as any).isLoaded) {
		;(frame as any).callLoaded?.()
	}

	const props: Record<string, unknown> = {
		...r.params,
		...contextFor(r),
		...(r.stack === 'root' ? {} : { _stack: r.stack }),
		_pushed: true,
	}

	if (Object.prototype.hasOwnProperty.call(r, 'loaderData')) {
		props.data = r.loaderData
	}

	if (Object.prototype.hasOwnProperty.call(r, 'loaderError')) {
		props.error = r.loaderError
	}

	try {
		frame.navigate({
			create: () => {
				const page = new Page()
				page.id = r.name + '-page'
				page.actionBarHidden = true
				const head = headFor(r)
				if (head?.title !== undefined) {
					page.actionBar.title = head.title
				}

				pageRoutes.set(page, r)
				// Page is a ContentView — single-child (`.content` assignment
				// drops all but the last root view). Root on a GridLayout
				// child so multi-root screens can't silently lose siblings.
				const host = new GridLayout()
				page.content = host
				// .ts → .tsrx component imports type as () => Element; the
				// layout chain wraps it into a stamped universal component.
				createNativeScriptRoot(host).render(RouteHost as unknown as UniversalComponent, {
					screen: C,
					layouts: layoutsForRoute(r.name),
					params: props,
				})

				return page
			},
			transition: presentation === 'fade' ? { name: 'fade' } : undefined,
		})
	} catch (e) {
		console.warn('[octane-xplat] pushRoute(' + r.name + ') threw: ' + (e as Error)?.message)
	}
}

/** A modal route is its own Octane root on a `showModal` host — the same
 *  shape as openModal in modal-service, but tracked as a Route so
 *  popRoute/currentModalRoute stay honest. The screen receives `close`
 *  alongside its params and calls it (or popRoute) to dismiss. */
function pushModal(frame: Frame, r: Route, C: any): void {
	const host = new GridLayout()
	const root = createNativeScriptRoot(host) as any
	const entry = { host, route: r, dismiss: () => {} }
	entry.dismiss = () => {
		const i = modalHosts.indexOf(entry)
		if (i === -1) {
			return
		}

		modalHosts.splice(i, 1)
		emit()
	}

	const presenter = modalPresenter(frame)
	if (!presenter) {
		warnOnce(
			'modal-presenter:' + r.name,
			`modal route '${r.name}' dropped — no live presenter. The stack's currentPage is mid-navigation; retry once the transition settles.`,
		)

		entry.dismiss()
		root.unmount?.()
		return
	}

	try {
		modalHosts.push(entry)
		const params: Record<string, unknown> = {
			...r.params,
			...contextFor(r),
			_pushed: true,
			close: () => (host as any).closeModal?.(),
		}

		if (Object.prototype.hasOwnProperty.call(r, 'loaderData')) {
			params.data = r.loaderData
		}

		if (Object.prototype.hasOwnProperty.call(r, 'loaderError')) {
			params.error = r.loaderError
		}

		root.render(RouteHost as unknown as UniversalComponent, {
			screen: C,
			layouts: layoutsForRoute(r.name),
			params,
		})

		presenter.showModal(host, {
			context: {},
			closeCallback: entry.dismiss,
			fullscreen: true,
			animated: true,
		})

		emit()
	} catch (e) {
		entry.dismiss()
		root.unmount?.()
		console.warn('[octane-xplat] modal pushRoute(' + r.name + ') threw: ' + (e as Error)?.message)
	}
}

/** Pop the top page of a stack ('root' default) — or dismiss the top
 *  modal if one is open. Quiet no-op at the base page — matching web,
 *  where back at the app root is a no-op; loud only when the stack
 *  itself doesn't exist. */
export function popRoute(stack = 'root'): void {
	const modal = modalHosts[modalHosts.length - 1]
	if (modal) {
		// Bookkeeping first: iOS drops dismissViewController completions
		// that race a still-in-flight presentation, so the NS closeCallback
		// isn't guaranteed to run — the route store can't gate on it.
		modal.dismiss()

		;(modal.host as any).closeModal?.()
		return
	}

	if (Application.android && stack !== 'root') {
		const entries = swapTabRoutes.get(stack)
		if (entries?.length) {
			entries.pop()
			if (!entries.length) {
				swapTabRoutes.delete(stack)
				const at = swapTabOrder.indexOf(stack)
				if (at !== -1) {
					swapTabOrder.splice(at, 1)
				}
			}

			emit()
		}

		return
	}

	const frame = resolveStack(stack)
	if (!frame) {
		warnOnce('pop:' + stack, `popRoute('${stack}') dropped — no such stack is registered.`)
		return
	}

	frame.goBack()
}

/** Route stamped on a stack's current page, or null at its base page. */
export function routeFor(stack: string): Route | null {
	if (Application.android && stack !== 'root') {
		const entries = swapTabRoutes.get(stack)
		if (entries?.length) {
			return entries[entries.length - 1]
		}
	}

	const page = resolveStack(stack)?.currentPage
	return (page && pageRoutes.get(page)) ?? null
}

/** The top route across stacks — root's current route wins (a root push
 *  covers the shell); otherwise the most recently registered named stack
 *  showing a pushed page. Native has no boot URL, so this is an
 *  approximation of web's "current URL route", not a deep link. */
export function currentRoute(): Route | null {
	const root = routeFor('root')
	if (root) {
		return root
	}

	for (const name of [...swapTabOrder].reverse()) {
		const route = routeFor(name)
		if (route) {
			return route
		}
	}

	const named = [...stackEntries()].reverse()
	for (const [name] of named) {
		const r = routeFor(name)
		if (r) {
			return r
		}
	}

	return null
}

/** Named stacks containing routes, including Android's swap-pane stacks. */
export function routeStacks(): string[] {
	return Application.android
		? [...new Set([...swapTabOrder, ...[...stackEntries()].map(([name]) => name)])]
		: [...stackEntries()].map(([name]) => name)
}

/** The modal route currently open, if any — parity with the web leaf. */
export function currentModalRoute(): Route | null {
	return modalHosts[modalHosts.length - 1]?.route ?? null
}

/** Deep-link entry: normalize a URL (http(s) or app-scheme) to a path,
 *  match it against the manifest, push the route. Wire it at boot:
 *  `onDeepLink(pushDeepLink)` plus one `consumeInitialUrl()` call. */
export function pushDeepLink(url: string): boolean {
	const r = matchUrl(routes, linkPath(url))
	if (!r) {
		warnOnce('link:' + url, `pushDeepLink('${url}') dropped — no route matches.`)
		return false
	}

	pushRoute(r)
	return true
}

/** Path-string parity for the web leaf's hrefFor — a canonical
 *  /<stack>/<path> rendering of the route (deep-linking consumes it
 *  there). Native navigation itself is name+params, not URLs. */
export function hrefFor(r: Route): string {
	return buildRoutePath(routes, r)
}

export function useRoute(stack: string): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => routeFor(stack),
	)
}

/** Whether the selected native stack has a page (or route-owned Android swap
 * entry) that can be popped. The modal root is also a back affordance. */
export function canGoBack(stack = 'root'): boolean {
	const modal = modalHosts[modalHosts.length - 1]
	if (modal?.route.stack === stack) {
		return true
	}

	if (Application.android && stack !== 'root') {
		return !!swapTabRoutes.get(stack)?.length
	}

	return !!resolveStack(stack)?.canGoBack?.()
}

export function useCanGoBack(stack = 'root'): boolean {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => canGoBack(stack),
	)
}

/** The modal route overlaying the shell — parity with the web leaf. */
export function useModalRoute(): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => currentModalRoute(),
	)
}
