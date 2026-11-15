// Native Pixi environment. './globals' evaluates during the eager bundle
// init (seeding `navigator` + `ImageBitmap`), while 'pixi.js' itself is a
// dynamic import inside installPixiEnv — pixi's module-init isSafari() would
// crash during vendor-chunk eval if it were statically reachable, since it
// runs before any importer body. With pixi lazy, the seeds land first and
// the DOMAdapter replaces BrowserAdapter before @pixi/3d evaluates.
import './globals'
import type { Adapter } from 'pixi.js'
import {
  CanvasRenderingContext2D,
  OffscreenCanvas,
  WebGLRenderingContext,
} from '@nativescript/canvas'
import { knownFolders } from '@nativescript/core'

// Every DOM-dependent call Pixi makes goes through this adapter; calls are
// counted so the run can report exactly which browser services the model
// pipeline needed.
export const adapterCalls: Record<string, number> = {}

function counted<A extends unknown[], R>(name: string, fn: (...args: A) => R) {
  return (...args: A) => {
    adapterCalls[name] = (adapterCalls[name] ?? 0) + 1
    try {
      return fn(...args)
    } catch (error) {
      // Adapter-boundary failure diagnostics: the stack shows whether the
      // missing browser global was touched inside our adapter or by pixi.
      console.log(`[engine-demo] pixi adapter ${name} threw: ${(error as Error)?.stack ?? error}`)
      throw error
    }
  }
}

function unsupported(name: string): never {
  throw new Error(`engine-demo pixi adapter does not provide ${name}`)
}

// NativeScript's Canvas classes implement the DOM shapes Pixi uses but are
// not the lib.dom declarations, so this one assertion bridges the worlds.
const nativeAdapter = {
  createCanvas: counted('createCanvas', (width?: number, height?: number) => new OffscreenCanvas(width ?? 1, height ?? 1)),
  createImage: counted('createImage', () => unsupported('createImage')),
  getCanvasRenderingContext2D: counted('getCanvasRenderingContext2D', () => CanvasRenderingContext2D),
  getWebGLRenderingContext: counted('getWebGLRenderingContext', () => WebGLRenderingContext),
  getNavigator: counted('getNavigator', () => ({ userAgent: 'NativeScript', gpu: null })),
  getBaseUrl: counted('getBaseUrl', () => `file://${knownFolders.currentApp().path}/`),
  getFontFaceSet: counted('getFontFaceSet', () => null),
  fetch: counted('fetch', (url: RequestInfo, options?: RequestInit) => fetch(url, options)),
  parseXML: counted('parseXML', () => unsupported('parseXML')),
} as unknown as Adapter

export async function installPixiEnv(): Promise<typeof import('pixi.js')> {
  const pixi = await import('pixi.js')
  pixi.DOMAdapter.set(nativeAdapter)
  // EventSystem.init calls setTargetElement -> _addEvents, which wires
  // document/domElement listeners unconditionally. Native has no
  // `document` and the canvas has no addEventListener; input reaches the
  // demo through the host Pressable, not pixi's federated events — so the
  // DOM wiring is a verified no-op here.
  // _addEvents is private on EventSystem; reaching it to no-op the DOM
  // wiring is a runtime conversion TypeScript can't express.
  ;(pixi.EventSystem.prototype as unknown as { _addEvents?: () => void })._addEvents = function () {}
  console.log('[engine-demo] pixi DOMAdapter installed (native), EventSystem DOM wiring skipped')
  return pixi
}
