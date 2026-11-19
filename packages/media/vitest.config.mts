import { defineConfig } from 'vitest/config'

// Leaf contract tests — the web leaf is driven through a stubbed DOM
// (jsdom via the per-file environment pragma). Not a substitute for a
// browser or native smoke run.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
