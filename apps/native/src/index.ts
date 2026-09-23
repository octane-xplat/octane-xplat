import { Application, Frame, Page, Trace } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from '@xplat/app';
import { getColorScheme } from '@xplat/ui';
import { storage } from '@xplat/app';
import './app.css';

// Trace the nav pipeline end-to-end: NAVIGATE → pushViewController → DID_show.
Trace.enable();
Trace.setCategories(
  Trace.categories.Navigation + ',' + Trace.categories.NativeLifecycle
);

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>();

console.log('[harness] entry evaluated, App=' + typeof App);

let thePage: Page | null = null;

// Root is a Frame (not a bare Page) so Frame.navigate can push Pages —
// the seam behind shared `openDetail`/`goBack` (Exp 9). navigate() before
// the frame attaches is queued by NS core.
function createWindowContent(): Frame {
  const frame = new Frame();
  const page = new Page();
  page.actionBarHidden = true;
  console.log('[harness] createWindowContent');
  try {
    roots.add(renderNativeScriptApp(page, App));
    thePage = page;
    console.log('[harness] root mounted');
  } catch (e) {
    console.log('[harness] render threw: ' + ((e as Error)?.stack || e));
  }
  frame.navigate({ create: () => page });
  return frame;
}

Application.run({
  create: () => createWindowContent(),
});

// NS gesture events (tap/pan/swipe/longPress) don't live on the plain event
// list — view.on('tap') routes to GesturesObserver, so notify() can't reach
// them. Invoke the observer's callback directly; that still exercises the
// driver's handler → root.dispatchEvent path. GestureTypes: tap=1 pan=8
// swipe=16 longPress=64.
function fireGesture(view: any, type: number, name: string, args: any) {
  const observers = view?.getGestureObservers?.(type) ?? [];
  console.log('[probe] gesture ' + name + ' observers=' + observers.length);
  for (const o of observers) {
    o.callback.call(o.context, { eventName: name, object: view, ...args });
  }
}

// --- content assertions (the empty-Cell lesson: lifecycle ≠ content) ---
function assertEq(name: string, actual: any, expected: any) {
  const ok = actual === expected;
  console.log('[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (got ' + JSON.stringify(actual) + ')');
}
function assertHas(name: string, haystack: any[], needle: any) {
  console.log('[assert] ' + name + ': ' + (haystack.includes(needle) ? 'OK' : 'FAIL') + ' (' + JSON.stringify(needle) + ' in ' + JSON.stringify(haystack.slice(0, 8)) + ')');
}
function collect(view: any, out: any[] = []): any[] {
  if (!view) return out;
  out.push(view);
  view.eachChildView?.((c: any) => { collect(c, out); return true; });
  return out;
}
function texts(root: any): string[] {
  return collect(root).filter((v) => typeof v?.text === 'string' && v.text.length > 0).map((v) => v.text);
}
const find = (id: string) => thePage?.getViewById?.(id) as any;

// Controlled-input probe: fire textChange natively at +1.5s (between the
// self-test's shuffle and setText) to exercise the native→state direction
// without real keyboard input.
setTimeout(() => {
  const v = find('probe-input');
  console.log('[probe] textfield=' + (v ? v.constructor.name : 'none'));
  v?.notify({ eventName: 'textChange', object: v, value: 'typed!' } as any);
}, 1500);

// A11y + content readback.
setTimeout(() => {
  const b = find('a11y-btn');
  console.log('[probe] a11y accessible=' + b?.accessible + ' label=' + b?.accessibilityLabel + ' role=' + b?.accessibilityRole);
  assertEq('textfield.text', find('probe-input')?.text, 'typed!');
}, 1600);

// Gesture probe (Exp 10): synthesize pan + swipe on the pan-box.
setTimeout(() => {
  const v = find('pan-box');
  console.log('[probe] panbox=' + (v ? v.constructor.name : 'none'));
  fireGesture(v, 8, 'pan', { deltaX: 12, deltaY: -4, state: 2 });
  fireGesture(v, 16, 'swipe', { direction: 1 });
}, 1700);

// Tab probe (Exp 11): selectedIndexChanged is a real property event, so
// notify() reaches it — switches to Settings, mounts its panes.
setTimeout(() => {
  const tv = find('app-tabs');
  console.log('[probe] tabview=' + (tv ? tv.constructor.name : 'none'));
  tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 1 } as any);
}, 1900);
setTimeout(() => {
  assertHas('settings texts', texts(thePage), 'Notifications');
}, 2100);

// Switch probe: checkedChange → state → driver writes `checked` — the patch
// suppresses the write-back echo (each onCheckedChange should fire once).
setTimeout(() => {
  const sw = find('sw-notifications');
  console.log('[probe] switch=' + (sw ? sw.constructor.name : 'none'));
  sw?.notify({ eventName: 'checkedChange', object: sw, value: false } as any);
}, 2300);
setTimeout(() => {
  assertEq('switch.checked', find('sw-notifications')?.checked, false);
}, 2500);

// Back to Home — assert list cells actually render item text (post-shuffle
// order is e,d,c,b,a → labels Epsilon..Alpha).
setTimeout(() => {
  const tv = find('app-tabs');
  tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 0 } as any);
}, 2600);
setTimeout(() => {
  assertHas('cell text', texts(thePage), 'Epsilon');
}, 2900);

