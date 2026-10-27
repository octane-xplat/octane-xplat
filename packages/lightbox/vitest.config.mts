import { defineConfig } from 'vitest/config'

// Phase 1 modules are DOM- and renderer-free; plain node vitest is enough.
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
	},
})
