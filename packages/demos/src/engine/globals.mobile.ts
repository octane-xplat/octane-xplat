// Native global seeds. `navigator` + `Intl` are ALSO seeded at the top of
// vendor.mjs by the docs-demos-vendor-seed vite plugin, because pixi's
// module-init (isSafari, CanvasTextMetrics' `Intl?.Segmenter` probe) runs
// during the flat vendor-chunk eval — before any app module. Everything
// here only has to exist by the time the demo's runtime code executes:
//
// - `navigator`: pixi isMobile/isSafari probes read it at runtime too.
// - `ImageBitmap`: @nativescript/canvas ships an ImageBitmap class whose
//   createFrom() decodes PNG/JPEG bytes, but it is not installed as a
//   global. PlayCanvas's texture path checks `source instanceof
//   ImageBitmap` and Pixi's ImageSource.test does too.
// - `Intl`: seeded for completeness; the vendor seed is what pixi sees.
// - `document`: a permissive stub. pixi's Application.init wires DOM
//   listeners through `globalThis.document.addEventListener`
//   (EventSystem — separately no-opped — and related systems), and
//   accessibility/render-target paths read document.body/createElement.
//   None of that has meaning on a NativeScript canvas; the stub answers
//   "no listeners, no DOM" without throwing.
import { ImageBitmap } from '@nativescript/canvas'

const globals = globalThis as {
  navigator?: unknown
  ImageBitmap?: unknown
  Intl?: unknown
  document?: unknown
  addEventListener?: unknown
  removeEventListener?: unknown
}

globals.navigator ??= { userAgent: 'NativeScript', gpu: null }
globals.addEventListener ??= () => {}
globals.removeEventListener ??= () => {}
globals.ImageBitmap ??= ImageBitmap
globals.Intl ??= {}

type ElementStub = Record<string, unknown>

function elementStub(): ElementStub {
  const stub: ElementStub = {
    style: {},
    classList: { add() {}, remove() {}, contains: () => false },
    children: [],
    parentNode: null,
    setAttribute() {},
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    getContext: () => null,
    getBoundingClientRect: () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    remove() {},
    load() {},
    play: () => Promise.resolve(),
    pause() {},
  }
  return stub
}

globals.document ??= {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
  createElement: () => elementStub(),
  createElementNS: () => elementStub(),
  createTextNode: () => ({}),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  fonts: null,
  baseURI: '',
  hidden: false,
  visibilityState: 'visible',
  body: {
    style: {},
    appendChild() {},
    removeChild() {},
    contains: () => false,
    addEventListener() {},
    removeEventListener() {},
  },
  documentElement: { style: {} },
}

console.log('[engine-demo] native globals seeded: navigator + ImageBitmap + Intl + document stub')
