import { Application, Frame, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from '@xplat/app';
import './app.css';

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

// Controlled-input probe: fire textChange natively at +1.5s (between the
// self-test's shuffle and setText) to exercise the native→state direction
// without real keyboard input.
setTimeout(() => {
  const v = thePage?.getViewById?.('probe-input');
  console.log('[probe] textfield=' + (v ? v.constructor.name : 'none'));
  v?.notify({ eventName: 'textChange', object: v, value: 'typed!' } as any);
}, 1500);

// A11y readback: confirm the shared a11y props landed on the native view.
setTimeout(() => {
  const b = thePage?.getViewById?.('a11y-btn') as any;
  console.log('[probe] a11y accessible=' + b?.accessible + ' label=' + b?.accessibilityLabel + ' role=' + b?.accessibilityRole);
}, 1600);

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

// Gesture probe (Exp 10): synthesize pan + swipe on the pan-box.
setTimeout(() => {
  const v = thePage?.getViewById?.('pan-box') as any;
  console.log('[probe] panbox=' + (v ? v.constructor.name : 'none'));
  fireGesture(v, 8, 'pan', { deltaX: 12, deltaY: -4, state: 2 });
  fireGesture(v, 16, 'swipe', { direction: 1 });
}, 1700);

// Navigation + overlay probes (Exp 9): synthesized taps exercise the full
// Pressable → shared handler → platform-module path.
setTimeout(() => {
  const d = thePage?.getViewById?.('detail-btn') as any;
  console.log('[probe] detail-btn=' + (d ? d.constructor.name : 'none'));
  fireGesture(d, 1, 'tap', {});
}, 3500);
setTimeout(() => {
  const o = thePage?.getViewById?.('overlay-btn') as any;
  console.log('[probe] overlay-btn=' + (o ? o.constructor.name : 'none'));
  fireGesture(o, 1, 'tap', {});
}, 3600);

// Readback: confirm the Frame actually pushed the Detail page (not just that
// navigate() was called), then pop back.
setTimeout(() => {
  const f = Frame.topmost();
  const top = f?.currentPage;
  console.log('[probe] frame backStack=' + (f?.backStack?.length ?? 'n/a') +
    ' currentPage=' + (top ? top.constructor.name : 'none') +
    ' hasDetailRoot=' + (top?.content != null));
  f?.goBack();
}, 3700);

// A module-graph reload re-evaluates this entry and mounts fresh roots.
// @ts-expect-error — vite hot types; add vite/client to tsconfig types if desired
import.meta.hot?.dispose(() => {
  for (const root of roots) root.unmount();
  roots.clear();
});
