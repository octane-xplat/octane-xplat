import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { octane } from '@octanejs/vite-plugin'
import { vis } from 'vitest-plugin-vis/config'

export default defineConfig({
	optimizeDeps: { include: ['vitest-plugin-vis > ssim.js'] },
	plugins: [
		...octane(),
		vis({
			preset: 'manual',
			snapshotRootDir: () => process.env.VIS_ROOT || 'vis/web',
			snapshotSubpath: ({ subpath }) =>
				subpath.includes('mock.test') ? 'mock-workflow' : 'switch',
			failureThreshold: 0,
			failureThresholdType: 'pixel',
			diffOptions: { threshold: 0, includeAA: true },
		}),
	],
	define: {
		__MOCK_ALTERED__: JSON.stringify(process.env.VIS_MOCK_ALTERED === '1'),
		__WEB_ALTERED__: JSON.stringify(process.env.VIS_WEB_ALTERED === '1'),
	},
	resolve: {
		conditions: ['web'],
		dedupe: ['octane'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.ts',
			'.mjs',
			'.js',
			'.json',
		],
	},
	test: {
		include: ['src/*.test.web.ts'],
		browser: {
			enabled: true,
			headless: true,
			viewport: { width: 640, height: 420 },
			provider: playwright({
				contextOptions: {
					viewport: { width: 800, height: 600 },
					deviceScaleFactor: 1,
					colorScheme: 'light',
					reducedMotion: 'reduce',
					locale: 'en-US',
					timezoneId: 'UTC',
				},
			}),
			instances: [{ browser: 'chromium' }],
			screenshotFailures: false,
		},
	},
})
