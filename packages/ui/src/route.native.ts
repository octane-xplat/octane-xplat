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
import type { UniversalComponent, UniversalRenderable } from 'octane/universal/native'
import {
	defineUniversalComponent,
	universalChildren,
	universalComponent,
} from 'octane/universal/native'

import { useSyncExternalStore } from 'octane'
import { getStack, onStackRegistered, stackEntries } from './stacks.native'
import { buildRoutePath, layoutChain, linkPath, matchUrl, runLoader } from './route-table'
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props'

export type { Route } from './props'

// ---------- screen registry ----------

let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}

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
	routeLayouts = manifest.layouts
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name]
}

/** Wrap a screen in its directory `_layout` chain (outermost →
 *  innermost) as a single root component — pushed Pages and modal roots
 *  render this, matching web's outlet wrapping. */
function wrapInLayouts(name: string, props: Record<string, unknown>, C: any): UniversalComponent {
	let inner: UniversalRenderable = universalComponent('nativescript', C, props)
	for (const L of layoutChain(routeLayouts, name).reverse()) {
		const child = inner
		inner = universalComponent('nativescript', L, {
			children: universalChildren('nativescript', () => child),
		})
	}

	return defineUniversalComponent('nativescript', () => inner)
}

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
	frame.on('navigatedTo', emit)
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

function presentationFor(name: string): Route['presentation'] {
	return routes.find((m) => m.name === name)?.presentation
}

export function pushRoute(r: Route): void {
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

	const C = screenFor(r.name)
	if (!C) {
		warnOnce(
			'screen:' + r.name,
			`pushRoute('${r.name}') dropped — '${r.name}' isn't in the screen table. Call registerScreens({ ${r.name}: ... }) at boot.`,
		)

		return
	}

	const presentation = r.presentation ?? presentationFor(r.name)
	runLoader(routes, r)
	if (presentation === 'modal') {
		pushModal(frame, { ...r, presentation }, C)
		return
	}

	if (Application.android && r.stack !== 'root') {
		warnOnce(
			'android:' + r.stack,
			`pushRoute into named stack '${r.stack}' on Android — upstream #11444: the page mounts but currentPage/backStack/goBack never land (pages accumulate). Named-stack pushes are iOS-only until fixed.`,
		)
	}

	// TabViewItem-hosted frames report isLoaded=false after tab-selection
	// lifecycle churn; without this the nav queue defers forever (iOS
	// strand of #11444). callLoaded is idempotent once the flag holds.
	if (!(frame as any).isLoaded) {
		;(frame as any).callLoaded?.()
	}

	const props = r.stack === 'root' ? r.params : { ...r.params, _stack: r.stack }
	try {
		frame.navigate({
			create: () => {
				const page = new Page()
				page.id = r.name + '-page'
				page.actionBarHidden = true
				pageRoutes.set(page, r)
				// Page is a ContentView — single-child (`.content` assignment
				// drops all but the last root view). Root on a GridLayout
				// child so multi-root screens can't silently lose siblings.
				const host = new GridLayout()
				page.content = host
				// .ts → .tsrx component imports type as () => Element; the
				// layout chain wraps it into a stamped universal component.
				createNativeScriptRoot(host).render(wrapInLayouts(r.name, props, C), {})
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

	const presenter = (frame.currentPage ?? frame) as any
	try {
		modalHosts.push(entry)
		root.render(
			wrapInLayouts(r.name, { ...r.params, close: () => (host as any).closeModal?.() }, C),
			{},
		)

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

		;

(modal.host as any).closeModal?.()
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

	const named = [...stackEntries()].reverse()
	for (const [name] of named) {
		const r = routeFor(name)
		if (r) {
			return r
		}
	}

	return null
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
