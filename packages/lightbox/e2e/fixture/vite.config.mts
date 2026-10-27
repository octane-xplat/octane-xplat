import { defineConfig } from 'vite'
import { octane } from 'octane/compiler/vite'

export default defineConfig({
	plugins: [octane({ ssr: false })],
	resolve: {
		conditions: ['web'],
		extensions: ['.web.tsrx', '.tsrx', '.web.tsx', '.tsx', '.web.ts', '.ts', '.mjs', '.mts', '.js', '.json'],
	},
	server: { strictPort: true, port: 4479 },
})
