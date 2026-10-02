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

import { createNavigationRequests, type NavigationRequest } from './navigation-request'
import { Application, Frame, GridLayout, Page } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal/native'

import { useSyncExternalStore } from 'octane'
import { getStack, onStackRegistered, stackEntries } from './stacks'
import {
	buildRoutePath,
	layoutChain,
	linkPath,
	matchUrl,
	mergeRouteManifests,
	RouteRedirect,
} from './route-table'

import { RouteHost } from './route-host.mobile'
import { modalPresenter } from './modal-presenter.mobile'
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props'

export type { Route } from './props'

// ---------- screen registry ----------

const navigationRequests = createNavigationRequests()

// Effective tables = the file-derived base manifest merged under every
// addRoutes layer. Keeping the split means an HMR re-run of routes.gen.*
// (registerRoutes again) can't wipe routes an app added at runtime.
let baseManifest: RouteManifest = { screens: {}, routes: [], layouts: {} }
const dynamicManifests: RouteManifest[] = []
let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}
let routeLoaders: NonNullable<RouteManifest['loaders']> = {}

function rebuildRegistry(): void {
	const merged = mergeRouteManifests(baseManifest, ...dynamicManifests)
	screens = merged.screens
	routes = merged.routes
	routeLayouts = merged.layouts
	routeLoaders = merged.loaders ?? {}
	emit()
}

/** Register the app's name → screen table (call once, from the shared
 *  routes module). Native `pushRoute` resolves `route.name` through it;
 *  on web the table feeds `screenFor` for outlets without a
 *  `resolveScreen` prop. `manifest` (from deriveRouteManifest) is stored
 *  for parity — the web leaf matches URLs through it; native navigation
 *  is name+params and only needs the table. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	baseManifest = { ...baseManifest, screens: table, routes: manifest ?? [] }
	rebuildRegistry()
	ensureBackWired()
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	baseManifest = manifest
	rebuildRegistry()
	ensureBackWired()
}

/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn, so a host
 *  framework can override a file route deliberately. Registered layers
 *  survive later registerRoutes re-registration (e.g. routes.gen HMR). */
