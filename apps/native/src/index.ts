import { Application, Frame, ListView, Page, Trace, getRootLayout } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { App } from '@xplat/app'
import { probeSignal$ } from '@xplat/app/probe-state'
import { sheetHost } from '@xplat/app/platform/sheet.native'
import { getColorScheme, registerStack, getStack, topRootLayout, findInRootLayouts } from '@octane-xplat/ui'

import { storage, wireHardwareBack } from '@xplat/app'
import 'octane/signals'
import './app.css'

// Trace the nav pipeline end-to-end: NAVIGATE → pushViewController → DID_show.
Trace.enable()
Trace.setCategories(Trace.categories.Navigation + ',' + Trace.categories.NativeLifecycle)

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>()

console.log('[harness] entry evaluated, App=' + typeof App)

let thePage: Page | null = null

// Root is a Frame (not a bare Page) so Frame.navigate can push Pages —
// the seam behind shared `openDetail`/`goBack` (Exp 9). navigate() before
// the frame attaches is queued by NS core.
function createWindowContent(): Frame {
	const frame = new Frame()
	const page = new Page()
	page.actionBarHidden = true
	console.log('[harness] createWindowContent')
	try {
		roots.add(renderNativeScriptApp(page, App))
		thePage = page
		console.log('[harness] root mounted')
	} catch (e) {
		console.log('[harness] render threw: ' + ((e as Error)?.stack || e))
	}

	frame.navigate({ create: () => page })
	// The root frame is the default nav target — registered by name because
	// Frame.topmost() is ambiguous once nested per-tab stacks exist.
	// (Optional: getStack('root') already resolves the window's root Frame.)
	registerStack('root', frame)
	wireHardwareBack()
	return frame
}

// Under the vite dev session the placeholder bootstrap has already run
// Application.run(), and a module-graph reload re-evaluates this entry.
// Android's run() throws "Application is already started" on re-entry
// (iOS core handles the placeholder handoff internally); resetRootView is
// the documented way to swap the root of a running app.
const entry = { create: () => createWindowContent() }
if (Application.started) {
	Application.resetRootView(entry)
} else {
	Application.run(entry)
}

// NS gesture events (tap/pan/swipe/longPress) don't live on the plain event
// list — view.on('tap') routes to GesturesObserver, so notify() can't reach
// them. Invoke the observer's callback directly; that still exercises the
// driver's handler → root.dispatchEvent path. GestureTypes: tap=1 pan=8
// swipe=16 longPress=64.
function fireGesture(view: any, type: number, name: string, args: any) {
	const observers = view?.getGestureObservers?.(type) ?? []
	console.log('[probe] gesture ' + name + ' observers=' + observers.length)
	for (const o of observers) {
		o.callback.call(o.context, { eventName: name, object: view, ...args })
	}
}

// --- content assertions (the empty-Cell lesson: lifecycle ≠ content) ---
function assertEq(name: string, actual: any, expected: any) {
	const ok = actual === expected
	console.log(
		'[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (got ' + JSON.stringify(actual) + ')',
	)
}

