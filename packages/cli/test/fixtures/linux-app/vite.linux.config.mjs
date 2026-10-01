import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary } from '@octane-xplat/cli/vite'
export default defineConfig({
	plugins: [...octane(), xplatBoundary('linux')],
	resolve: {
		conditions: ['linux', 'web'],
		extensions: ['.linux.tsrx', '.web.tsrx', '.tsrx', '.linux.ts', '.web.ts', '.ts', '.js'],
	},
})
