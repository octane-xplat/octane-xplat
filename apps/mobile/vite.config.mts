import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'
import { xplatBamboo } from '@octane-xplat/bamboo/vite'
import { fileURLToPath } from 'node:url'

const bambooRoot = fileURLToPath(new URL('../../packages/app/', import.meta.url))

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain, deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. Bamboo uses the extra plugin slot so native
// CSS reaches its bundle adapter before NativeScript consumes the asset.
export default defineConfig(({ mode }) =>
	xplatNative(mode, {
		extra: {
			define: {
				__VISUAL_CAPTURE__: JSON.stringify(
					process.env.VISUAL_CAPTURE_URL
						? {
								url: process.env.VISUAL_CAPTURE_URL,
								runId: process.env.VISUAL_RUN_ID,
								revision: process.env.VISUAL_REVISION,
								scenarioHash: process.env.VISUAL_SCENARIO_HASH,
							}
						: null,
				),
			},
			plugins: [
				...(process.env.XPLAT_DOCS_DEMOS
					? [
							{
								name: 'docs-demos-entry',
								enforce: 'pre' as const,
								resolveId(source: string, importer?: string) {
									if (
										importer?.includes('virtual:entry-with-polyfills') &&
										source === '/src/index.ts'
									) {
										return fileURLToPath(new URL('./src/docs-demos.mobile.tsrx', import.meta.url))
									}
								},
							},
						]
					: []),
				...(process.env.VISUAL_CAPTURE_URL
					? [
							{
								name: 'xplat-visual-ios-host',
								enforce: 'pre' as const,
								load(id: string) {
									if (id === fileURLToPath(new URL('./src/test.ts', import.meta.url))) {
										return readFileSync(
											new URL('./src/visual-test.ios.ts', import.meta.url),
											'utf8',
										)
									}
								},
							},
						]
					: []),
				xplatBamboo({ cwd: bambooRoot, configPath: `${bambooRoot}bamboo.config.ts`, native: true }),
			],
		},
	}),
)
