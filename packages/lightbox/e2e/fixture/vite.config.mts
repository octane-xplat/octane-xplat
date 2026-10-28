import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from 'octane/compiler/vite'

export default defineConfig(({ mode }) => ({
	plugins: [octane({ ssr: false })],
	resolve: {
		conditions: ['web'],
		alias: mode === 'isolated-ui' ? [{ find: /^@octane-xplat\/ui$/, replacement: fileURLToPath(new URL('./ui-leaves.web.ts', import.meta.url)) }] : [],
		extensions: ['.web.tsrx', '.tsrx', '.web.tsx', '.tsx', '.web.ts', '.ts', '.mjs', '.mts', '.js', '.json'],
	},
	server: { strictPort: true, port: 4479 },
}))
