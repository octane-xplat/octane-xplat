import { Application, Frame, ListView, getRootLayout } from '@nativescript/core'
import { currentModalRoute, getStack, popRoute, routeFor } from '@octane-xplat/ui'
import { goBack } from './nav'

// Nested stacks don't work on Android yet — a TabViewItem-hosted Frame
// accepts pushes (fragment transaction commits) but setCurrent/bookkeeping
// never runs, and a push raced against attach crashes the FragmentManager
// (upstream issue NativeScript#11444). Skip the whole sweep there; the
// base probes still run.
const SKIP = Application.android != null
if (SKIP) console.log('[sweep] nested stacks skipped on android — upstream #11444')

// Demo-catalog sweep probe (native only — web twin is a no-op). Lives outside
// apps/native/src/index.ts so the harness probe timeline stays untouched.
// The catalog is a parallel stack: the Demos tab hosts its own Frame, so
// pushes/pop happen inside the tab and never move Frame.topmost() — all
// reads scope to getStack('demos').currentPage.
// NS gestures aren't events, so tap synthesis invokes the view's
// gesture-observer callback directly.
function fireTap(view: any) {
	const observers = view?.getGestureObservers?.(1) ?? []
	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'tap', object: view })
	}

	return observers.length
}

function collect(view: any, out: any[] = []): any[] {
	if (!view) return out
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

const demosPage = () => getStack('demos')?.currentPage

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
	if (!view) return null
	const nextPath = [...path, view]
	if (view.text === text) {
		return (
			[...nextPath].reverse().find((v) => (v?.getGestureObservers?.(1)?.length ?? 0) > 0) ?? null
		)
	}

	let found: any = null
	view.eachChildView?.((child: any) => {
		found = tapTargetForText(child, text, nextPath)
		return !found
	})

	return found
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

			if (ok) popRoute('root')
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
			console.log(
				'[assert] +modal route opens showModal root: ' + (ok ? 'OK' : 'FAIL'),
			)

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
					'[assert] modal route dismissed by popRoute: ' +
						(currentModalRoute() ? 'FAIL' : 'OK'),
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
const findOnRoot = (id: string) => getRootLayout()?.getViewById?.(id)

interface Step {
	id: string
	/** ms to hold the pushed page before goBack. Default 900. */
	hold?: number
	checks: { at: number; run: () => void }[]
}

const STEPS: Step[] = [
	{
		id: 'counter',
		hold: 1900,
		checks: [
			{ at: 350, run: () => assertHas('demo counter', 'Demo count: 0') },
			{ at: 400, run: () => assertHas('if else mount', 'arm-B') },
			{ at: 550, run: () => fireTap(find('if-toggle')) },
			{ at: 800, run: () => assertHas('if then swap', 'arm-A') },
			// Same component, third root: open this demo inside the sheet.
			{ at: 900, run: () => fireTap(find('demo-sheet')) },
			{
				at: 1400,
				run: () => {
					const host = findOnRoot('sheet-host')
					const ok = collect(host).some(
						(v) => typeof v?.text === 'string' && v.text.includes('Demo count'),
					)

					console.log(
						'[assert] sheet hosts demo: ' +
							(ok ? 'OK' : 'FAIL') +
							' — same component in sheet root',
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
			// reverse/append rebinds. 'Encore' before 'Water station' proves
			// the keyFor-stable rebind applied the reversal; 'Added event'
			// proves onEndReached appended.
			{
				at: 1800,
				run: () => {
					const hay = viewTexts(demosPage())
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
			{ at: 400, run: () => assertHas('demo layout', 'Grid A') },
			{ at: 400, run: () => assertHas('layout grid span', 'Spans two columns') },
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
			{ at: 450, run: () => assertHas('layout stack z-order', 'Later child is on top') },
			{ at: 450, run: () => assertHas('layout spacer footer', 'Footer') },
		],
	},
	{
		id: 'overlay',
		hold: 2600,
		checks: [
			// Overlay content mounts on the RootLayout — a sibling of the page.
			{ at: 400, run: () => fireTap(tapTargetForText(demosPage(), 'Toggle anchored popover')) },
			{
				at: 900,
				run: () => {
					const ok = viewTexts(getRootLayout()).includes('Anchored to the button')
					console.log('[assert] popover anchored: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{ at: 1100, run: () => fireTap(tapTargetForText(demosPage(), 'Show toast')) },
			{
				at: 1500,
				run: () => {
					const ok = viewTexts(getRootLayout()).includes('A toast from the demo')
					console.log('[assert] toast shows: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{ at: 1700, run: () => fireTap(tapTargetForText(demosPage(), 'Open shade overlay')) },
			{
				at: 2200,
				run: () => {
					const ok = viewTexts(getRootLayout()).includes('Overlay is open')
					console.log('[assert] overlay opens: ' + (ok ? 'OK' : 'FAIL'))
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
			{ at: 400, run: () => assertMatch('safe area insets', /Insets — top \d/) },
			{ at: 400, run: () => assertHas('drawer main', 'Drawer main content') },
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
					if (ok) fireTap(tapTargetForText(m, 'Close modal'))
				},
			},
			{ at: 1600, run: () => fireTap(tapTargetForText(demosPage(), 'Open imperative picker')) },
			{
				at: 2200,
				run: () => {
					const m = demosPage()?.modal ?? Frame.topmost()?.currentPage?.modal
					const ok = m && viewTexts(m).includes('Choose a color')
					console.log('[assert] imperative modal: ' + (ok ? 'OK' : 'FAIL'))
					if (ok) fireTap(tapTargetForText(m, 'Red'))
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
						if (!v) return null
						const s = v.getActualSize?.() ?? {}
						const p = v.getLocationOnScreen?.() ?? {}
						return { w: Math.round(s.width ?? -1), h: Math.round(s.height ?? -1), x: Math.round(p.x ?? -1), y: Math.round(p.y ?? -1) }
					}

					for (const id of ['dv-grow', 'dv-grow-fill', 'dv-lh', 'dv-lh2', 'dv-auto', 'dv-wide', 'dv-sib']) {
						const r = m(id)
						console.log(
							'[probe] ' + id + ' ' + (r ? `${r.w}x${r.h}@${r.x},${r.y}` : 'MISSING'),
						)
					}

					const grow = m('dv-grow-fill')
					console.log(
						'[assert] grow child keeps height: ' +
							(grow && grow.h >= 40 ? 'OK' : 'FAIL') +
							(grow ? ` (${grow.h})` : ''),
					)

					const sib = m('dv-sib')
					const wide = m('dv-wide')
					console.log(
						'[assert] fixed sibling survives grow: ' +
							(sib && sib.w >= 88 && wide && sib.x > wide.x ? 'OK' : 'FAIL') +
							(sib ? ` (${sib.w}@${sib.x})` : ''),
					)

					const auto = m('dv-auto')
					console.log(
						'[assert] margin-left:auto pushes trail right: ' +
							(auto && auto.x > 200 ? 'OK' : 'FAIL') +
							(auto ? ` (x=${auto.x})` : ''),
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
]

/** Poll until `cond` or give up (~2s), then continue. Nested-frame push/pop
 *  transitions update frame.currentPage asynchronously — fixed offsets
 *  race them. */
function waitFor(cond: () => boolean, then: () => void, tries = 20) {
	const tick = () => {
		if (cond() || --tries <= 0) then()
		else setTimeout(tick, 100)
	}

	tick()
}

let galleryPage: any = null

if (!SKIP)
	setTimeout(() => {
		// Frame.topmost() is unreliable once nested stacks exist — on Android it
		// returns the innermost frame. The boot registers the app frame as 'root'.
		const tv = getStack('root')?.currentPage?.getViewById?.('app-tabs')
		console.log('[sweep] switching to Demos tab, tabview=' + (tv ? tv.constructor.name : 'none'))
		tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 2 } as any)
	}, 9600)

// Poll for the frame's default page AND its first chip's views — pane
// attach + first-navigation + native-attach latency can run seconds
// past the CORE trace; pushing while appearance is still settling
// stalls bookkeeping (setCurrent) and leaves chips without observers.
if (!SKIP)
	setTimeout(() => {
		waitFor(
			() => demosPage() != null && find('menu-counter') != null,
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

function runStep(i: number) {
	if (i >= STEPS.length) return
	const step = STEPS[i]
	const chip = find('menu-' + step.id)
	console.log('[sweep] menu-' + step.id + ' tap observers=' + fireTap(chip))
	waitFor(
		() => demosPage() !== galleryPage,
		() => {
			for (const c of step.checks) setTimeout(c.run, c.at)
			setTimeout(() => {
				console.log('[sweep] goBack ' + step.id)
				goBack({ into: 'demos' })
				waitFor(
					() => demosPage() === galleryPage,
					() => {
						assertHas('lastDemo ' + step.id, 'Last opened: ' + step.id)
						setTimeout(() => runStep(i + 1), 150)
					},
				)
			}, step.hold ?? 900)
		},
	)
}