function assertHas(name: string, haystack: any[], needle: any) {
	console.log(
		'[assert] ' +
			name +
			': ' +
			(haystack.includes(needle) ? 'OK' : 'FAIL') +
			' (' +
			JSON.stringify(needle) +
			' in ' +
			JSON.stringify(haystack.slice(0, 8)) +
			')',
	)
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

function texts(root: any): string[] {
	return collect(root)
		.filter((v) => typeof v?.text === 'string' && v.text.length > 0)
		.map((v) => v.text)
}

// Some imperative hosts (sheet) mount on the CURRENT rootlayout — a
// sibling under a pushed/tab page, not necessarily under thePage.
const find = (id: string) => (thePage?.getViewById?.(id) ?? findInRootLayouts(id)) as any

// Controlled-input probe: fire textChange natively at +1.5s (between the
// self-test's shuffle and setText) to exercise the native→state direction
// without real keyboard input.
setTimeout(() => {
	const v = find('probe-input')
	console.log('[probe] textfield=' + (v ? v.constructor.name : 'none'))
	v?.notify({ eventName: 'textChange', object: v, value: 'typed!' } as any)
	const ta = find('probe-textarea')
	console.log('[probe] textview=' + (ta ? ta.constructor.name : 'none'))
	ta?.notify({ eventName: 'textChange', object: ta, value: 'line one\nline two' } as any)
}, 1500)

// A11y + content readback.
setTimeout(() => {
	const b = find('a11y-btn')
	console.log(
		'[probe] a11y accessible=' +
			b?.accessible +
			' label=' +
			b?.accessibilityLabel +
			' role=' +
			b?.accessibilityRole,
	)

	assertEq('textfield.text', find('probe-input')?.text, 'typed!')
	// TextArea leaf: multiline round-trip + rows/maxRows → dip heights.
	const ta = find('probe-textarea')
	assertEq('textview.text', ta?.text, 'line one\nline two')
	const dip = (x: any) => (x && typeof x === 'object' ? x.value : x) ?? 0
	const taMin = dip(ta?.style?.minHeight),
		taMax = dip(ta?.style?.maxHeight)

	console.log(
		'[assert] textarea rows fit: ' +
			(taMin > 0 && taMax > taMin ? 'OK' : 'FAIL') +
			' (min=' +
			taMin +
			' max=' +
			taMax +
			')',
	)
}, 1600)

// Controlled-input race (Q4): rapid successive textChange notifications —
// each passes through onChange → setText → text= write. The final state
// must not revert to an intermediate keystroke (the classic async-write
// fight on controlled native inputs). Ends by restoring 'typed!' for the
// draft-persistence assert.
setTimeout(() => {
	const v = find('probe-input')
	for (const value of ['a', 'ab', 'abc']) {
		v?.notify({ eventName: 'textChange', object: v, value } as any)
	}

	assertEq('textfield rapid typing', v?.text, 'abc')
	// Cursor: a programmatic text= write on a focused UITextField — read the
	// selection to see whether it survives (needs focus, so probe not assert).
	const tf = (v as any)?.ios
	try {
		if (tf?.selectedTextRange) {
			const end = tf.offsetFromPositionToPosition(
				tf.beginningOfDocument,
				tf.selectedTextRange.start,
			)

			console.log('[probe] cursor offset after write=' + end + ' (text len=3)')
		}
	} catch (e) {
		console.log('[probe] cursor read failed: ' + (e as Error)?.message)
	}

	v?.notify({ eventName: 'textChange', object: v, value: 'typed!' } as any)
}, 1650)

// Real-touch audit (idb ui tap found chips don't navigate): read the chip's
// iOS interaction flags + gesture recognizer state — notify()-fired taps
// bypass UITapGestureRecognizer entirely, so this is the first real check.
setTimeout(() => {
	// Chips live on the demos stack's page — a frame subtree thePage's
	// getViewById doesn't reach into (same scope as demosweep's find()).
	const demosFrame = getStack('demos') as any
	// The gallery sits wherever the sweep left it — current or a backstack page.
	const pages = [
		demosFrame?.currentPage,
		...(demosFrame?.backStack ?? []).map((b: any) => b.resolvedPage ?? b.page),
	]
	const v = pages
		.map((p: any) => p?.getViewById?.('menu-counter'))
		.find((c: any) => c != null) as any
	if (!v) {
		console.log('[probe] chip interaction: no view (pages=' + pages.length + ')')
		return
	}
	// Frame bounds chain — real taps on the pushed demo page's header Row
	// (demo-back / demo-sheet) never fire while content Pressables do:
	// suspected parent-bounds clipping from a collapsed Row.
	const probe = pages
		.map((p: any) => p?.getViewById?.('demo-back'))
		.find((c: any) => c != null) as any
	const bounds = (w: any) => {
		const f = w?.ios?.frame
		return f ? `(${f.origin.x},${f.origin.y} ${f.size.width}×${f.size.height})` : 'no-ios'
	}
	if (probe) {
		let chain: string[] = []
		let cur = probe
		while (cur && chain.length < 9) {
			chain.push(
				cur.constructor.name +
					bounds(cur) +
					' clips=' +
					(cur.ios ? cur.ios.clipsToBounds : '?') +
					(cur.hasGestureObservers?.() ? ' +gest' : ''),
			)
			cur = cur.parent
		}
		console.log('[probe] demo-back chain: ' + chain.join(' < '))
	} else {
		console.log('[probe] demo-back: no view')
	}
	// getViewById returns the first id match — if the reconciler left a stale
	// sibling in-tree, taps could target a different JS instance than the one
	// holding the observer. Count all demo-back candidates.
	const all = pages.flatMap((p: any) => collect(p)).filter((w: any) => w?.id === 'demo-back')
	for (const w of all) {
		console.log(
			'[probe] demo-back candidate loaded=' +
				w.isLoaded +
				' ios=' +
				(w.ios ? 'yes' : 'no') +
				' tapObs=' +
				(w.getGestureObservers?.(1)?.length ?? '?') +
				' recog=' +
				(w.ios?.gestureRecognizers?.count ?? '?') +
				' frame=' +
				bounds(w),
		)
	}
	// Same read on a WORKING pressable (counter-inc: real taps fire it) —
	// the comparison isolates whether observers lack recognizers on the
	// dead elements or the dead elements lack both.
	const inc = pages
		.flatMap((p: any) => collect(p))
		.find((w: any) => w?.id === 'counter-inc') as any
	if (inc) {
		console.log(
			'[probe] counter-inc tapObs=' +
				(inc.getGestureObservers?.(1)?.length ?? '?') +
				' recog=' +
				(inc.ios?.gestureRecognizers?.count ?? '?') +
				' frame=' +
				bounds(inc),
		)
	}
	console.log(
		'[probe] chip recognizers=' +
			(v.ios?.gestureRecognizers?.count ?? 0) +
			' loaded=' +
			v.isLoaded,
	)
}, 11500)

// Real-keyboard verification (idb ui type): focus probe-input programmatically
// at a fixed late slot so an external `idb ui tap`/`type` sequence has a
// first responder. Keeps hit-test-vs-type-path diagnosis separable — if
// typing lands after becomeFirstResponder but not after a real tap, the tap
// isn't reaching the UITextField (covering sibling), not the type path.
setTimeout(() => {
	const inp = find('probe-input') as any
	const tf = inp?.ios
	console.log(
		'[probe] input focus: ios=' +
			(tf ? tf.constructor?.name : 'none') +
			' editable=' +
			JSON.stringify(inp?.editable) +
			' uie=' +
			(tf?.isUserInteractionEnabled ?? '?') +
			' enabled=' +
			(tf?.isEnabled ?? '?') +
			' isFirstResponder(before)=' +
			(tf?.isFirstResponder ?? '?'),
	)
	tf?.becomeFirstResponder?.()
	setTimeout(() => {
		console.log('[probe] input isFirstResponder(after)=' + tf?.isFirstResponder)
	}, 300)
}, 13000)

// Gesture probe (Exp 10): synthesize pan + swipe on the pan-box.
setTimeout(() => {
	const v = find('pan-box')
	console.log('[probe] panbox=' + (v ? v.constructor.name : 'none'))
	fireGesture(v, 8, 'pan', { deltaX: 12, deltaY: -4, state: 2 })
	fireGesture(v, 16, 'swipe', { direction: 1 })
	// Normalized payload lands on the view (state 2 → 'moved').
	setTimeout(() => {
		console.log(
			'[assert] pan normalized: ' +
				((v as any)?.lastPanState === 'moved' ? 'OK' : 'FAIL') +
				' (' +
				(v as any)?.lastPanState +
				')',
		)
	}, 100)
}, 1700)

// Tab probe (Exp 11): selectedIndexChanged is a real property event, so
// notify() reaches it — switches to Settings, mounts its panes.
setTimeout(() => {
	const tv = find('app-tabs')
	console.log('[probe] tabview=' + (tv ? tv.constructor.name : 'none'))
	tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 1 } as any)
}, 1900)

