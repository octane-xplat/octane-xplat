import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { octane } from 'octane/compiler/vite'
const root = fileURLToPath(new URL('..', import.meta.url))
// Compile/link only. Do not import or execute the resulting app/engine bundle.
const result = await build({
	root,
	configFile: false,
	logLevel: 'warn',
	plugins: [octane({ ssr: false })],
	resolve: { conditions: ['web'], extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js'] },
	build: {
		write: false,
		minify: false,
		lib: {
			entry: fileURLToPath(new URL('../src/index.web.ts', import.meta.url)),
			formats: ['es'],
			fileName: 'view-shot',
		},
		rollupOptions: { external: ['octane', 'octane/jsx-runtime', '@octane-xplat/lib/capability'] },
	},
})
const chunks = (Array.isArray(result) ? result : [result]).flatMap((value) => value.output)
assert.ok(
	chunks.some(
		(chunk) =>
			chunk.type === 'chunk' &&
			Object.keys(chunk.modules).some((id) => id.includes('html2canvas-pro')),
	),
)
assert.ok(
	chunks.every(
		(chunk) =>
			chunk.type !== 'chunk' ||
			!Object.keys(chunk.modules).some((id) => id.includes('@nativescript/core')),
	),
)
console.log(
	'Browser graph links the real DOM engine and excludes NativeScript; output was never executed and no capture occurred.',
)