// Dark-mode commit: some view in the tree carries the class. Timers drift
// under probe load — assert well after the +3.0s dark toggle.
setTimeout(() => {
  const hasDark = collect(thePage).some((v) => String(v?.className ?? '').split(/\s+/).includes('ns-dark'));
  console.log('[assert] dark class: ' + (hasDark ? 'OK' : 'FAIL'));
  const cs = getColorScheme();
  console.log('[assert] color scheme: ' + (/^(light|dark)$/.test(cs) ? 'OK' : 'FAIL') + ' (' + cs + ')');
  // Storage seam (Exp 15): ApplicationSettings write/read round-trip.
  storage.setString('probe-key', 'roundtrip');
  console.log('[assert] storage roundtrip: ' + (storage.getString('probe-key') === 'roundtrip' ? 'OK' : 'FAIL'));
  console.log('[assert] draft persisted: ' + (storage.getString('draft') === 'typed!' ? 'OK' : 'FAIL') + ' (' + storage.getString('draft') + ')');
  // styled() probe (Exp 16): variant prop composes bg-danger into className.
  const db = find('danger-btn');
  const cls = String(db?.className ?? '');
  console.log('[assert] styled variant: ' + (cls.includes('bg-danger') && cls.includes('extra') ? 'OK' : 'FAIL') + ' (' + cls + ')');
}, 4900);

// Navigation probe (Exp 9) — event-driven: a pushed Page commits only when
// the nav transition finishes (setCurrent on viewDidAppear). Fixed timers
// race it; `navigatedTo` on the Frame is the real completion signal.
setTimeout(() => {
  const f = Frame.topmost() as any;
  let pops = 0;
  f?.on?.('navigatedTo', (e: any) => {
    const top = f.currentPage;
    if (top?.id === 'detail-page') {
      assertHas('detail texts', texts(top), 'Detail screen');
      assertEq('backStack after push', f.backStack.length, 1);
      setTimeout(() => f.goBack(), 250);
    } else if (top === thePage && ++pops === 1) {
      console.log('[assert] pop to main: OK');
    }
  });
  const d = find('detail-btn');
  console.log('[probe] detail-btn=' + (d ? d.constructor.name : 'none'));
  fireGesture(d, 1, 'tap', {});
}, 3500);

// ScrollView + Image probes: imperative scrollTo + offset readback; the
// data: URI decodes synchronously → imageSource present.
setTimeout(() => {
  const sv = find('scroll-box');
  console.log('[probe] scrollview=' + (sv ? sv.constructor.name : 'none'));
  sv?.scrollToVerticalOffset?.(200, false);
  console.log('[assert] scroll offset: ' + (sv?.verticalOffset > 0 ? 'OK' : 'FAIL') + ' (' + sv?.verticalOffset + ')');
  const img = find('img');
  console.log('[assert] image decoded: ' + (img?.imageSource ? 'OK' : 'FAIL'));
}, 5000);

// List @empty probe: clear → 'No items' → restore → 'Alpha'.
setTimeout(() => {
  fireGesture(find('clear-btn'), 1, 'tap', {});
}, 5300);
setTimeout(() => {
  assertHas('empty text', texts(thePage), 'No items');
  fireGesture(find('clear-btn'), 1, 'tap', {});
}, 5700);
setTimeout(() => {
  assertHas('cell text after restore', texts(thePage), 'Alpha');
}, 6100);

// Overlay probe: tap → RootLayout.open host mounts → content assert.
setTimeout(() => {
  const o = find('overlay-btn');
  console.log('[probe] overlay-btn=' + (o ? o.constructor.name : 'none'));
  fireGesture(o, 1, 'tap', {});
}, 6400);
setTimeout(() => {
  const overlay = find('overlay-host');
  assertHas('overlay texts', texts(overlay), 'Overlay content');
}, 6800);

// Sheet probe (Exp 11): back to tab 1, then synthesized tap on sheet-btn.
setTimeout(() => {
  const tv = find('app-tabs');
  tv?.notify({ eventName: 'selectedIndexChanged', object: tv, value: 1 } as any);
}, 7100);
setTimeout(() => {
  const b = find('sheet-btn');
  console.log('[probe] sheet-btn=' + (b ? b.constructor.name : 'none'));
  fireGesture(b, 1, 'tap', {});
}, 7400);
setTimeout(() => {
  const sheet = find('sheet-host');
  assertHas('sheet texts', texts(sheet), 'Sheet content');
}, 7800);

// Modal probe (Exp 12): declarative open → showModal on a second root.
// The modal isn't under thePage — read it via presenter.modal.
setTimeout(() => {
  fireGesture(find('modal-btn'), 1, 'tap', {});
}, 8000);
setTimeout(() => {
  const f = Frame.topmost() as any;
  const m = f?.currentPage?.modal;
  console.log('[probe] modal=' + (m ? m.constructor.name : 'none'));
  assertHas('modal texts', texts(m), 'Modal content');
  const close = m?.getViewById?.('modal-close');
  fireGesture(close, 1, 'tap', {});
}, 8600);
setTimeout(() => {
  const f = Frame.topmost() as any;
  console.log('[assert] modal closed: ' + (f?.currentPage?.modal == null ? 'OK' : 'FAIL'));
}, 9200);

// Animation probe (Exp 13): imperative to() writes translateX per frame;
// spring() integrates back to 0. No re-render involved.
setTimeout(() => {
  fireGesture(find('anim-btn'), 1, 'tap', {});
}, 9400);
setTimeout(() => {
  const v = find('anim-box');
  console.log('[assert] anim moved: ' + (v?.translateX > 10 ? 'OK' : 'FAIL') + ' (' + v?.translateX + ')');
}, 9750);
setTimeout(() => {
  const v = find('anim-box');
  console.log('[assert] anim settled: ' + (Math.abs(v?.translateX ?? -1) < 5 ? 'OK' : 'FAIL') + ' (' + v?.translateX + ')');
}, 10600);

// A module-graph reload re-evaluates this entry and mounts fresh roots.
// @ts-expect-error — vite hot types; add vite/client to tsconfig types if desired
import.meta.hot?.dispose(() => {
  for (const root of roots) root.unmount();
  roots.clear();
});
