/** Renderer services exposed by the macOS Core bundle. */
export { createNativeScriptWindowRoot as createMacOSRoot } from './nativescript-window.macos'
export { observeNativeScriptLayoutCommits as observeLayoutCommits } from './nativescript-roots.macos'
export { syncNativeScriptProjection as setLayoutProjectionScale } from './nativescript-paint.macos'
export { registerNativeScriptStylesheet as registerStylesheet } from './nativescript-css.macos'
export { registerFontFamily } from './fonts'
export * from 'octane/universal/native'