export function addRoutes(manifest: RouteManifest): void {
	dynamicManifests.push(manifest)
	rebuildRegistry()
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
function trackFrame(frame: Frame, stack: string): void {
	if (tracked.has(frame)) {
		return
	}

	tracked.add(frame)
	frame.on('navigatedTo', (event) => {
		if ((event as typeof event & { isBackNavigation?: boolean })?.isBackNavigation) {
			navigationRequests.invalidate(stack)
		}

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
		trackFrame(frame, stack)
	}

	return frame
}

/** TabViewItem-hosted frames report isLoaded=false after tab-selection
 *  lifecycle churn; without re-arming, the nav queue defers pushes AND pops
 *  forever (iOS strand of #11444 — goBack also gates on isLoaded via
 *  _processNextNavigationEntry). callLoaded is idempotent once the flag
 *  holds, so run it before every navigate/goBack on a registered frame. */
function rearmFrameLoaded(frame: Frame): void {
	if (!(frame as any).isLoaded) {
		;(frame as any).callLoaded?.()
	}
}

onStackRegistered((name, frame) => {
	trackFrame(frame, name)
	ensureBackWired()
	emit()
})

// ---------- the contract ----------

// Open modal hosts, in open order — popRoute dismisses the newest first.
// showModal isn't a frame push: the underlying stack's currentPage never
// changes, so the route store emits through the modal's own bookkeeping.
const modalHosts: { host: GridLayout; route: Route; dismiss: () => void }[] = []
const swapTabRoutes = new Map<string, Route[]>()
const swapTabOrder: string[] = []

// ---------- hardware back ----------

/** App-supplied interceptors, consulted most-recent-first before the
 *  framework's default stack pop. Return true to consume the press. */
const backInterceptors: (() => boolean)[] = []
let backWired = false

/** Register an Android hardware-back interceptor. Interceptors run
 *  most-recent-first (so the topmost mounted screen wins) before the
 *  framework's default pop; returning true consumes the press. Returns
 *  an unsubscribe. iOS has no hardware back — interceptors simply never
 *  fire there. */
export function addBackInterceptor(fn: () => boolean): () => void {
	backInterceptors.push(fn)
	return () => {
		const i = backInterceptors.indexOf(fn)
		if (i !== -1) {
			backInterceptors.splice(i, 1)
		}
	}
}

/** Framework-owned default: the newest open modal, then the root stack's
 *  pushed page (a root push covers the shell), then the most recently
 *  used swap-pane stack, then any registered named stack that can pop.
 *  Returns false at the base of everything — the press falls through to
 *  the system (app exit). NS's own default pops `Frame.topmost()` — the
 *  innermost frame — which is wrong once nested stacks exist, so this
 *  ordering is deliberate. */
function defaultBackPress(): boolean {
	const modal = modalHosts[modalHosts.length - 1]
	if (modal) {
		popRoute(modal.route.stack)
		return true
	}

	if (canGoBack('root')) {
		popRoute('root')
		return true
	}

	for (const name of [...swapTabOrder].reverse()) {
		if (canGoBack(name)) {
			popRoute(name)
			return true
		}
	}

	for (const [name] of [...stackEntries()].reverse()) {
		if (name === 'root') {
			continue
		}

		if (canGoBack(name)) {
			popRoute(name)
			return true
		}
	}

	return false
}

/** Install the Android activityBackPressed listener once. Called from
 *  registerScreens and from stack registration, so any app shape that
 *  can navigate (screens or stacks registered) is covered without a
 *  module-import-time read of Application.android. The subscription is
 *  singletoned on the Application object: under vite HMR this module's
 *  state resets but the listener must not duplicate — the press handler
 *  delegates through a slot so a reloaded module graph swaps in its fresh
 *  closures instead of double-popping. */
function ensureBackWired(): void {
	if (backWired || !Application.android) {
		return
	}

	backWired = true
	const app = Application as any
	app.__octaneXplatBackPress = (e: { cancel: boolean }) => {
		for (let i = backInterceptors.length - 1; i >= 0; i--) {
			if (backInterceptors[i]()) {
				e.cancel = true
				return
			}
		}

		if (defaultBackPress()) {
			e.cancel = true
		}
	}

	if (app.__octaneXplatBackWired) {
		return
	}

	app.__octaneXplatBackWired = true
	Application.android.on(
		Application.AndroidApplication.activityBackPressedEvent,
		(e: { cancel: boolean }) => {
			app.__octaneXplatBackPress?.(e)
		},
	)
}

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

async function prepareRoute(r: Route, request: NavigationRequest, redirects = 0): Promise<void> {
	if (!request.isCurrent()) {
		return
	}

	if (!request.claim(r.stack)) {
		return
	}

	const beforeLoad = metaFor(r.name)?.beforeLoad
	if (!beforeLoad) {
		commitRoute(r, request)
		return
	}

	if (redirects > 16) {
		console.warn(`[octane-xplat] beforeLoad redirect loop for '${r.name}'`)
		return
	}

	try {
		const returned = await beforeLoad({ params: r.params, context: contextFor(r) })
		const context = returned ? { ...contextFor(r), ...returned } : contextFor(r)
		commitRoute(
			{
				...r,
				context,
			},
			request,
		)
	} catch (e) {
		if (!request.isCurrent()) {
			return
		}

		if (e instanceof RouteRedirect) {
			await prepareRoute(e.route, request, redirects + 1)
			return
		}

		console.warn(`[octane-xplat] beforeLoad('${r.name}') rejected: ${(e as Error)?.message ?? e}`)
	}
}

export function redirect(r: Route): never {
	throw new RouteRedirect(r)
}

export function pushRoute(r: Route): void {
	const request = navigationRequests.begin(r.stack)
	if (metaFor(r.name)?.beforeLoad) {
		void prepareRoute(r, request)
		return
	}

	commitRoute(r, request)
}

function commitRoute(r: Route, request: NavigationRequest): void {
	if (!request.isCurrent()) {
		return
	}

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
				(loaderData) => commitRoute({ ...r, loaderData }, request),
				(loaderError) => commitRoute({ ...r, loaderError }, request),
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

	// Swap-pane stacks live in the route store: on Android always (nested
	// Frames inside tabs are unsafe — upstream #11444), and on any native
	// target when no Frame registered the name — the self-drawn Tabs' panes
	// (decision #44) render pushed routes through RouteHost, no Frame at
	// all. A registered Frame still wins (platform UITabBar /
	// BottomNavigationView panes navigate natively on iOS).
	if (r.stack !== 'root' && (Application.android || !resolveStack(r.stack))) {
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

	rearmFrameLoaded(frame)

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
		root.unmount?.()
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
		console.warn('[octane-xplat] modal pushRoute(' + r.name + ') threw: ' + (e as Error)?.message)
	}
}

/** Pop the top page of a stack ('root' default) — or dismiss the top
 *  modal if one is open. Quiet no-op at the base page — matching web,
 *  where back at the app root is a no-op; loud only when the stack
 *  itself doesn't exist. */
export function popRoute(stack = 'root'): void {
	navigationRequests.invalidate(stack)
	const modal = modalHosts[modalHosts.length - 1]
	if (modal) {
		navigationRequests.invalidate(modal.route.stack)
		// Bookkeeping first: iOS drops dismissViewController completions
		// that race a still-in-flight presentation, so the NS closeCallback
		// isn't guaranteed to run — the route store can't gate on it.
		modal.dismiss()

		;(modal.host as any).closeModal?.()
		return
	}

	if (stack !== 'root' && (Application.android || !resolveStack(stack))) {
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

	// Same stall as pushes: a queued goBack defers forever while isLoaded is
	// stale, and nothing else re-arms the frame before the pop.
	rearmFrameLoaded(frame)
	frame.goBack()
}

/** Route stamped on a stack's current page, or null at its base page. */
export function routeFor(stack: string): Route | null {
	if (stack !== 'root' && (Application.android || !resolveStack(stack))) {
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
	return [...new Set([...swapTabOrder, ...[...stackEntries()].map(([name]) => name)])]
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
	if (!r || !screenFor(r.name)) {
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

	if (stack !== 'root' && (Application.android || !resolveStack(stack))) {
		return !!swapTabRoutes.get(stack)?.length
	}

	const frame = resolveStack(stack)
	return !!frame?.backStack?.length
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
