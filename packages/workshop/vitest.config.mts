import { defineConfig } from 'vitest/config'

// Unit tests exercise the host-agnostic session/discovery logic. The ui
// barrel pulls every web component into node, so the store contract is
// aliased to the module the session actually consumes. `.pathname` avoids
// fileURLToPath — duplicated @types/node splits its URL type across envs.
const STORE_PATH = new URL('../ui/src/store.ts', import.meta.url).pathname

export default defineConfig({
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