setTimeout(() => {
	assertHas('settings texts', texts(thePage), 'Notifications')
}, 2100)

// Switch probe: checkedChange → state → driver writes `checked` — the patch
// suppresses the write-back echo (each onCheckedChange should fire once).
setTimeout(() => {
	const sw = find('sw-notifications')
	console.log('[probe] switch=' + (sw ? sw.constructor.name : 'none'))
	sw?.notify({ eventName: 'checkedChange', object: sw, value: false } as any)
}, 2300)

setTimeout(() => {
	assertEq('switch.checked', find('sw-notifications')?.checked, false)
}, 2500)

// Back to Home — assert list cells actually render item text (post-shuffle
// order is e,d,c,b,a → labels Epsilon..Alpha).
setTimeout(() => {
	const tv = find('app-tabs')
	tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 0 } as any)
}, 2600)

setTimeout(() => {
	const lv = collect(thePage).find((v) => v instanceof ListView)
	console.log(
		'[probe] listview=' +
			(lv
				? `items=${(lv.items as any)?.length} template=${typeof lv.itemTemplate} listeners=${lv.hasListeners?.('itemLoading')}`
				: 'none'),
	)

	assertHas('cell text', texts(thePage), 'Epsilon')
}, 2900)

// Dark-mode commit: some view in the tree carries the class. Timers drift
// under probe load — assert well after the +3.0s dark toggle.
setTimeout(() => {
	const hasDark = collect(thePage).some((v) =>
		String(v?.className ?? '')
			.split(/\s+/)
			.includes('ns-dark'),
	)

	console.log('[assert] dark class: ' + (hasDark ? 'OK' : 'FAIL'))
	const cs = getColorScheme()
	console.log(
		'[assert] color scheme: ' + (/^(light|dark)$/.test(cs) ? 'OK' : 'FAIL') + ' (' + cs + ')',
	)

	// Storage seam (Exp 15): ApplicationSettings write/read round-trip.
	storage.setString('probe-key', 'roundtrip')
	console.log(
		'[assert] storage roundtrip: ' +
			(storage.getString('probe-key') === 'roundtrip' ? 'OK' : 'FAIL'),
	)

	console.log(
		'[assert] draft persisted: ' +
			(storage.getString('draft') === 'typed!' ? 'OK' : 'FAIL') +
			' (' +
			storage.getString('draft') +
			')',
	)

	// styled() probe (Exp 16): variant prop composes bg-danger into className.
	const db = find('danger-btn')
	const cls = String(db?.className ?? '')
	console.log(
		'[assert] styled variant: ' +
			(cls.includes('bg-danger') && cls.includes('extra') ? 'OK' : 'FAIL') +
			' (' +
			cls +
			')',
	)
}, 4900)

