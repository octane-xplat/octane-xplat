import { Application, Frame, ListView } from '@nativescript/core'
import {
	currentModalRoute,
	findInRootLayouts,
	getStack,
	popRoute,
	routeFor,
} from '@octane-xplat/ui'

import { DEMOS } from '@xplat/demos'
import { goBack } from './nav'
import { closeSheet, sheetHost } from './sheet'

// Nested stacks don't work on Android yet — a TabViewItem-hosted Frame
// accepts pushes (fragment transaction commits) but setCurrent/bookkeeping
// never runs, and a push raced against attach crashes the FragmentManager
// (upstream issue NativeScript#11444). Skip the whole sweep there; the
// base probes still run.
const SKIP = Application.android != null
if (SKIP) {
	console.log('[sweep] nested stacks skipped on android — upstream #11444')
}

// Demo-catalog sweep probe (native only — web twin is a no-op). Lives outside
// apps/native/src/index.ts so the harness probe timeline stays untouched.
// The catalog is a parallel stack: the Demos tab hosts its own Frame, so
// pushes/pop happen inside the tab and never move Frame.topmost() — all
// reads scope to getStack('demos').currentPage.
// NS gestures aren't events, so tap synthesis invokes the view's
// gesture-observer callback directly.
function fireTap(view: any) {
	const observers = view?.getGestureObservers?.(1) ?? []
	if (view && view.isLoaded === false) {
		// Unloaded views keep their JS observers but lose their native
		// recognizers — the dispatch works while a real tap would die.
		// Mark it so probe results can't silently pass against a dead twin.
		console.log(
			'[sweep] tap target ' +
				(view.id ?? view.constructor.name) +
				' isLoaded=false — dead view, JS dispatch only',
		)
	}

	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'tap', object: view })
	}

	return observers.length
}

// GestureTypes.longPress = 64 — the native Hoverable trigger.
function fireLongPress(view: any) {
	const observers = view?.getGestureObservers?.(64) ?? []
	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'longPress', object: view, state: 3 })
	}

	return observers.length
}

function collect(view: any, out: any[] = []): any[] {
	if (!view) {
		return out
	}

	out.push(view)
	view.eachChildView?.((c: any) => {
		collect(c, out)
		return true
	})

	return out
}

function viewTexts(view: any): string[] {
	return collect(view)
		.filter((v) => typeof v?.text === 'string' && v.text.length > 0)
		.map((v) => v.text)
}

function dump(hay: string[]): string {
	return ' texts=' + JSON.stringify(hay.slice(-14))
}

// App demos push into the 'demos' stack (Apps pane); seam-proof demos
// push into 'test' (Test pane). Steps resolve their stack from the
// catalog kind — the current step's stack drives every page lookup.
let stepStack = 'demos'
const stackFor = (id: string) =>
	DEMOS.find((d) => d.id === id)?.kind === 'proof' ? 'test' : 'demos'
const demosPage = () => getStack(stepStack)?.currentPage

// Captured across checks — sheetHost() empties the moment closeSheet's
// finish() runs, so the detach assert needs the pre-close reference.
let lastSheetHost: any = null

function assertHas(name: string, needle: string, view: any = demosPage()) {
	const hay = viewTexts(view)
	const ok = hay.includes(needle)
	console.log(
		'[assert] ' +
			name +
			': ' +
			(ok ? 'OK' : 'FAIL') +
			' (' +
			JSON.stringify(needle) +
			')' +
			(ok ? '' : dump(hay)),
	)
}

function assertMatch(name: string, re: RegExp, view: any = demosPage()) {
	const hay = viewTexts(view)
	const ok = hay.some((t) => re.test(t))
	console.log(
		'[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + re + ')' + (ok ? '' : dump(hay)),
	)
}

