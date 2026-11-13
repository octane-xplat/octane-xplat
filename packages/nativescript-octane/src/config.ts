/**
 * Serializable compiler metadata for the NativeScript renderer.
 *
 * Read on the Node side, by a Vite config, so it must not import
 * `@nativescript/core` or an Octane runtime.
 */
import type { OctaneRendererValidationOptions } from 'octane/compiler/vite'

export const NATIVESCRIPT_RENDERER_ID = 'nativescript'

/**
 * Source restrictions the compiler enforces on the modules this renderer
 * owns. A rule can only select `.tsx` and `.tsrx` for this renderer (see
 * `nativeScriptRenderers`), so plain `.ts` helpers are not checked. Only
 * names no NativeScript runtime provides: core polyfills
 * `fetch`, `XMLHttpRequest`, `alert`, `confirm`, `matchMedia`,
 * `requestAnimationFrame`, `crypto`, `TextEncoder`, `Blob`, `FormData`, ...,
 * and apps commonly polyfill `WebSocket`, so those stay allowed.
 */
export const nativeScriptRendererValidation = {
  forbiddenGlobals: [
    'document',
    'window',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'HTMLElement',
    'Element',
    'Node',
    'DOMParser',
    'MutationObserver',
    'ResizeObserver',
    'IntersectionObserver',
  ],
  /** Octane's DOM-side entries and React DOM; an entry also covers its subpaths. */
  forbiddenImports: [
    'octane/dom-bindings',
    'octane/dom-binding-program',
    'octane/hydration',
    'react-dom',
  ],
} as const satisfies OctaneRendererValidationOptions

export const nativeScriptRenderer = {
  /** The package root re-exports the universal runtime, which is what makes it a valid renderer module. */
  module: '@octane-xplat/nativescript-octane',
  target: 'universal',
  /** There is no server half of a NativeScript app. */
  server: 'unsupported',
  /** The `@jsxImportSource` a module may name to claim the renderer. */
  intrinsics: '@octane-xplat/nativescript-octane',
  /** `<label>text</label>` lowers to a `#text` host the driver folds into the parent's `text`. */
  text: 'host',
  validation: nativeScriptRendererValidation,
} as const

export interface NativeScriptRenderersOptions {
  /** Glob of the modules the renderer compiles. Defaults to `src/**\/*.{tsx,tsrx}`. */
  include?: string
  /**
   * Lists merged over `nativeScriptRendererValidation` (a list given here
   * replaces the default one); `false` turns validation off.
   */
  validation?: OctaneRendererValidationOptions | false
}

/**
 * The renderer registry `@octanejs/vite-plugin` reads. The renderer is scoped
 * to `.tsx` and `.tsrx` by rule rather than set as the default so plain `.ts`
 * modules stay unowned: a `server: 'unsupported'` renderer cannot own them, and the
 * compiler rejects a config whose rule selects one.
 */
export function nativeScriptRenderers(options: NativeScriptRenderersOptions = {}) {
  return {
    registry: {
      [NATIVESCRIPT_RENDERER_ID]: rendererWithValidation(options.validation),
    },
    rules: [
      {
        include: options.include ?? 'src/**/*.{tsx,tsrx}',
        renderer: NATIVESCRIPT_RENDERER_ID,
      },
    ],
  } as const
}

function rendererWithValidation(validation: NativeScriptRenderersOptions['validation']) {
  if (validation === undefined) {
    return nativeScriptRenderer
  }
  const { module, target, server, intrinsics, text } = nativeScriptRenderer
  if (validation === false) {
    return { module, target, server, intrinsics, text }
  }
  return {
    module,
    target,
    server,
    intrinsics,
    text,
    validation: { ...nativeScriptRendererValidation, ...validation },
  }
}
