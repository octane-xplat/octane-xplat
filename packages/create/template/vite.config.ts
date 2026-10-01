import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

// The web build. For native (iOS/Android), the same source runs through
// @nativescript-community/vite-octane with `conditions: ['native']`, the
// .ios/.android/.mobile suffix chain, and the unsuffixed native default — see
// the octane-xplat repo's apps/mobile/vite.config.mts.
export default defineConfig(({ mode }) => ({
	plugins: [...octane(), xplatBoundary('web')],
	define: xplatNodeEnvDefine(mode),
	server: { port: 5200 },
	resolve: {
		conditions: ['web'],
		// Suffix chain (first match wins): .web → shared → fallback.
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
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
