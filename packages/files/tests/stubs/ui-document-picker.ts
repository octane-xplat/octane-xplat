// Resolution stub for vitest — the published plugin ships only platform
// entries (index.android.js/index.ios.js), so the bare specifier cannot
// resolve in node. The bridge suite replaces it with vi.mock anyway.
export const openFilePicker = () => Promise.resolve({ files: [] })
