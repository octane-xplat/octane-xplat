import { Frame, getRootLayout } from '@nativescript/core';
import { getStack } from '@xplat/ui';
import { goBack } from './nav';

// Demo-catalog sweep probe (native only — web twin is a no-op). Lives outside
// apps/native/src/index.ts so the harness probe timeline stays untouched.
// The catalog is a parallel stack: the Demos tab hosts its own Frame, so
// pushes/pop happen inside the tab and never move Frame.topmost() — all
// reads scope to getStack('demos').currentPage.
// NS gestures aren't events, so tap synthesis invokes the view's
// gesture-observer callback directly.
function fireTap(view: any) {
	const observers = view?.getGestureObservers?.(1) ?? [];
	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'tap', object: view });
	}
	return observers.length;
}

function collect(view: any, out: any[] = []): any[] {
	if (!view) return out;
	out.push(view);
	view.eachChildView?.((c: any) => { collect(c, out); return true; });
	return out;
}

function viewTexts(view: any): string[] {
	return collect(view).filter((v) => typeof v?.text === 'string' && v.text.length > 0).map((v) => v.text);
}

function dump(hay: string[]): string {
	return ' texts=' + JSON.stringify(hay.slice(-14));
}

const demosPage = () => getStack('demos')?.currentPage;

function assertHas(name: string, needle: string, view: any = demosPage()) {
	const hay = viewTexts(view);
	const ok = hay.includes(needle);
	console.log('[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + JSON.stringify(needle) + ')' + (ok ? '' : dump(hay)));
}

function assertMatch(name: string, re: RegExp, view: any = demosPage()) {
	const hay = viewTexts(view);
	const ok = hay.some((t) => re.test(t));
	console.log('[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + re + ')' + (ok ? '' : dump(hay)));
}

// Chips live on the demos stack's current page; the sheet host sits on the
// app's RootLayout, a sibling of every page — read it from there.
const find = (id: string) => demosPage()?.getViewById?.(id);
const findOnRoot = (id: string) => getRootLayout()?.getViewById?.(id);

interface Step {
	id: string;
	/** ms to hold the pushed page before goBack. Default 900. */
	hold?: number;
	checks: { at: number; run: () => void }[];
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
					const host = findOnRoot('sheet-host');
					const ok = collect(host).some((v) => typeof v?.text === 'string' && v.text.includes('Demo count'));
					console.log('[assert] sheet hosts demo: ' + (ok ? 'OK' : 'FAIL') + ' — same component in sheet root');
				},
			},
		],
	},
	{ id: 'watch', checks: [{ at: 800, run: () => assertMatch('demo watch', /\d{2}:\d{2}:\d{2}/) }] },
	{ id: 'stopwatch', checks: [{ at: 800, run: () => assertHas('demo stopwatch', '0:00.0') }] },
	{ id: 'todo', checks: [{ at: 800, run: () => assertHas('demo todo', 'Nothing yet — add one.') }] },
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
];

/** Poll until `cond` or give up (~2s), then continue. Nested-frame push/pop
 *  transitions update frame.currentPage asynchronously — fixed offsets
 *  race them. */
function waitFor(cond: () => boolean, then: () => void, tries = 20) {
	const tick = () => {
		if (cond() || --tries <= 0) then();
		else setTimeout(tick, 100);
	};
	tick();
}

let galleryPage: any = null;

setTimeout(() => {
	const tv = Frame.topmost()?.currentPage?.getViewById?.('app-tabs');
	console.log('[sweep] switching to Demos tab, tabview=' + (tv ? tv.constructor.name : 'none'));
	tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 2 } as any);
}, 9600);

setTimeout(() => {
	galleryPage = demosPage();
	console.log('[sweep] demos stack=' + (getStack('demos') ? 'registered' : 'MISSING') + ' gallery=' + (galleryPage ? galleryPage.constructor.name : 'none'));
	runStep(0);
}, 10300);

function runStep(i: number) {
	if (i >= STEPS.length) return;
	const step = STEPS[i];
	const chip = find('menu-' + step.id);
	console.log('[sweep] menu-' + step.id + ' tap observers=' + fireTap(chip));
	waitFor(() => demosPage() !== galleryPage, () => {
		for (const c of step.checks) setTimeout(c.run, c.at);
		setTimeout(() => {
			console.log('[sweep] goBack ' + step.id);
			goBack({ into: 'demos' });
			waitFor(() => demosPage() === galleryPage, () => {
				assertHas('lastDemo ' + step.id, 'Last opened: ' + step.id);
				setTimeout(() => runStep(i + 1), 150);
			});
		}, step.hold ?? 900);
	});
}
