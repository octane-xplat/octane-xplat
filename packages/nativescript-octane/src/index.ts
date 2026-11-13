/**
 * The package root doubles as the renderer ABI the Octane compiler targets
 * (the `module` of the renderer config): compiled `.tsx` modules import their
 * host plans and hooks from it, so it re-exports the universal runtime.
 * `octane/universal/native` is the host-neutral build that pulls in no DOM
 * runtime, which is what makes it usable under the NativeScript JS engines.
 *
 * Keeping the ABI on the root rather than a subpath matters for
 * `@nativescript/vite`, whose device-side vendor registry serves NativeScript
 * plugins by bare package id and folds `dist/` subpaths back onto the root.
 */
export * from 'octane/universal/native'
export {
  createNativeScriptRoot,
  nativeScriptDriver,
  observeBatches,
  renderNativeScriptApp,
} from './driver.js'
export type { BatchObserver, NativeScriptContainer } from './driver.js'
export { ELEMENTS, eventNameFor, onElementReplaced, registerElement } from './elements.js'
export type { ElementConstructor } from './elements.js'
export type { RenderItem } from './list-view.js'
export { NATIVESCRIPT_RENDERER_ID } from './config.js'
