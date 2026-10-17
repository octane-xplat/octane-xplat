// Source-convention shim: tsconfig paths and the native vite preset resolve
// `@octane-xplat/platform/android` at `src/android`, while the published export
// map points at `./src/types/android.ts`. Re-export the generated module so
// both resolution paths land on the same implementation.
export * from './types/android'