// Multi-child Pressable regression: a ContentView host keeps only the last
// child (`.content` assignment). The flexboxlayout host must hold both the
// label and the conditional indicator (mounted after the ~3s scheme
// override), and tap must still reach onPress.
setTimeout(() => {
	const mp = find('multi-pressable')
	console.log('[probe] multi-pressable=' + (mp ? mp.constructor.name : 'none'))
	assertHas('pressable child text', texts(mp), 'Multi')
	console.log(
		'[assert] pressable sibling view: ' + (mp?.getViewById?.('multi-sibling') ? 'OK' : 'FAIL'),
	)

	console.log(
		'[assert] pressable conditional child: ' +
			(mp?.getViewById?.('multi-indicator') ? 'OK' : 'FAIL'),
	)

	fireGesture(mp, 1, 'tap', {})
}, 4950)

setTimeout(() => {
	assertHas('pressable tap → count', texts(thePage), 'Count: 1')
}, 5150)

// Theme toggle first (deterministic dark — the scheme override button now
// has an id), then the nav probe.
setTimeout(() => {
	fireGesture(find('scheme-toggle'), 1, 'tap', {})
}, 3000)

// Navigation probe (Exp 9) — event-driven: a pushed Page commits only when
// the nav transition finishes (setCurrent on viewDidAppear). Fixed timers
// race it; `navigatedTo` on the Frame is the real completion signal.
setTimeout(() => {
	const f = Frame.topmost() as any
	let pops = 0
	f?.on?.('navigatedTo', (e: any) => {
		const top = f.currentPage
		if (top?.id === 'detail-page') {
			assertHas('detail texts', texts(top), 'Detail screen')
			assertEq('backStack after push', f.backStack.length, 1)
			// Q-theme: does the ns-dark class / token resolution cross into a
			// pushed root? The class lives on the main page's subtree — a pushed
			// Page is a separate view tree entirely.
			const pushDark = collect(top).some((v) =>
				String(v?.className ?? '')
					.split(/\s+/)
					.includes('ns-dark'),
			)

			console.log(
				'[probe] pushed-page ns-dark: ' +
					(pushDark ? 'present — theme class crosses' : 'absent — theme class does not cross'),
			)

			const pushTok = (top as any)?.style?.getCssVariable?.('--color-primary')
			const rootTok = (thePage as any)?.style?.getCssVariable?.('--color-primary')
			console.log(
				'[probe] pushed token: ' +
					JSON.stringify(pushTok) +
					' root token: ' +
					JSON.stringify(rootTok),
			)

			setTimeout(() => f.goBack(), 250)
		} else if (top === thePage && ++pops === 1) {
			console.log('[assert] pop to main: OK')
		}
	})

	const d = find('detail-btn')
	console.log('[probe] detail-btn=' + (d ? d.constructor.name : 'none'))
	fireGesture(d, 1, 'tap', {})
}, 3500)