function tapTargetForText(view: any, text: string, path: any[] = []): any {
	if (!view) {
		return null
	}

	const nextPath = [...path, view]
	if (view.text === text) {
		// Prefer loaded ancestors: an unloaded view still lists its JS
		// gesture observers (they only splice on removeEventListener), so an
		// unloaded match is a dead target whose real taps can't fire.
		return (
			[...nextPath]
				.reverse()
				.find((v) => v?.isLoaded !== false && (v?.getGestureObservers?.(1)?.length ?? 0) > 0) ??
			null
		)
	}

	let found: any = null
	view.eachChildView?.((child: any) => {
		found = tapTargetForText(child, text, nextPath)
		return !found
	})

	return found
}

// Same climb as tapTargetForText but matches a specific gesture type —
// e.g. Hoverable's long-press observer sits on an outer Pressable while
// the tap observer is on a nested child.
function gestureTargetForText(view: any, text: string, type: number): any {
	const all = collect(view)
	const hit = all.find((v) => v?.text === text)
	let cur = hit
	while (cur && !(cur.getGestureObservers?.(type)?.length ?? 0)) {
		cur = cur.parent
	}

	return cur ?? null
}

function runNavLinkProbe() {
	const tabView = getStack('root')?.currentPage?.getViewById?.('app-tabs')
	const homeView = (tabView as any)?.items?.[0]?.view
	const target = tapTargetForText(homeView, 'Detail →')
	const observers = fireTap(target)
	if (!observers) {
		console.log('[assert] NavLink tap target: FAIL (Detail → has no tap observer)')
		return
	}

	waitFor(
		() => routeFor('root')?.name === 'detail',
		() => {
			const route = routeFor('root')
			const ok = route?.name === 'detail' && route.params.from === 'home'
			console.log(
				'[assert] NavLink pushes detail page: ' +
					(ok ? 'OK' : 'FAIL') +
					(ok ? '' : ' — ' + JSON.stringify(route)),
			)

			if (ok) {
				popRoute('root')
			}
		},
	)
}

// Exercise the Home page's declarative NavLink through its real native tap
// observer, then return to the app shell before the nested-stack sweep.
setTimeout(runNavLinkProbe, 5000)

// The +modal route: tap 'About ⤴' → manifest presentation:'modal' →
// showModal root (currentPage untouched), popRoute dismisses it.
function runModalRouteProbe() {
	const tabView = getStack('root')?.currentPage?.getViewById?.('app-tabs')
	const homeView = (tabView as any)?.items?.[0]?.view
	const target = tapTargetForText(homeView, 'About ⤴')
	const observers = fireTap(target)
	if (!observers) {
		console.log('[assert] modal route tap target: FAIL (About ⤴ has no tap observer)')
		return
	}

	waitFor(
		() => currentModalRoute()?.name === 'about',
		() => {
			const route = currentModalRoute()
			const ok = route?.name === 'about'
			console.log('[assert] +modal route opens showModal root: ' + (ok ? 'OK' : 'FAIL'))

			const modalView = (getStack('root')?.currentPage as any)?.modal
			const texts = modalView ? viewTexts(modalView) : []
			console.log(
				'[assert] modal route screen mounted: ' +
					(texts.some((t) => t.includes('About (modal route)')) ? 'OK' : 'FAIL') +
					(modalView ? '' : ' (no modal host on currentPage)'),
			)

			popRoute('root')
			setTimeout(() => {
				console.log(
					'[assert] modal route dismissed by popRoute: ' + (currentModalRoute() ? 'FAIL' : 'OK'),
				)
			}, 600)
		},
	)
}

// Root-stack modal — not a nested-stack push, so it runs on Android too.
setTimeout(runModalRouteProbe, 6500)

// Chips live on the demos stack's current page; the sheet host sits on the
// app's RootLayout, a sibling of every page — read it from there.
const find = (id: string) => demosPage()?.getViewById?.(id)
// Imperative hosts (sheet/overlay) mount on the CURRENT page's rootlayout —
// search the demos page first, then the first-mounted rootlayout.
const findOnRoot = (id: string) => demosPage()?.getViewById?.(id) ?? findInRootLayouts(id)

interface Step {
	id: string
	/** ms to hold the pushed page before goBack. Default 900. */
	hold?: number
	checks: { at: number; run: () => void }[]
}

