import { defineConfig } from 'vitest/config'

// Leaf contract tests — the shared session core driven through a scripted
// engine, plus platform leaves driven through stubbed globals. Not a
// substitute for a real recognizer; tests/web-chrome-runtime.mts drives one.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
