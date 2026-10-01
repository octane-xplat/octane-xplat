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
			plugins: [
				xplatBamboo({ cwd: bambooRoot, configPath: `${bambooRoot}bamboo.config.ts`, native: true }),
			],
		},
	}),
)
