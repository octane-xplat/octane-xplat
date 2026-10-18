import { defineConfig, mergeConfig } from 'vitest/config'
import appConfig from './vite.config.ts'

// Reuse the app's compiler, web platform resolution and aliases.
export default defineConfig(async (env) =>
	mergeConfig(await (typeof appConfig === 'function' ? appConfig(env) : appConfig), {
		test: {
			environment: 'jsdom',
			include: ['src/**/*.web.test.{ts,tsx,tsrx}'],
			setupFiles: ['src/test-setup.web.ts'],
		},
	}),
)