// ScrollView + Image probes: imperative scrollTo + offset readback; the
// data: URI decodes synchronously → imageSource present.
setTimeout(() => {
	const sv = find('scroll-box')
	console.log('[probe] scrollview=' + (sv ? sv.constructor.name : 'none'))
	sv?.scrollToVerticalOffset?.(200, false)
	console.log(
		'[assert] scroll offset: ' +
			(sv?.verticalOffset > 0 ? 'OK' : 'FAIL') +
			' (' +
			sv?.verticalOffset +
			')',
	)

	const img = find('img')
	console.log('[assert] image decoded: ' + (img?.imageSource ? 'OK' : 'FAIL'))
}, 5000)

// List @empty probe: clear → 'No items' → restore → 'Alpha'.
setTimeout(() => {
	fireGesture(find('clear-btn'), 1, 'tap', {})
}, 5300)

setTimeout(() => {
	assertHas('empty text', texts(thePage), 'No items')
	fireGesture(find('clear-btn'), 1, 'tap', {})
}, 5700)

setTimeout(() => {
	assertHas('cell text after restore', texts(thePage), 'Alpha')
}, 6100)

// Overlay probe: tap → RootLayout.open host mounts → content assert.
setTimeout(() => {
	const o = find('overlay-btn')
	console.log('[probe] overlay-btn=' + (o ? o.constructor.name : 'none'))
	fireGesture(o, 1, 'tap', {})
}, 6400)

setTimeout(() => {
	const overlay = find('overlay-host')
	assertHas('overlay texts', texts(overlay), 'Overlay content')
}, 6800)

// Universal signal-read probe: an ambient .set() (no render in flight) must
// schedule the reading component through the universal scheduler. Initial
// render already asserted implicitly — 'sig-off' is read via .get() in Home.
setTimeout(() => {
	assertHas('signal probe initial', texts(thePage), 'sig-off')
	probeSignal$.set('sig-on')
}, 6600)

setTimeout(() => {
	assertHas('signal probe after ambient set', texts(thePage), 'sig-on')
}, 7000)

