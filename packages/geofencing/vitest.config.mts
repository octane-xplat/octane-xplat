import { defineConfig } from 'vitest/config'

// geofencing contract tests — the Android leaf driven through faithful
// global stubs (same call surfaces the NS runtime marshals). Not a
// substitute for a native smoke run. The pinned env manifest keeps the oxc
// transform off the generated xplat-typecheck programs (same pattern as
// packages/view-shot).
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
