import { Frame } from '@nativescript/core';

// Demo-gallery sweep probe (native only — web twin is a no-op). Lives outside
// apps/native/src/index.ts so the harness probe timeline stays untouched.
// Same technique as the entry probes: NS gestures aren't events, so tap
// synthesis invokes the view's gesture-observer callback directly.
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

function pageTexts(): string[] {
	const page = Frame.topmost()?.currentPage;
	return collect(page).filter((v) => typeof v?.text === 'string' && v.text.length > 0).map((v) => v.text);
}

function dump(hay: string[]): string {
	return ' texts=' + JSON.stringify(hay.slice(-14));
}

function assertHas(name: string, needle: string) {
	const hay = pageTexts();
	const ok = hay.includes(needle);
	console.log('[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + JSON.stringify(needle) + ')' + (ok ? '' : dump(hay)));
}

function assertMatch(name: string, re: RegExp) {
	const hay = pageTexts();
	const ok = hay.some((t) => re.test(t));
	console.log('[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + re + ')' + (ok ? '' : dump(hay)));
}

const find = (id: string) => Frame.topmost()?.currentPage?.getViewById?.(id);

// Schedule: entry probes run to ~5.2s; the sweep starts at 6s. Each step taps
// a menu chip, then the following step asserts the new demo's content.
const STEPS: { id: string; checks: { at: number; run: () => void }[] }[] = [
	{ id: 'counter', checks: [{ at: 900, run: () => assertHas('demo counter', 'Demo count: 0') }] },
	{ id: 'watch', checks: [{ at: 900, run: () => assertMatch('demo watch', /\d{2}:\d{2}:\d{2}/) }] },
	{ id: 'stopwatch', checks: [{ at: 900, run: () => assertHas('demo stopwatch', '0:00.0') }] },
	{ id: 'todo', checks: [{ at: 900, run: () => assertHas('demo todo', 'Nothing yet — add one.') }] },
	{ id: 'ttt', checks: [{ at: 900, run: () => assertHas('demo ttt', 'X to play') }] },
	{ id: 'dialer', checks: [{ at: 900, run: () => assertHas('demo dialer', 'Enter number') }] },
	{ id: 'vlist', checks: [{ at: 900, run: () => assertHas('demo vlist', '500 rows') }] },
	// Fake fetch resolves ~600ms post-mount: 'Loading…' before it, '°' after —
	// both while still on this demo (next chip taps at +1400).
	{
		id: 'weather',
		checks: [
			{ at: 350, run: () => assertHas('demo weather loading', 'Loading…') },
			{ at: 1250, run: () => assertMatch('demo weather data', /°/) },
		],
	},
	{ id: 'anim', checks: [{ at: 900, run: () => assertHas('demo anim', 'active: none') }] },
	{ id: 'probe', checks: [{ at: 900, run: () => assertHas('demo probe', 'Bump A') }] },
];

setTimeout(() => {
	const tv = find('app-tabs');
	console.log('[sweep] switching to Demos tab, tabview=' + (tv ? tv.constructor.name : 'none'));
	tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 2 } as any);
}, 6000);

STEPS.forEach((step, i) => {
	const t0 = 7000 + i * 1400;
	setTimeout(() => {
		const chip = find('menu-' + step.id);
		console.log('[sweep] menu-' + step.id + ' tap observers=' + fireTap(chip));
	}, t0);
	for (const c of step.checks) setTimeout(c.run, t0 + c.at);
});
