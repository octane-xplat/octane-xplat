import { Application, Color, Frame, GridLayout, ListView, Page, Trace } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { App } from '@xplat/app'
import { installParityDump } from '@xplat/app/parity/measure'
import {
	VirtualListBenchmark,
	VirtualListBenchmarkFixed,
} from '@xplat/app/virtual-list-benchmark-host.mobile'
import { probeSignal$ } from '@xplat/app/probe-state'
import {
	runVirtualListBenchmark,
	runVirtualListInputBenchmark,
} from '@xplat/app/platform/virtual-list-benchmark.mobile'
import {
	VIRTUAL_LIST_BENCH_FIXED_MODE,
	VIRTUAL_LIST_BENCH_MODE,
	VIRTUAL_LIST_INPUT_DURATION_MS,
	VIRTUAL_LIST_INPUT_MODE,
} from '@xplat/app/platform/virtual-list-benchmark-mode.mobile'
import { sheetHost } from '@xplat/app/platform/sheet'
import '@xplat/app/platform/filepick.mobile'
import {
	getColorScheme,
	registerStack,
	getStack,
	routeFor,
	popRoute,
	setThemePreference,
} from '@octane-xplat/ui'

import { findInRootLayouts } from '@octane-xplat/ui/native'

import { storage, navigate, goBack } from '@xplat/app'
import 'octane/signals'
installParityDump()
if (!VIRTUAL_LIST_BENCH_MODE) void import('@xplat/app/platform/paritysweep')
// Per-file css module imports — same shape as apps/web/src/main.tsrx. Each
// module passes the xplat-native-css transform (px→dip + xplat-web-only
// strip); an @import'd chain inlines raw text and bypasses it — that's how
// the slider's web-only translate() leaked onto native views.
import '@octane-xplat/ui/theme/tokens.css'
import '@xplat/demos/demo.css'
import '@xplat/app/app.css'

// Trace the nav pipeline end-to-end: NAVIGATE → pushViewController → DID_show.
Trace.enable()
Trace.setCategories(Trace.categories.Navigation + ',' + Trace.categories.NativeLifecycle)

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>()

console.log('[harness] entry evaluated, App=' + typeof App)

let thePage: Page | null = null

function virtualListBenchmarkReport(metrics: Awaited<ReturnType<typeof runVirtualListBenchmark>>) {
	return {
		schema: metrics.schema,
		target: metrics.target,
		fixture: {
			rows: metrics.fixture.rowCount,
			height: metrics.fixture.totalContentHeight,
		},
		durationMs: metrics.durationMs,
		frameMs: {
			p50: metrics.streamFrameIntervalMs.p50,
			p95: metrics.streamFrameIntervalMs.p95,
			max: metrics.streamFrameIntervalMs.max,
		},
		frames: {
			count: metrics.stream.frames,
			lagged: metrics.stream.laggedFrames,
		},
		seeks: {
			ready: metrics.deepSeekLatencyMs.samples,
			timeouts: metrics.deepSeekLatencyMs.timeouts,
			latencyMs: metrics.deepSeekLatencyMs.p50,
			results: metrics.deepSeekLatencyMs.results.map((result) => [
				result.requestedOffset,
				result.actualOffset,
				result.status === 'ready' ? 1 : 0,
			]),
		},
		mountedRows: [metrics.mountedRows.p50, metrics.mountedRows.max],
		coverage: {
			stream: [
				metrics.visibleCoverage.stream.gapSamples,
				metrics.visibleCoverage.stream.maxMissingVisibleRows,
				metrics.visibleCoverage.stream.maxGapUnits,
				metrics.visibleCoverage.stream.worst?.offset ?? null,
			],
			seeks: [
				metrics.visibleCoverage.deepSeeks.gapSamples,
				metrics.visibleCoverage.deepSeeks.maxMissingVisibleRows,
				metrics.visibleCoverage.deepSeeks.maxGapUnits,
				metrics.visibleCoverage.deepSeeks.worst?.offset ?? null,
			],
		},
		rowChurn: [metrics.rowChurn.mounted, metrics.rowChurn.unmounted],
		timerDriftMs: [metrics.eventLoopTimerDriftMs.p95, metrics.eventLoopTimerDriftMs.max],
	}
}

