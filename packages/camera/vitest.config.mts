import { defineConfig } from 'vitest/config'

// Session-core contract tests — pure TypeScript, no renderer.
export default defineConfig({
	test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
