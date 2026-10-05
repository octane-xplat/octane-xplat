import { defineConfig } from 'vitest/config'
import native from '../ui/vitest.native.config.mts'

export default defineConfig({
	...native,
	test: { include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'], environment: 'node' },
})