const STEPS: Step[] = [
	{
		id: 'counter',
		hold: 3200,
		checks: [
			{ at: 350, run: () => assertHas('demo counter', 'Demo count: 0') },
			{ at: 400, run: () => assertHas('if else mount', 'arm-B') },
			{ at: 550, run: () => fireTap(find('if-toggle')) },
			{ at: 800, run: () => assertHas('if then swap', 'arm-A') },
			// Same component, third root: open this demo inside the sheet.
			{ at: 900, run: () => fireTap(find('demo-sheet')) },
			{
				at: 1900,
				run: () => {
					// The host ref survives even when its owning rootlayout
					// unloads (tab-pane shells churn) — assert on it directly.
					lastSheetHost = sheetHost() ?? findOnRoot('sheet-host')
					const ok = collect(lastSheetHost).some(
						(v) => typeof v?.text === 'string' && v.text.includes('Demo count'),
					)

					console.log(
						'[assert] sheet hosts demo: ' +
							(ok ? 'OK' : 'FAIL') +
							' — same component in sheet root',
					)

					// Regression probe for the re-entrant RootLayout.close: the
					// 'closed' notify fires before removeChild, so a close()
					// issued from inside it double-removes and throws 'View not
					// added to this instance'. Programmatic close is the safe
					// path — the detach assert below catches leftovers.
					closeSheet()
				},
			},
			{
				at: 2700,
				run: () => {
					const ok = lastSheetHost != null && lastSheetHost.parent == null
					console.log(
						'[assert] sheet close detaches host: ' +
							(ok ? 'OK' : 'FAIL (parent=' + lastSheetHost?.parent?.constructor?.name + ')'),
					)
				},
			},
		],
	},
	{ id: 'watch', checks: [{ at: 800, run: () => assertMatch('demo watch', /\d{2}:\d{2}:\d{2}/) }] },
	{ id: 'stopwatch', checks: [{ at: 800, run: () => assertHas('demo stopwatch', '0:00.0') }] },
	{
		id: 'todo',
		checks: [{ at: 800, run: () => assertHas('demo todo', 'Nothing yet — add one.') }],
	},
	{ id: 'ttt', checks: [{ at: 800, run: () => assertHas('demo ttt', 'X to play') }] },
	{ id: 'dialer', checks: [{ at: 800, run: () => assertHas('demo dialer', 'Enter number') }] },
	{ id: 'vlist', checks: [{ at: 800, run: () => assertHas('demo vlist', '500 rows') }] },
	// Fake fetch resolves ~600ms post-mount. The 'Loading…' transient isn't
	// asserted: nav-push settle polling eats it (page mounts at navigate()
	// time, becomes the frame's currentPage ~500ms later — the loading
	// state can lapse mid-transition). Data arrival is the meaningful check.
	{
		id: 'weather',
		checks: [{ at: 1000, run: () => assertMatch('demo weather data', /°/) }],
	},
	{ id: 'anim', checks: [{ at: 800, run: () => assertHas('demo anim', 'active: none') }] },
	{
		id: 'probe',
		checks: [
			{ at: 300, run: () => assertHas('demo probe mount', 'plain-a n=0 renders=1') },
			{ at: 450, run: () => fireTap(find('rp-a')) },
			// memo-b's props are unchanged by the A bump — renders must stay 1.
			{ at: 950, run: () => assertHas('probe memo-b skipped', 'memo-b n=0 renders=1') },
		],
	},
	// --- primitives sprint demos ---
	{
		id: 'list-demo',
		hold: 2100,
		checks: [
			{ at: 400, run: () => assertHas('demo list contract', 'Doors open') },
			{ at: 500, run: () => fireTap(find('list-demo-reverse')) },
			// onEndReached ← ListView loadMoreItems (a real event — notify
			// reaches it). NS auto-refires while the last item stays visible,
			// so more than one batch may append.
			{
				at: 1100,
				run: () => {
					const lv = collect(demosPage()).find((v) => v instanceof ListView)
					console.log('[probe] list-demo listview=' + (lv ? lv.constructor.name : 'none'))
					lv?.notify({ eventName: 'loadMoreItems', object: lv } as any)
				},
			},
			// Single settled read — ListView rebuilds cells async around the
			// reverse/append rebinds. Cell tree order is NOT visual order for
			// a recycled list — collect text views with their screen y and
			// sort. 'Encore' before 'Water station' proves the reversal
			// applied; 'Added event' proves onEndReached appended.
			{
				at: 1800,
				run: () => {
					const hay = collect(demosPage())
						.filter((v) => typeof v?.text === 'string' && v.text.length > 0)
						.map((v) => ({
							text: v.text as string,
							y: v.getLocationOnScreen?.()?.y ?? 9999,
						}))
						.sort((a, b) => a.y - b.y)
						.map((v) => v.text)

					const enc = hay.indexOf('Encore')
					const water = hay.indexOf('Water station: Available by the entrance.')
					console.log(
						'[assert] list rebind order: ' +
							(enc >= 0 && water >= 0 && enc < water ? 'OK' : 'FAIL') +
							dump(hay),
					)

					console.log(
						'[assert] list onEndReached: ' +
							(hay.some((t) => t.startsWith('Added event')) ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
	{
		id: 'layout',
		checks: [
			{ at: 400, run: () => assertHas('demo layout', 'Layout primitives') },
			{ at: 400, run: () => assertHas('layout grid span', 'Sidebar') },
			// Attached-prop forwarding: the span cell must carry row/col/colSpan.
			{
				at: 450,
				run: () => {
					const span = collect(demosPage()).some(
						(v) => v.row === 1 && v.col === 0 && v.colSpan === 2,
					)

					console.log('[assert] grid attached props: ' + (span ? 'OK' : 'FAIL'))
				},
			},
			{ at: 450, run: () => assertHas('layout stack z-order', 'Top layer') },
			{ at: 450, run: () => assertHas('layout spacer footer', 'Footer') },
		],
	},
	{
		id: 'overlay',
		hold: 6800,
		checks: [
			// Overlay content mounts on the demos page's RootLayout — a
			// sibling inside the page tree.
			{
				at: 400,
				run: () => {
					const t = tapTargetForText(demosPage(), 'Toggle anchored popover')
					console.log('[probe] popover tap target: ' + (t ? t.constructor.name : 'none'))

					fireTap(t)
				},
			},
			{
				at: 500,
				run: () => assertMatch('useMeasure bounds', /Bounds \d+×\d+ @ \d+,\d+/),
			},
			{
				at: 900,
				run: () => {
					const hay = viewTexts(demosPage())
					const ok = hay.includes('Anchored to the button')
					console.log('[assert] popover anchored: ' + (ok ? 'OK' : 'FAIL') + dump(hay))
				},
			},
			// Toasts queue FIFO: bottom (2500ms) → top → anchored (1200ms).
			{ at: 1100, run: () => fireTap(tapTargetForText(demosPage(), 'Show toast')) },
			{ at: 1200, run: () => fireTap(tapTargetForText(demosPage(), 'Toast top')) },
			{ at: 1300, run: () => fireTap(tapTargetForText(demosPage(), 'Toast anchored')) },
			// Hoverable's native contract is long-press → anchored Popover.
			{
				at: 1400,
				run: () => {
					const t = gestureTargetForText(demosPage(), 'Hoverable trigger', 64)
					const n = t ? fireLongPress(t) : 0
					console.log('[probe] hoverable longPress observers=' + n)
				},
			},
			{
				at: 1600,
				run: () => {
					const ok = viewTexts(demosPage()).includes('A toast from the demo')
					console.log('[assert] toast shows: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{
				at: 2200,
				run: () => {
					const ok = viewTexts(demosPage()).includes('Hint card text')
					console.log(
						'[assert] hoverable card on long-press: ' +
							(ok ? 'OK' : 'FAIL') +
							dump(viewTexts(demosPage())),
					)
				},
			},
			{ at: 2600, run: () => fireTap(tapTargetForText(demosPage(), 'Open shade overlay')) },
			{
				at: 3200,
				run: () => {
					const hay = viewTexts(demosPage())
					const ok = hay.includes('Overlay is open')
					console.log('[assert] overlay opens: ' + (ok ? 'OK' : 'FAIL') + dump(hay))
				},
			},
			{
				at: 4300,
				run: () => {
					const ok = viewTexts(demosPage()).includes('Top toast')
					console.log('[assert] toast position=top: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{
				at: 5600,
				run: () => {
					const ok = viewTexts(demosPage()).includes('Anchored toast')
					console.log('[assert] toast anchored: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
		],
	},
	{
		id: 'controls',
		checks: [
			{ at: 400, run: () => assertMatch('demo controls', /Slider:\s*\d+/) },
			{ at: 400, run: () => assertHas('heading levels', 'Heading 6') },
		],
	},
	{
		id: 'device',
		hold: 1800,
		checks: [
			{ at: 400, run: () => assertMatch('safe area insets', /top \d+ ·/) },
			{ at: 400, run: () => assertHas('drawer main', 'Main content') },
			{ at: 500, run: () => fireTap(tapTargetForText(demosPage(), 'Open drawer')) },
			{
				at: 1200,
				run: () => {
					const d = collect(demosPage()).find((v) => typeof v.isOpened === 'function')
					console.log('[assert] drawer opens: ' + (d?.isOpened?.('left') ? 'OK' : 'FAIL'))
				},
			},
		],
	},
	{
		id: 'modal',
		hold: 4000,
		checks: [
			// Presenter: nested 'demos' frame resolves its own page; fall back to
			// the root frame's current page in case topmost() resolves outermost.
			{ at: 400, run: () => fireTap(tapTargetForText(demosPage(), 'Open children modal')) },
			{
				at: 1000,
				run: () => {
					const m = demosPage()?.modal ?? Frame.topmost()?.currentPage?.modal
					const ok = m && viewTexts(m).includes('Declarative children')
					console.log('[assert] modal children: ' + (ok ? 'OK' : 'FAIL'))
					if (ok) {
						fireTap(tapTargetForText(m, 'Close modal'))
					}
				},
			},
			{ at: 1600, run: () => fireTap(tapTargetForText(demosPage(), 'Open imperative picker')) },
			{
				at: 2200,
				run: () => {
					const m = demosPage()?.modal ?? Frame.topmost()?.currentPage?.modal
					const ok = m && viewTexts(m).includes('Choose a color')
					console.log('[assert] imperative modal: ' + (ok ? 'OK' : 'FAIL'))
					if (ok) {
						fireTap(tapTargetForText(m, 'Red'))
					}
				},
			},
			// openModal resolves in the modal's onClosed — after the dismiss
			// transition (~300ms) + promise tick, so read well after the tap.
			{ at: 3600, run: () => assertHas('modal result', 'Picked: Red') },
		],
	},
	{
		// Flex/text divergence probes — measured, not text-matched. The goal
		// is documented, comparable numbers for web↔native reasoning; FAILs
		// here mark real divergences the framework should absorb.
		id: 'divergence',
		checks: [
			{
				at: 900,
				run: () => {
					const m = (id: string) => {
						const v = collect(demosPage()).find((x) => x.id === id)
						if (!v) {
							return null
						}

						const s = v.getActualSize?.() ?? {}
						const p = v.getLocationOnScreen?.() ?? {}
						return {
							w: Math.round(s.width ?? -1),
							h: Math.round(s.height ?? -1),
							x: Math.round(p.x ?? -1),
							y: Math.round(p.y ?? -1),
						}
					}

					for (const id of [
						'dv-grow',
						'dv-grow-fill',
						'dv-lh',
						'dv-lh2',
						'dv-auto',
						'dv-auto-fix',
						'dv-wide',
						'dv-sib',
						'dv-wide-fix',
						'dv-sib-fix',
						'dv-collapse-row',
						'dv-coll-avatar',
						'dv-coll-body',
						'dv-coll-text',
						'dv-coll-actions',
						'dv-collapse-allgrow',
						'dv-ag-text',
					]) {
						const r = m(id)
						console.log('[probe] ' + id + ' ' + (r ? `${r.w}x${r.h}@${r.x},${r.y}` : 'MISSING'))
					}

					const collText = m('dv-coll-text')
					console.log(
						'[assert] Text wraps by default: ' +
							(collText && collText.h >= 30 ? 'OK' : 'FAIL') +
							(collText ? ` (${collText.h})` : ''),
					)

					const agRow = m('dv-collapse-allgrow')
					console.log(
						'[assert] auto-height grow row keeps content height: ' +
							(agRow && agRow.h >= 40 ? 'OK' : 'FAIL') +
							(agRow ? ` (${agRow.h})` : ''),
					)

					const grow = m('dv-grow-fill')
					console.log(
						'[assert] grow child keeps height: ' +
							(grow && grow.h >= 40 ? 'OK' : 'FAIL') +
							(grow ? ` (${grow.h})` : ''),
					)

					// Unguarded grow crushes the fixed sibling on BOTH engines
					// (min-width:auto = min-content everywhere) — the guard
					// utilities are what must work.
					const sibFix = m('dv-sib-fix')
					console.log(
						'[assert] shrink-0 sibling survives grow: ' +
							(sibFix && sibFix.w >= 88 ? 'OK' : 'FAIL') +
							(sibFix ? ` (${sibFix.w}@${sibFix.x})` : ''),
					)

					// Real divergence: auto margins are ignored on native — the
					// build warns; this stays FAIL until a shim exists.
					const auto = m('dv-auto')
					console.log(
						'[assert] margin-left:auto pushes trail right: ' +
							(auto && auto.x > 200 ? 'OK' : 'FAIL') +
							(auto ? ` (x=${auto.x})` : ''),
					)

					// justifyContent prop is the portable path — it must push the
					// trailing item right on native the same as web.
					const autoFix = m('dv-auto-fix')
					console.log(
						'[assert] justifyContent=space-between pushes trail right: ' +
							(autoFix && autoFix.x > 200 ? 'OK' : 'FAIL') +
							(autoFix ? ` (x=${autoFix.x})` : ''),
					)
				},
			},
		],
	},
	{
		id: 'props',
		checks: [
			{ at: 400, run: () => assertHas('demo props', 'Input is editable') },
			{
				at: 450,
				run: () => {
					const sec = collect(demosPage()).some((v) => v.secure === true)
					console.log('[assert] secure input: ' + (sec ? 'OK' : 'FAIL'))
				},
			},
			{ at: 550, run: () => fireTap(tapTargetForText(demosPage(), 'Press, hold, or double tap')) },
			{ at: 950, run: () => assertHas('press state', 'Pressed') },
			{
				at: 1000,
				run: () => {
					const b = collect(demosPage()).find((v) => v.accessibilityLabel === 'Save profile')
					console.log(
						'[assert] a11y hint+value: ' +
							(b?.accessibilityHint === 'Saves the current profile details' &&
							b?.accessibilityValue === 'Ready to save'
								? 'OK'
								: 'FAIL'),
					)
				},
			},
		],
	},
	{
		// Pan isn't a notify()-able event — drive the pan observer's callback
		// directly (fireTap's idiom for GestureTypes.pan=8), with the payload
		// shape the leaf's usePan consumes: {state:int, deltaX, deltaY, view}.
		// GestureStateTypes: cancelled=0, began=1, changed=2, ended=3.
		id: 'reorder',
		hold: 2600,
		checks: [
			{ at: 400, run: () => assertHas('demo reorder', 'Neon Coastline') },
			{
				at: 600,
				run: () => {
					const row: any = find('reorder-a')
					const obs = row?.getGestureObservers?.(8) ?? []
					console.log('[probe] reorder-a pan observers=' + obs.length)
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 1,
							deltaX: 0,
							deltaY: 0,
						})
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 2,
							deltaX: 0,
							deltaY: 90,
						})
					}
				},
			},
			{
				at: 900,
				run: () => {
					const row: any = find('reorder-a')
					console.log(
						'[assert] pan translates row: ' +
							(row?.translateY === 90 ? 'OK' : 'FAIL (' + row?.translateY + ')'),
					)

					console.log(
						'[assert] drag lifts z-index: ' +
							(row?.style?.zIndex === 1 ? 'OK' : 'FAIL (' + row?.style?.zIndex + ')') +
							' layer.zPosition=' +
							row?.nativeViewProtected?.layer?.zPosition,
					)

					// Pitch is row height (52) + gap (8) = 60 dips; dy=90 → hover=2,
					// so the two rows the drag crossed each shift up one slot.
					const b: any = find('reorder-b')
					console.log(
						'[assert] sibling makes room: ' +
							(b?.translateY === -60 ? 'OK' : 'FAIL (' + b?.translateY + ')'),
					)
				},
			},
			{
				at: 950,
				run: () => {
					const row: any = find('reorder-a')
					const obs = row?.getGestureObservers?.(8) ?? []
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 3,
							deltaX: 0,
							deltaY: 90,
						})
					}
				},
			},
			{
				at: 1500,
				run: () => {
					const order = collect(demosPage())
						.filter((v) => typeof v?.id === 'string' && v.id.startsWith('reorder-'))
						.map((v) => v.id)

					console.log(
						'[assert] drop commits reorder: ' +
							(order[0] === 'reorder-b' && order[2] === 'reorder-a'
								? 'OK'
								: 'FAIL (' + JSON.stringify(order) + ')'),
					)

					const row: any = find('reorder-a')
					console.log(
						'[assert] shifts cleared on drop: ' +
							(row?.translateY === 0 && row?.style?.zIndex !== 1 ? 'OK' : 'FAIL'),
					)
				},
			},
			// Cancelled gesture: began+moved then state:0 — no commit, shifts
			// restore.
			{
				at: 1700,
				run: () => {
					const row: any = find('reorder-b')
					const obs = row?.getGestureObservers?.(8) ?? []
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 1,
							deltaX: 0,
							deltaY: 0,
						})
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 2,
							deltaX: 0,
							deltaY: -80,
						})
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 0,
							deltaX: 0,
							deltaY: -80,
						})
					}
				},
			},
			{
				at: 2200,
				run: () => {
					const order = collect(demosPage())
						.filter((v) => typeof v?.id === 'string' && v.id.startsWith('reorder-'))
						.map((v) => v.id)

					const row: any = find('reorder-b')
					console.log(
						'[assert] cancelled pan restores order+shifts: ' +
							(order[0] === 'reorder-b' && row?.translateY === 0 ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
	{
		id: 'glass',
		checks: [
			{
				at: 800,
				run: () => {
					// The LiquidGlass leaf's root IS a UIVisualEffectView —
					// identity-check proves registerElement + host swap worked
					// (the glass material itself is a visual, not assertable).
					const EffectView = (globalThis as any).UIVisualEffectView
					const lg = find('glass-regular')
					const lgc = find('glass-container')

					console.log(
						'[assert] liquidglass root is UIVisualEffectView: ' +
							(lg && EffectView && lg.nativeViewProtected instanceof EffectView ? 'OK' : 'FAIL'),
					)

					console.log(
						'[assert] liquidglasscontainer root is UIVisualEffectView: ' +
							(lgc && EffectView && lgc.nativeViewProtected instanceof EffectView ? 'OK' : 'FAIL'),
					)

					// iOS 26+: the effect objects themselves are live —
					// UIGlassEffect on the layout, UIGlassContainerEffect on
					// the merged region. On <26 these read plain UIVisualEffect.
					console.log(
						'[assert] liquidglass carries UIGlassEffect: ' +
							(lg?.nativeViewProtected?.effect?.constructor?.name === 'UIGlassEffect'
								? 'OK'
								: 'FAIL (' + lg?.nativeViewProtected?.effect?.constructor?.name + ')'),
					)

					console.log(
						'[assert] container carries UIGlassContainerEffect: ' +
							(lgc?.nativeViewProtected?.effect?.constructor?.name === 'UIGlassContainerEffect'
								? 'OK'
								: 'FAIL (' + lgc?.nativeViewProtected?.effect?.constructor?.name + ')'),
					)

					// The `glass` prop writes iosGlassEffect on the host — config
					// object round-trips through the Property setter.
					const prop: any = find('glass-prop')

					console.log(
						'[assert] glass prop sets iosGlassEffect: ' +
							(prop?.iosGlassEffect?.variant === 'regular' ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
]

/** Poll until `cond` or give up (~2s), then continue. Nested-frame push/pop
 *  transitions update frame.currentPage asynchronously — fixed offsets
 *  race them. */
function waitFor(cond: () => boolean, then: () => void, tries = 20) {
	const tick = () => {
		if (cond() || --tries <= 0) {
			then()
		} else {
			setTimeout(tick, 100)
		}
	}

	tick()
}

let galleryPage: any = null

if (!SKIP) {
	setTimeout(() => {
		// Frame.topmost() is unreliable once nested stacks exist — on Android it
		// returns the innermost frame. The boot registers the app frame as 'root'.
		const tv = getStack('root')?.currentPage?.getViewById?.('app-tabs')
		console.log('[sweep] switching to Demos tab, tabview=' + (tv ? tv.constructor.name : 'none'))
		tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 2 } as any)
	}, 9600)
}

// Poll for the frame's default page AND its first chip's views — pane
// attach + first-navigation + native-attach latency can run seconds
// past the CORE trace; pushing while appearance is still settling
// stalls bookkeeping (setCurrent) and leaves chips without observers.
if (!SKIP) {
	setTimeout(() => {
		waitFor(
			() => {
				const chip = find('menu-counter')
				// A dead gallery twin (unloaded subtree) satisfies getViewById
				// but can never take a real tap — wait for the live one.
				return demosPage() != null && chip != null && chip.isLoaded !== false
			},
			() => {
				galleryPage = demosPage()
				console.log(
					'[sweep] demos stack=' +
						(getStack('demos') ? 'registered' : 'MISSING') +
						' gallery=' +
						(galleryPage ? galleryPage.constructor.name : 'none'),
				)

				setTimeout(() => runStep(0), 400)
			},
			60,
		)
	}, 9600)
}

function runStep(i: number) {
	if (i >= STEPS.length) {
		return
	}

	const step = STEPS[i]
	stepStack = stackFor(step.id)
	const gal = demosPage()
	const chip = find('menu-' + step.id)
	// Hit-area probe: a view drawn outside its parent's bounds still renders
	// (iOS doesn't clip by default) but hitTest never reaches it — the
	// candidate mechanism for chips that highlight yet never fire onPress.
	// loaded=false marks the JS view as dead (recognizers detached).
	let chipInfo = ''
	if (chip) {
		const cSize = (chip as any).getActualSize?.()
		const pSize = (chip.parent as any)?.getActualSize?.()
		const rel = (chip as any).getLocationRelativeTo?.(chip.parent)
		const outOfParent =
			rel && pSize && cSize
				? rel.x < -1 ||
					rel.y < -1 ||
					rel.x + cSize.width > pSize.width + 1 ||
					rel.y + cSize.height > pSize.height + 1
				: 'n/a'

		chipInfo = ' loaded=' + chip.isLoaded + ' outOfParent=' + outOfParent
	}

	console.log(
		'[sweep] menu-' +
			step.id +
			' stack=' +
			stepStack +
			' tap observers=' +
			fireTap(chip) +
			chipInfo,
	)
	waitFor(
		() => demosPage() !== gal,
		() => {
			for (const c of step.checks) {
				setTimeout(c.run, c.at)
			}

			setTimeout(() => {
				console.log('[sweep] goBack ' + step.id)
				goBack({ into: stepStack })
				waitFor(
					() => demosPage() === gal,
					() => {
						// 'Last opened' echo lives on the Apps Gallery only —
						// proof steps land on the Test pane's proof row instead.
						assertHas(
							'lastDemo ' + step.id,
							stepStack === 'test' ? 'Seam proofs' : 'Last opened: ' + step.id,
						)

						setTimeout(() => runStep(i + 1), 150)
					},
				)
			}, step.hold ?? 900)
		},
	)
}