// Root is a Frame (not a bare Page) so Frame.navigate can push Pages —
// the seam behind shared `openDetail`/`goBack` (Exp 9). navigate() before
// the frame attaches is queued by NS core.
function createWindowContent(): Frame {
	const frame = new Frame()
	const page = new Page()
	page.actionBarHidden = true
	console.log('[harness] createWindowContent')
	try {
		const rootComponent = VIRTUAL_LIST_BENCH_MODE
			? VIRTUAL_LIST_BENCH_FIXED_MODE
				? VirtualListBenchmarkFixed
				: VirtualListBenchmark
			: App
		roots.add(renderNativeScriptApp(page, rootComponent))
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

if (VIRTUAL_LIST_BENCH_MODE) {
	const startWhenMounted = (tries = 100) => {
		const list = thePage?.getViewById?.('vlist-bench-list') ?? findInRootLayouts('vlist-bench-list')
		if (list) {
			if (VIRTUAL_LIST_INPUT_MODE) {
				const target = Application.android != null ? 'android' : 'ios'
				const heightMode = VIRTUAL_LIST_BENCH_FIXED_MODE ? 'fixed48' : 'variable'
				console.log(
					'[vlist-input] ready ' +
					JSON.stringify({ target, heightMode, durationMs: VIRTUAL_LIST_INPUT_DURATION_MS }),
				)
				void runVirtualListInputBenchmark(
					'vlist-bench-list',
					VIRTUAL_LIST_INPUT_DURATION_MS,
					thePage,
				)
					.then((metrics) =>
						console.log(
							'[vlist-input] result ' + JSON.stringify({ heightMode, ...metrics }),
						),
					)
					.catch((error) => {
						const message = error instanceof Error ? error.message : String(error)
						console.log('[vlist-input] error ' + message)
					})
				return
			}
			void runVirtualListBenchmark('vlist-bench-list', thePage)
				.then((metrics) =>
					console.log('[vlist-benchmark] result ' + JSON.stringify(virtualListBenchmarkReport(metrics))),
				)
				.catch((error) => {
					const message = error instanceof Error ? error.message : String(error)
					console.log('[vlist-benchmark] error ' + message)
				})
			return
		}

		if (tries <= 0) {
			console.log('[vlist-benchmark] error benchmark list did not mount')
			return
		}

		setTimeout(() => startWhenMounted(tries - 1), 100)
	}
	setTimeout(startWhenMounted, 100)
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

// Self-drawn Tabs (decision #44): tab switching is a Pressable tap on the
// tab chip — `selectedIndexChanged` notify is dead API.
function tapTab(label: string) {
	const hit = collect(thePage).find((v: any) => v?.text === label)
	let cur = hit
	while (cur && !(cur.getGestureObservers?.(1)?.length ?? 0)) {
		cur = cur.parent
	}

	if (!cur) {
		console.log('[probe] tab chip tap target: none (' + label + ')')
		return
	}

	for (const o of cur.getGestureObservers(1)) {
		o.callback.call(o.context, { eventName: 'tap', object: cur })
	}
}

if (!VIRTUAL_LIST_BENCH_MODE) {
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

// Cascade layers: @layer rules must reach native views. `layer-probe` is
// contested by #layer-probe in the earlier layer vs .xplat-layer-probe in the
// later one — layer order beats specificity, so 0.35 wins. The unlayered
// class rule beats the layered id selector on layer-unlayered-probe.
setTimeout(() => {
	const hex = (c: any) => (c && typeof c === 'object' ? (c.hex ?? String(c)) : String(c))?.toLowerCase?.()
	const lp = find('layer-probe')
	const up = find('layer-unlayered-probe')
	console.log('[probe] layer-probe=' + (lp ? lp.constructor.name : 'none') + ' opacity=' + lp?.opacity)
	assertEq('layer order beats specificity', lp?.opacity, 0.35)
	assertEq('unlayered beats layered', hex(up?.style?.backgroundColor ?? up?.backgroundColor), '#22c55e')
}, 1650)

// Smooth corners (decision #38): uniform-radius classes take the
// CALayer.cornerCurve path; non-uniform (sheet-style) radii go through the
// patched superellipse mask path. Numeric checks only — no screenshots.
let cornersProbe: GridLayout | null = null
setTimeout(() => {
	const chip = collect(thePage).find(
		(v: any) => typeof v?.className === 'string' && v.className.split(' ').includes('chip'),
	) as any

	const curve = chip?.ios?.layer?.cornerCurve

	console.log(
		'[assert] uniform squircle cornerCurve: ' +
			(String(curve) === 'continuous' && (chip?.ios?.layer?.cornerRadius ?? 0) > 0
				? 'OK'
				: 'FAIL') +
			' (curve=' +
			curve +
			' shape=' +
			chip?.style?.cornerShape +
			')',
	)

	// Non-uniform synthetic view — top corners rounded, bottom square.
	cornersProbe = new GridLayout()
	cornersProbe.width = 100
	cornersProbe.height = 100
	cornersProbe.horizontalAlignment = 'left'
	cornersProbe.verticalAlignment = 'top'
	cornersProbe.style.backgroundColor = new Color('#4f46e5')
	cornersProbe.style.borderTopLeftRadius = 20
	cornersProbe.style.borderTopRightRadius = 20
	cornersProbe.style.cornerShape = 'squircle'

	;((thePage as any)?.content as any)?.addChild?.(cornersProbe)
}, 1700)

// (96,4) in the top-right corner box sits INSIDE a squircle but OUTSIDE a
// circular arc of the same radius — containsPoint discriminates the curve.
setTimeout(() => {
	const layer = cornersProbe?.ios?.layer
	const path = (layer?.mask as any)?.path
	const bpath = path ? UIBezierPath.bezierPathWithCGPath(path) : null
	const ox = layer?.bounds?.origin?.x ?? 0
	const oy = layer?.bounds?.origin?.y ?? 0
	const insideSquircle = bpath?.containsPoint?.(CGPointMake(ox + 96, oy + 4))
	const nearVertex = bpath?.containsPoint?.(CGPointMake(ox + 96, oy + 2))
	console.log(
		'[assert] non-uniform squircle mask: ' +
			(insideSquircle === true && nearVertex === false ? 'OK' : 'FAIL') +
			' (mask=' +
			(layer?.mask ? layer.mask.constructor?.name : 'none') +
			' in(96,4)=' +
			insideSquircle +
			' out(96,2)=' +
			nearVertex +
			')',
	)

	;(thePage as any)?.content?.removeChild?.(cornersProbe)

	cornersProbe = null
}, 2600)

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

	// The write lands through the leaf's controlled-write effect — reads
	// must wait a turn for the state flush instead of racing it.
	setTimeout(() => assertEq('textfield rapid typing', v?.text, 'abc'), 120)
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
// Swap-pane stacks hold no Frame — enumerate every menu-counter candidate
// in the root page subtree, and keep re-dumping while the sweep pushes/pops
// (dead twins can linger in detached subtrees while the live chip renders
// elsewhere). `loc` feeds `idb ui tap` for a REAL touch, which is the only
// thing that exercises the UITapGestureRecognizer path.
let chipDumps = 0
const dumpChips = () => {
	const candidates = collect(thePage).filter((w: any) => w?.id === 'menu-counter')

	const nativeOf = (w: any) => w.ios ?? w.android
	for (const w of candidates) {
		const nv = nativeOf(w)
		const loc = w.getLocationOnScreen?.()
		const size = w.getActualSize?.()
		console.log(
			'[probe] menu-counter candidate loaded=' +
				w.isLoaded +
				' tapObs=' +
				(w.getGestureObservers?.(1)?.length ?? '?') +
				' recog=' +
				(nv?.gestureRecognizers?.count ?? (nv ? 'android' : 'no-native')) +
				' loc=' +
				(loc && size ? `${Math.round(loc.x)},${Math.round(loc.y)} ${Math.round(size.width)}x${Math.round(size.height)}` : 'n/a') +
				' uie=' +
				(nv?.isUserInteractionEnabled ?? nv?.isClickable?.() ?? '?'),
		)
	}

	// UIApplication interaction gate: a navigation transition that never
	// completed leaves beginIgnoringInteractionEvents latched — recognizers
	// stay attached but every real touch is dropped.
	const appIos = (Application as any).ios
	const nativeApp = appIos?.nativeApp ?? (globalThis as any).UIApplication?.sharedApplication
	console.log(
		'[probe] ignoringInteractions=' +
			(nativeApp?.isIgnoringInteractionEvents ?? nativeApp?.ignoringInteractionEvents ?? 'n/a') +
			' iosApp=' +
			(appIos ? 'yes' : 'no') +
			' nativeApp=' +
			(nativeApp ? 'yes' : 'no'),
	)

	// iOS hit-test at the chip's center — is the touch landing on the chip's
	// own UIView (recognizers attached) or an interloper?
	const chip = candidates[0]
	if (chip?.ios) {
		const loc = chip.getLocationOnScreen?.()
		const size = chip.getActualSize?.()
		if (loc && size?.width) {
			const win = chip.ios.window
			const hit = win?.hitTestWithEvent?.(
				CGPointMake(loc.x + size.width / 2, loc.y + size.height / 2),
				undefined,
			)

			let chain = ''
			let cur = hit
			for (let i = 0; cur && i < 6; i++) {
				const desc = String(cur.description ?? cur).replace(/<|>/g, '').split(':')[0]
				chain += ' < ' + desc
				cur = cur.superview
			}

			console.log(
				'[probe] chip hitTest=' +
					(hit === chip.ios ? 'chip' : hit === chip.ios.subviews?.firstObject ? 'chip-child' : 'other') +
					' hitIsDescendantOfChip=' +
					(hit?.isDescendantOfView?.(chip.ios) ?? '?') +
					' chain=' +
					chain,
			)
		}
	}

	// RootLayout children audit — a leftover popup host or shade cover with a
	// tap observer and full bounds shadows every real touch beneath it.
	for (const rl of collect(thePage).filter((w: any) => w?.constructor?.name === 'RootLayout')) {
		const count = (rl as any).getChildrenCount?.() ?? 0
		const kids = Array.from({ length: count }, (_: any, i: number) => (rl as any).getChildAt(i))
		const pv = (rl as any)._popupViews?.length ?? 0
		const shade = (rl as any)._shadeCover
		console.log(
			'[rlaudit] rootlayout children=' +
				kids.length +
				' popups=' +
				pv +
				' shade=' +
				(shade ? 'present' : 'none') +
				' kids=[' +
				kids
					.map((k: any) => {
						const l = k.getLocationOnScreen?.()
						const s = k.getActualSize?.()
						return (
							k.constructor.name +
							(k.id ? '#' + k.id : '') +
							(k.className ? '.' + k.className : '') +
							(l && s ? `@${Math.round(l.x)},${Math.round(l.y)} ${Math.round(s.width)}x${Math.round(s.height)}` : '') +
							' recog=' +
							(k.ios ? (k.ios.gestureRecognizers?.count ?? 0) : k.android ? 'a' : '?')
						)
					})
					.join(', ') +
				']',
		)
	}

	// Every tap-bearing view on screen — feeds real-tap picks on any tab.
	for (const w of collect(thePage)) {
		if (!((w as any)?.getGestureObservers?.(1)?.length ?? 0)) {
			continue
		}

		const loc = (w as any).getLocationOnScreen?.()
		const size = (w as any).getActualSize?.()
		if (!loc || !size || !size.width) {
			continue
		}

		console.log(
			'[tapview] ' +
				((w as any).id ?? (typeof (w as any).text === 'string' ? JSON.stringify((w as any).text.slice(0, 18)) : (w as any).constructor.name)) +
				' loc=' +
				`${Math.round(loc.x)},${Math.round(loc.y)} ${Math.round(size.width)}x${Math.round(size.height)}` +
				' loaded=' +
				(w as any).isLoaded +
				' recog=' +
				(nativeOf(w)?.gestureRecognizers?.count ?? '?') +
				' cls=' +
				((w as any).className ?? '') +
				' parent=' +
				((w as any).parent?.constructor?.name ?? '?') +
				((w as any).parent?.className ? '/' + (w as any).parent.className : ''),
		)
	}
}

const chipTimer = setInterval(() => {
	if (++chipDumps > 300) {
		clearInterval(chipTimer)
		return
	}

	dumpChips()
}, 2000)

setTimeout(dumpChips, 11500)

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

// Tab probe: the tab bar is a Pressable row — tap the Test chip to mount
// its pane.
setTimeout(() => {
	tapTab('Test')
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
	tapTab('Home')
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
	// Multi lives on the Probes tab now — its own counter label echoes.
	assertEq('pressable tap → count', find('probe-count')?.text, 'Count: 1')
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
	f?.on?.('navigatedTo', () => {
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

// The overlay host is a full-bounds popup child of the app's RootLayout —
// left open it shadows every real tap for the rest of the run (the chip
// dead-tap investigation). Close it the same way the sheet probe closes.
setTimeout(() => {
	const overlay = find('overlay-host') as any
	if (overlay?.parent?.close) {
		overlay.parent.close(overlay).catch(() => {})
		console.log('[probe] overlay dismissed')
	}
}, 7200)

// Universal signal-read probe: an ambient .set() (no render in flight) must
// schedule the reading component through the universal scheduler. The label
// lives on the Probes tab — pane views are all mounted, so getViewById
// reaches it without switching tabs.
setTimeout(() => {
	assertEq('signal probe initial', find('sig-probe')?.text, 'sig-off')
	probeSignal$.set('sig-on')
}, 6600)

setTimeout(() => {
	assertEq('signal probe after ambient set', find('sig-probe')?.text, 'sig-on')
}, 7000)

// Sheet probe: back to the Test tab, then synthesized tap on sheet-btn.
setTimeout(() => {
	tapTab('Test')
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
	// RootLayout bookkeeping: the host must be a tracked popup child of a
	// RootLayout (getPopupIndex >= 0) — an untracked child is invisible to
	// bringToFront/closeAll and leaks shade covers.
	const owner = (sheet as any)?.parent as any
	const popupIndex = owner?.getPopupIndex?.(sheet)
	console.log(
		'[assert] sheet host registered: ' +
			(owner?.constructor?.name === 'RootLayout' && popupIndex >= 0 ? 'OK' : 'FAIL') +
			' (owner=' +
			(owner?.constructor?.name ?? 'none') +
			' popupIndex=' +
			popupIndex +
			')',
	)

	// Close it — a lingering RootLayout host makes later openSheet() calls
	// reject with "already been added to the root layout". Close via the
	// owning rootlayout — sheet-host may live under a pushed page's shell.
	if (sheet) {
		;(sheet as any).parent?.close?.(sheet)
	}
}, 7800)

// Modal probe (Exp 12): declarative <Sheet> on a second root — back to the
// Home tab first (modal-btn lives there; pane views unmount on switch).
// The imperative sheet assert/close runs at 7.8s, before the Home switch —
// once the Test pane unloads, its hosted popups lose their RootLayout owner.
setTimeout(() => {
	tapTab('Home')
}, 8000)

setTimeout(() => {
	fireGesture(find('modal-btn'), 1, 'tap', {})
}, 8300)

setTimeout(() => {
	// The declarative modal seam is the in-window Sheet — a popup host on the
	// RootLayout, not a native showModal page.modal. Reach it through
	// modal-close's ancestors (the vx-sheet-host GridLayout).
	const closeBtn = find('modal-close')
	let host: any = closeBtn
	while (host && !String(host.className ?? '').includes('vx-sheet-host')) {
		host = host.parent
	}

	console.log('[probe] modal=' + (host ? host.constructor.name : 'none'))
	assertHas('modal texts', texts(host), 'Modal content')
	// Q19: theme + token propagation across the sheet's separate root.
	const modalDark = collect(host).some((v) =>
		String(v?.className ?? '')
			.split(/\s+/)
			.includes('ns-dark'),
	)

	console.log(
		'[probe] modal ns-dark: ' +
			(modalDark
				? 'present — theme class crosses the sheet root'
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

	fireGesture(closeBtn, 1, 'tap', {})
}, 8800)

setTimeout(() => {
	const gone = !find('modal-close')
	console.log('[assert] modal closed: ' + (gone ? 'OK' : 'FAIL'))
}, 9300)

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

// ---------------------------------------------------------------------------
// Android-only probes. The iOS demosweep is skipped on Android — its steps
// read native Page/Frame objects, while Android named stacks are
// router-owned swap panes (upstream #11444; fix ported as #11446 in the
// core patch). SwapTabs is the Android path under test — tab switching is
// a Pressable tap, not selectedIndexChanged.
if (Application.android && !VIRTUAL_LIST_BENCH_MODE) {
	const waitFor = (cond: () => boolean, then: () => void, tries = 40) => {
		const tick = () => {
			if (cond() || --tries <= 0) {
				then()
			} else {
				setTimeout(tick, 100)
			}
		}

		tick()
	}

	// Nearest ancestor (or self) of the text view carrying a gesture
	// observer of `type` — SwapTabs tabs are Pressables wrapping Text.
	const gestureTarget = (root: any, text: string, type = 1) => {
		let cur = collect(root).find((v) => v?.text === text)
		while (cur && !(cur.getGestureObservers?.(type)?.length ?? 0)) {
			cur = cur.parent
		}

		return cur ?? null
	}

	const tabView = () => find('app-tabs')
	const paneTexts = () => texts(tabView())

	// EditText controlled-write cursor behavior: park the selection
	// mid-string, then push a controlled value= write through the leaf
	// (textChange → onChange → setState → writeText) and read where the
	// cursor lands. The leaf must preserve/restore selection around the
	// Android setText — a direct f.text write bypasses the fix by design.
	setTimeout(() => {
		tapTab('Home')
		waitFor(
			() => !!find('probe-input')?.android,
			() => {
				const f = find('probe-input') as any
				const et = f?.android
				if (!et) {
					console.log('[assert] android setText cursor: FAIL (no EditText)')
					return
				}

				f.notify({ eventName: 'textChange', object: f, value: 'abcdef' } as any)
		waitFor(
			() => f.text === 'abcdef',
			() => {
				et.setSelection(1)
				f.notify({ eventName: 'textChange', object: f, value: 'abcXYZ' } as any)
				waitFor(
					() => f.text === 'abcXYZ',
					() => {
						const sel = et.getSelectionStart()

						console.log(
							'[assert] android setText cursor: ' +
								(sel === 1 ? 'OK' : 'FAIL') +
								' (sel was 1 → ' +
								sel +
								', text len 6)',
						)

						f.notify({ eventName: 'textChange', object: f, value: 'typed!' } as any)
					},
				)
			},
		)
		})
	}, 11500)

	// a11y prop mapping (800f0361): Pressable accessibilityLabel →
	// View.contentDescription. Behavioral TalkBack walk isn't scriptable
	// here — this verifies the mapped value lands on the native node.
	setTimeout(() => {
		const b = find('a11y-btn') as any
		const cd = b?.android?.getContentDescription?.()
		const role = b?.accessibilityRole
		console.log(
			'[assert] android contentDescription: ' +
				(String(cd) === 'Increment counter' ? 'OK' : 'FAIL (' + JSON.stringify(cd) + ')') +
				' role=' +
				JSON.stringify(role),
		)
	}, 11400)

	// Status-bar icon sync (436b515/6975aac): Utils.setDarkModeHandler
	// answers getThemeScheme(), so the edge-to-edge reapplication must
	// follow our override — isAppearanceLightStatusBars flips with scheme
	// and must not revert after a root-stack push.
	const statusBarLightIcons = () => {
		const win = Application.android.foregroundActivity?.getWindow?.()
		const wc = (globalThis as any).androidx?.core?.view?.WindowCompat
		const ctrl = win && wc ? wc.getInsetsController(win, win.getDecorView()) : null
		return ctrl ? ctrl.isAppearanceLightStatusBars() : 'no-controller'
	}

	setTimeout(() => {
		// Drive explicitly — self-drive may have already flipped dark.
		setThemePreference('light')
		setTimeout(() => {
			const light = statusBarLightIcons()
			console.log(
				'[assert] statusbar icons light scheme: ' +
					(light === true ? 'OK' : 'FAIL (' + JSON.stringify(light) + ')'),
			)

			setThemePreference('dark')
			setTimeout(() => {
				const dark = statusBarLightIcons()
				console.log(
					'[assert] statusbar icons dark scheme: ' +
						(dark === false ? 'OK' : 'FAIL (' + JSON.stringify(dark) + ')'),
				)

				navigate('detail', { from: 'bar-probe' })
				setTimeout(() => {
					const pushed = statusBarLightIcons()
					console.log(
						'[assert] statusbar icons survive push: ' +
							(pushed === false ? 'OK' : 'FAIL (' + JSON.stringify(pushed) + ')'),
					)

					goBack()
					setTimeout(() => {
						const popped = statusBarLightIcons()
						console.log(
							'[assert] statusbar icons survive pop: ' +
								(popped === false ? 'OK' : 'FAIL (' + JSON.stringify(popped) + ')'),
						)

						setThemePreference('system')
					}, 900)
				}, 1500)
			}, 600)
		}, 400)
	}, 12300)

	// Swap-pane verification (post-a00eef6): select Demos via the

	// Pressable tab, push into the 'demos' named stack, assert the pushed
	// screen renders inside the pane, push a second route for depth, then
	// pop back to the gallery. A second named stack ('extras') exercises
	// the bookkeeping path — no pane renders it on Android.
	setTimeout(() => {
		const t = gestureTarget(tabView(), 'Apps')
		console.log('[probe] android demos tab=' + (t ? t.constructor.name : 'none'))
		fireGesture(t, 1, 'tap', {})
	}, 15500)

	setTimeout(() => {
		waitFor(
			() => collect(tabView()).some((v) => v.id === 'menu-counter'),
			() => {
				console.log(
					'[assert] demos pane mounts gallery: ' +
						(collect(tabView()).some((v) => v.id === 'menu-counter') ? 'OK' : 'FAIL'),
				)

				navigate('demo/:id', { id: 'counter' }, { into: 'demos' })
				// The store→pane re-render flushes asynchronously (emit →

				// useSyncExternalStore → scheduled render) — poll for the
				// pushed text, not just the route bookkeeping.
				waitFor(
					() => paneTexts().includes('Demo count: 0'),
					() => {
						const ok = paneTexts().includes('Demo count: 0')
						console.log(
							'[assert] swap-pane push renders screen: ' +
								(ok ? 'OK' : 'FAIL') +
								(ok ? '' : dump0(paneTexts())),
						)

						// Depth 2 on the same named stack.
						navigate('demo/:id', { id: 'watch' }, { into: 'demos' })
						waitFor(
							() => paneTexts().some((t) => /^\d{2}:\d{2}:\d{2}/.test(t)),

							() => {
								const watchOk = paneTexts().some((t) => /^\d{2}:\d{2}:\d{2}/.test(t))
								console.log(
									'[assert] swap-pane second push renders: ' +
										(watchOk ? 'OK' : 'FAIL') +
										(watchOk ? '' : dump0(paneTexts())),
								)

								// A second named stack — bookkeeping only (no
								// pane renders non-tab stacks on Android).
								navigate('detail', { from: 'extras' }, { into: 'extras' })

								setTimeout(() => {
									const other = routeFor('extras')
									console.log(
										'[assert] second stack bookkeeping: ' +
											(other?.name === 'detail' ? 'OK' : 'FAIL (' + JSON.stringify(other) + ')'),
									)

									popRoute('extras')
									goBack({ into: 'demos' })
									waitFor(
										() =>
											routeFor('demos')?.params?.id === 'counter' &&
											paneTexts().includes('Demo count: 0'),
										() => {
											const backOk = paneTexts().includes('Demo count: 0')
											console.log(
												'[assert] swap-pane pop restores prior: ' + (backOk ? 'OK' : 'FAIL'),
											)

											goBack({ into: 'demos' })
											waitFor(
												() =>
													routeFor('demos') == null &&
													collect(tabView()).some((v) => v.id === 'menu-counter'),

												() => {
													const galOk = collect(tabView()).some((v) => v.id === 'menu-counter')

													console.log(
														'[assert] swap-pane pop restores gallery: ' + (galOk ? 'OK' : 'FAIL'),
													)

													// Icon leaf → SVGView glyphs: push Controls
													// (two <Icon> usages) and count sized svgviews.
													navigate('demo/:id', { id: 'controls' }, { into: 'demos' })
													waitFor(
														() =>
															collect(tabView()).some(
																(v) => v?.constructor?.name === 'SVGView',
															),
														() => {
															const svgs = collect(tabView()).filter(
																(v) => v?.constructor?.name === 'SVGView',
															)

															const sized = svgs.filter((v) => {
																const s = (v as any).getActualSize?.() ?? {}
																return (s.width ?? 0) > 0 && (s.height ?? 0) > 0
															})

															console.log(
																'[assert] icon svgview glyphs: ' +
																	(svgs.length >= 2 && sized.length === svgs.length ? 'OK' : 'FAIL') +
																	` (${svgs.length} svgview, ${sized.length} sized)`,
															)

															goBack({ into: 'demos' })
														},
													)

													// Safe-area read: the Test tab's Services
													// section echoes useSafeAreaInsets — 'insets T/R/B/L'.
													const svc = gestureTarget(tabView(), 'Test')
													fireGesture(svc, 1, 'tap', {})
													setTimeout(() => {
														const m = paneTexts().find((t) => t.startsWith('insets '))

														const top = m ? Number(m.split(' ')[1]?.split('/')[0]) : NaN
														console.log(
															'[assert] safe-area insets nonzero: ' +
																(Number.isFinite(top) && top > 0 ? 'OK' : 'FAIL') +
																' (' +
																JSON.stringify(m ?? paneTexts().slice(0, 12)) +
																')',
														)
													}, 1200)
												},
											)
										},
									)
								}, 900)
							},
						)
					},
					60,
				)
			},
			50,
		)
	}, 16500)
}

// Route-config verification runs after the earlier Android navigation probes.
// beforeLoad stamps the route already committed at invocation time; redirect
// must commit only its destination rather than the intermediate route.
if (Application.android && !VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(() => {
		const frame = getStack('root') as any
		const poll = (condition: () => boolean, done: () => void, tries = 80) => {
			const tick = () => {
				if (condition() || --tries <= 0) {done()}
				else {setTimeout(tick, 100)}
			}

			tick()
		}

		// The earlier status-bar probe also pushes and pops detail. Wait for
		// it to return to the base page before measuring this independent run.
		poll(
			() => routeFor('root') == null,
			() => {
				const startRoute = routeFor('root')?.name ?? 'none'
				navigate('detail', { from: 'android-route-probe' })

				poll(
					() =>
						frame?.currentPage?.id === 'detail-page' &&
						texts(frame.currentPage).includes('guard: android-route-probe'),
					() => {
						const page = frame?.currentPage as any
						const pageTexts = texts(page)
						const route = routeFor('root')
						const depth = frame?.backStack?.length ?? 0
						const beforeLoadOk =
							route?.name === 'detail' && pageTexts.includes('guard saw route: ' + startRoute)

						console.log(
							'[assert] android beforeLoad pre-commit: ' +
								(beforeLoadOk ? 'OK' : 'FAIL') +
								' (' +
								JSON.stringify(pageTexts.slice(0, 10)) +
								')',
						)

						console.log(
							'[assert] android route head actionBar.title: ' +
								(page?.actionBar?.title === 'Detail · Octane Xplat'
									? 'OK'
									: 'FAIL (' + JSON.stringify(page?.actionBar?.title) + ')'),
						)

						console.log(
							'[assert] android route pushed/back state: ' +
								(pageTexts.includes('pushed: true') && pageTexts.includes('can go back: true')
									? 'OK'
									: 'FAIL (' + JSON.stringify({ pageTexts: pageTexts.slice(0, 10), depth }) + ')'),
						)

						const beforeRedirectDepth = depth
						navigate('detail', { from: 'redirect' })
						poll(
							() => routeFor('root')?.params?.from === 'redirect-target',
							() => {
								const redirected = routeFor('root')
								const redirectedDepth = frame?.backStack?.length ?? 0
								const redirectPage = frame?.currentPage as any
								const redirectTexts = texts(redirectPage)
								const redirectOk =
									redirected?.name === 'detail' &&
									redirectedDepth === beforeRedirectDepth + 1 &&
									redirectTexts.includes('guard: redirect-target')

								console.log(
									'[assert] android redirect skips intermediate push: ' +
										(redirectOk ? 'OK' : 'FAIL') +
										' (' +
										JSON.stringify({
											route: redirected,
											beforeRedirectDepth,
											redirectedDepth,
											redirectTexts: redirectTexts.slice(0, 8),
										}) +
										')',
								)

								navigate('demo/:id', { id: 'scrollbox' })
								poll(
									() => frame?.currentPage?.id === 'demo/:id-page',
									() => {
										const page = frame?.currentPage as any
										const scrollBox = page?.getViewById?.('scrollbox-demo')
										const list = page?.getViewById?.('scrollbox-demo-list')
										const pageTexts = texts(page)
										const inlineOk = !!scrollBox && !!list && pageTexts.includes('ScrollBox row 1')
										console.log(
											'[assert] Android ScrollBox inline list: ' +
												(inlineOk ? 'OK' : 'FAIL') +
												' (' +
												JSON.stringify({
													scrollBox: !!scrollBox,
													list: !!list,
													firstRow: pageTexts.find((text) => text.startsWith('ScrollBox row ')),
												}) +
												')',
										)

										goBack()
										setTimeout(() => {
											let finished = false
											const originalWarn = console.warn
											console.warn = (...args: any[]) => {
												const message = args.map(String).join(' ')
												if (
													message.includes(
														'[RecyclerView] cannot be nested inside native ScrollView.',
													)
												) {
													finished = true
													console.warn = originalWarn
													console.log(
														'[assert] Android nested RecyclerView named error: OK (' +
															message +
															')',
													)

													setTimeout(() => {
														goBack()
														setTimeout(() => {
															navigate('demo/:id', { id: 'rich-text' })
															poll(
																() => frame?.currentPage?.id === 'demo/:id-page',
																() => {
																	const page = frame?.currentPage as any
																	const label = page?.getViewById?.('rich-text-sample') as any
																	const spans = label?.formattedText?.spans ?? []
																	const links = spans.filter(
																		(span: any) =>
																			span.text === '@octane' || span.text === 'the docs',
																	)

																	const styleOk =
																		links.length === 2 &&
																		links.every(
																			(span: any) =>
																				span.style?.fontWeight === 'bold' &&
																				span.style?.textDecoration === 'underline' &&
																				span.style?.color != null,
																		)

																	console.log(
																		'[assert] Android RichText styled spans: ' +
																			(spans.length === 5 && styleOk ? 'OK' : 'FAIL') +
																			' (count=' +
																			spans.length +
																			' links=' +
																			links.length +
																			')',
																	)

																	const nativeText = label?.android?.getText?.()
																	const nativeLinks =
																		nativeText?.getSpans(
																			0,
																			nativeText.length(),
																			android.text.style.ClickableSpan.class,
																		) ?? []

																	nativeLinks[0]?.onClick(label.android)
																	nativeLinks[1]?.onClick(label.android)
																	setTimeout(() => {
																		const status = page?.getViewById?.('rich-text-status')?.text
																		console.log(
																			'[assert] Android RichText per-span taps: ' +
																				(nativeLinks.length === 2 &&
																				status === 'Last tapped: the docs'
																					? 'OK'
																					: 'FAIL (' +
																						JSON.stringify({
																							nativeLinks: nativeLinks.length,
																							status,
																						}) +
																						')'),
																		)
																	}, 500)
																},
															)
														}, 500)
													}, 400)
												} else {
													originalWarn.apply(console, args)
												}
											}

											navigate('list-nested-probe' as any, {})
											setTimeout(() => {
												if (!finished) {
													console.warn = originalWarn
													console.log(
														'[assert] Android nested RecyclerView named error: FAIL (warning not observed)',
													)

													goBack()
												}
											}, 3000)
										}, 600)
									},
								)
							},
						)
					},
				)
			},
			160,
		)
	}, 40000)
}

// iOS side of lifecycle-appearance-model: the theme leaf writes
// rootView.statusBarStyle ('light' icons under dark scheme) on scheme
// change + 'displayed'. Self-drive flips dark at ~4s; read it after.
if (!VIRTUAL_LIST_BENCH_MODE && Application.ios) {
	setTimeout(() => {
		const style = (Application.getRootView() as any)?.statusBarStyle
		console.log(
			'[assert] ios statusBarStyle under dark scheme: ' +
				(style === 'light' ? 'OK' : 'INFO (' + JSON.stringify(style) + ')'),
		)
	}, 11000)
}

// media.capturePhoto end-to-end: presents the OS camera UI when the device
// has a camera (physical Android) — a driver cancels via back — and returns
// null quickly where capture is unsupported (iOS Simulator). Runs after the
// parity report on Android because opening Camera backgrounds the harness.
	if (!VIRTUAL_LIST_BENCH_MODE) {
		import('@octane-xplat/media').then(({ media }) => {
			setTimeout(async () => {
				const paritySweepComplete = (globalThis as any).__xplatParitySweepComplete
				if (Application.android && paritySweepComplete) {
					console.log('[probe] capturePhoto waits for parity report')
					await paritySweepComplete
				}

				// Report the permission gate result so a null return is attributable —
				// 'denied'/'unsupported' vs an actual camera cancel look identical from
				// the PickedImage contract alone.
				try {
					const perm = await media.ensure('camera').catch((e: Error) => 'threw ' + (e as Error).message)
					console.log('[probe] capturePhoto ensure(camera)=' + JSON.stringify(perm))
				} catch (e) {
					console.log('[probe] capturePhoto ensure threw: ' + (e as Error).message)
				}

				try {
					const p = await media.capturePhoto()
					console.log(
						'[assert] capturePhoto: ' + (p ? 'OK (' + p.name + ')' : 'INFO (null — cancelled or unsupported)'),
					)
				} catch (e) {
					console.log('[assert] capturePhoto: FAIL ' + (e as Error).message)
				}
			}, 80000)
		})
	}

function dump0(hay: string[]): string {
	return ' texts=' + JSON.stringify(hay.slice(0, 12))
}
}

// A module-graph reload re-evaluates this entry and mounts fresh roots.
import.meta.hot?.dispose(() => {
	for (const root of roots) {
		root.unmount()
	}

	roots.clear()
})
