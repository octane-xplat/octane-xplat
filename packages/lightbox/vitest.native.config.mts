import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

const NATIVE_EXTS = [
	'.ios.tsrx', '.android.tsrx', '.mobile.tsrx', '.tsrx',
	'.ios.tsx', '.android.tsx', '.mobile.tsx', '.tsx',
	'.ios.ts', '.android.ts', '.mobile.ts', '.mjs', '.mts', '.ts',
	'.jsx', '.js', '.json',
]
const configDir = dirname(fileURLToPath(import.meta.url))
export default defineConfig({
	plugins: [octane({ ssr: false, renderers: { registry: { nativescript: nativeScriptRenderer }, rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }] } })],
	resolve: {
		conditions: ['native'],
		alias: [
			{ find: /^@nativescript\/core$/, replacement: resolve(configDir, 'test/platform.ts') },
			{ find: /^@nativescript-community\/gesturehandler$/, replacement: resolve(configDir, 'test/gesturehandler.ts') },
			{ find: /^octane$/, replacement: 'octane/universal/native' },
			{ find: /^@nativescript-community\/octane$/, replacement: 'octane/universal/native' },
		],
		extensions: NATIVE_EXTS,
	},
	test: { include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'], environment: 'node' },
})
