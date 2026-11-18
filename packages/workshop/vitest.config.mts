import { defineConfig } from 'vitest/config'

// Unit tests exercise the host-agnostic session/discovery logic. The ui
// barrel pulls every web component into node, so the store contract is
// aliased to the module the session actually consumes. `.pathname` avoids
// fileURLToPath — duplicated @types/node splits its URL type across envs.
const STORE_PATH = new URL('../ui/src/data/store.ts', import.meta.url).pathname

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. The root config's generated env programs
// exist only after `xplat typecheck` runs — pin the test transform to the
// committed env manifest so the suite never depends on generated state.
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  resolve: {
    alias: [
      { find: /^@octane-xplat\/ui\/data$/, replacement: STORE_PATH },
      { find: /^@octane-xplat\/ui$/, replacement: STORE_PATH },
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,mts,mjs}'],
  },
})
