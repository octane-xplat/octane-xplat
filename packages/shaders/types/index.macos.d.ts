// Native desktop keeps the same public surface as the other targets —
// the functions resolve to the unsupported no-op implementations.
// Re-exports types.d.ts directly: under .macos moduleSuffixes, './index.js'
// would resolve back to this file.
export * from './types.js'