// Sheet probe (Exp 11): back to tab 1, then synthesized tap on sheet-btn.
setTimeout(() => {
	const tv = find('app-tabs')
	tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 1 } as any)
}, 7100)

setTimeout(() => {
	const b = find('sheet-btn')
	console.log('[probe] sheet-btn=' + (b ? b.constructor.name : 'none'))
	fireGesture(b, 1, 'tap', {})
}, 7400)

setTimeout(() => {
	// Host ref beats id-search: the sheet's owning rootlayout can unload
	// (tab-pane shells churn) while the host stays attached to it.
	const sheet = (sheetHost() ?? find('sheet-host')) as any

	assertHas('sheet texts', texts(sheet), 'Sheet content')
	// Q-theme: sheet root — does the theme class / token resolution cross?
	const sheetDark = collect(sheet).some((v) =>
		String(v?.className ?? '')
			.split(/\s+/)
			.includes('ns-dark'),
	)

	// The app syncs its override into the theme store (setThemePreference) —
	// imperative roots must carry the scheme class on their host.
	assertHas('sheet theme class', [sheetDark ? 'ns-dark' : 'absent'], 'ns-dark')
	const sheetTok = (sheet as any)?.style?.getCssVariable?.('--color-primary')
	console.log('[probe] sheet token: ' + JSON.stringify(sheetTok))
	// Close it — a lingering RootLayout host makes later openSheet() calls
	// reject with "already been added to the root layout". Close via the
	// owning rootlayout — sheet-host may live under a pushed page's shell.
	if (sheet) {
		;(sheet as any).parent?.close?.(sheet)
	}
}, 8300)

// Modal probe (Exp 12): declarative open → showModal on a second root.
// The modal isn't under thePage — read it via presenter.modal.
setTimeout(() => {
	fireGesture(find('modal-btn'), 1, 'tap', {})
}, 8000)

setTimeout(() => {
	const f = Frame.topmost() as any
	const m = f?.currentPage?.modal
	console.log('[probe] modal=' + (m ? m.constructor.name : 'none'))
	assertHas('modal texts', texts(m), 'Modal content')
	// Q19: theme + token propagation across the modal root boundary.
	const modalDark = collect(m).some((v) =>
		String(v?.className ?? '')
			.split(/\s+/)
			.includes('ns-dark'),
	)

	console.log(
		'[probe] modal ns-dark: ' +
			(modalDark
				? 'present — theme class crosses the modal root'
				: 'absent — theme class does not cross'),
	)

	const tok = (thePage as any)?.style?.getCssVariable?.('--color-primary')
	console.log(
		'[assert] getCssVariable: ' +
			(typeof tok === 'string' && tok.length > 0 ? 'OK' : 'FAIL') +
			' (' +
			JSON.stringify(tok) +
			')',
	)

	const close = m?.getViewById?.('modal-close')
	fireGesture(close, 1, 'tap', {})
}, 8600)

setTimeout(() => {
	const f = Frame.topmost() as any
	console.log('[assert] modal closed: ' + (f?.currentPage?.modal == null ? 'OK' : 'FAIL'))
}, 9200)

// Animation probe (Exp 13): imperative to() writes translateX per frame;
// spring() integrates back to 0. No re-render involved.
setTimeout(() => {
	fireGesture(find('anim-btn'), 1, 'tap', {})
}, 9400)

setTimeout(() => {
	const v = find('anim-box')
	console.log(
		'[assert] anim moved: ' + (v?.translateX > 10 ? 'OK' : 'FAIL') + ' (' + v?.translateX + ')',
	)
}, 9750)

setTimeout(() => {
	const v = find('anim-box')
	console.log(
		'[assert] anim settled: ' +
			(Math.abs(v?.translateX ?? -1) < 5 ? 'OK' : 'FAIL') +
			' (' +
			v?.translateX +
			')',
	)
}, 10600)

// A module-graph reload re-evaluates this entry and mounts fresh roots.
import.meta.hot?.dispose(() => {
	for (const root of roots) {
		root.unmount()
	}

	roots.clear()
})
