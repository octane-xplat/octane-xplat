import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'
import { xplatBamboo } from '@octane-xplat/bamboo/vite'
import { fileURLToPath } from 'node:url'

const bambooRoot = fileURLToPath(new URL('../../packages/app/', import.meta.url))

export default defineConfig(({ mode }) => ({
	plugins: [
		...octane(),
		xplatBamboo({ cwd: bambooRoot, configPath: `${bambooRoot}bamboo.config.ts` }),
		xplatBoundary('linux'),
	],
	define: xplatNodeEnvDefine(mode),
	// Distinct from web's 5200 and the native dev server's 5173 so the WK/GTK
	// host can pin its URL while all three dev servers coexist.
	server: { port: 5201 },
	resolve: {
		// Linux renders the DOM inside the system webview — `web` stays in the
		// chain as the fallback for every leaf that doesn't need the host
		// bridge (packages/platform's *.linux.ts wins where it exists).
		conditions: ['linux', 'web'],
		// Suffix chain (first match wins): .linux → .web → shared.
		extensions: [
			'.linux.tsrx',
			'.web.tsrx',
			'.tsrx',
			'.linux.tsx',
			'.web.tsx',
			'.tsx',
			'.linux.ts',
			'.web.ts',
			'.mjs',
			'.mts',
			'.ts',
			'.jsx',
			'.js',
			'.json',
		],
	},
}))
