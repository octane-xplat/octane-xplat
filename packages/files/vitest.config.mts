import { defineConfig } from 'vitest/config'
import { URL } from 'node:url'
import { octane } from 'octane/compiler/vite'

// Web-condition resolution so FileInput.web.tsrx and files.web.ts resolve;
// the bridge suite mocks the native globals explicitly.
export default defineConfig({
	plugins: [octane({ ssr: false })],
	resolve: {
		conditions: ['web'],
		alias: [
			// The published plugin has no platform-neutral entry for node to
			// resolve; the bridge suite substitutes its own mock.
			{
				find: /^@nativescript-community\/ui-document-picker$/,
				replacement: new URL('./tests/stubs/ui-document-picker.ts', import.meta.url)
					.pathname,
			},
		],
		extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.web.tsx', '.ts', '.tsx', '.mjs', '.js', '.json'],
	},
	test: {
		include: ['src/**/*.test.{ts,tsx,tsrx}'],
		environment: 'jsdom',
	},
})
