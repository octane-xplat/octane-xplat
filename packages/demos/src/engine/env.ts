// Shared fallback for env.mobile.ts — on web Pixi's default BrowserAdapter
// already works, so installPixiEnv just loads the module.
export async function installPixiEnv(): Promise<typeof import('pixi.js')> {
  return import('pixi.js')
}
