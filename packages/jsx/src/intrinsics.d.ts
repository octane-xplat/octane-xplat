/**
 * `@octane-xplat/jsx/intrinsics` — the shared native contract as an
 * augmentation and inspection target.
 *
 * `NativeElements<TElement>` is generic over the host element type; the
 * conditioned `jsx-runtime` entries instantiate it. A leaf package that
 * registers an element adds it by augmenting this interface — repeat the
 * type parameter so platform-scoped members can bind it:
 *
 * ```ts
 * declare module '@octane-xplat/jsx/intrinsics' {
 *   interface NativeElements<TElement> {
 *     camerapreview: Attributes<TElement, { src?: string }>;
 *   }
 * }
 * ```
 *
 * The augmenting declaration merges into every conditioned instantiation, so
 * platform-scoped tags belong in platform-suffixed files that only compile
 * where the element is registered.
 */
export * from './shared.js'
export type { HostElement } from './jsx-runtime.js'
