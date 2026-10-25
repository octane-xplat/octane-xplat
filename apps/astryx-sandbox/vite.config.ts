import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatCss, xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

// Web build of the Astryx sandbox replica. Platform leaves follow the shared
// suffix chain: .web wins over the unsuffixed default — there is no native
// host for this app yet.
export default defineConfig(({ mode }) => ({
	plugins: [xplatCss('web'), ...octane(), xplatBoundary('web'), xplatDevBridge()],
	define: xplatNodeEnvDefine(mode),
	server: { port: 5240 },
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
