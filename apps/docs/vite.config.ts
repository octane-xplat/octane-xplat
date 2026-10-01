import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => ({
	plugins: [...octane(), xplatBoundary('web')],
	define: xplatNodeEnvDefine(mode),
	server: { port: 5300 },
	resolve: {
		conditions: ['web'],
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
