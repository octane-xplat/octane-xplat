import { defineConfig } from 'vitest/config'

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. The root config's generated env programs
// exist only after `xplat typecheck` runs — pin the test transform to the
// committed env manifest so the suite never depends on generated state.
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  test: { include: ['tests/*.test.ts'], environment: 'node', maxWorkers: 2 },
})
