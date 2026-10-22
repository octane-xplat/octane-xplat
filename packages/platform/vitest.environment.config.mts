import { defineConfig } from 'vitest/config'
export default defineConfig({
	test: { include: ['src/environment.*.test.ts'], environment: 'node' },
})
