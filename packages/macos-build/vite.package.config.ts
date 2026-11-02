import { cpSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, normalizePath } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
const source = resolve(root, '../cli/src')
const replacements = new Map([
	[normalizePath(resolve(source, 'env.ts')), resolve(root, 'runtime-paths.ts')],
	[normalizePath(resolve(source, 'package-root.ts')), resolve(root, 'project-package-root.ts')],
])
const entries = ['macos/package-worker', 'macos/dev-worker', 'macos/jsc-host/check-vite']

export default defineConfig({
	build: {
		lib: {
			entry: Object.fromEntries(entries.map(name => [name, resolve(source, `${name}.ts`)])),
			formats: ['es'],
		},
		outDir: 'dist', emptyOutDir: true, minify: false,
		rollupOptions: {
			external: id => id.startsWith('node:') || (!id.startsWith('.') && !id.startsWith('/')),
			output: { preserveModules: true, preserveModulesRoot: source, entryFileNames: '[name].js' },
		},
	},
	plugins: [{
		name: 'macos-worker-payloads',
		enforce: 'pre',
		load(id) {
			const replacement = replacements.get(normalizePath(id.split('?')[0]))
			if (replacement) { return readFileSync(replacement, 'utf8') }
		},
		closeBundle() {
			const payload = resolve(root, 'dist/macos/jsc-host')
			mkdirSync(payload, { recursive: true })
			cpSync(resolve(source, 'macos/jsc-host/prebuilt'), resolve(payload, 'prebuilt'), {
				recursive: true, verbatimSymlinks: true,
			})
			cpSync(resolve(source, 'macos/jsc-host/shim.js'), resolve(payload, 'shim.js'))
			cpSync(resolve(root, '../cli/dist/macos/jsc-host/abort-globals.cjs'), resolve(payload, 'abort-globals.cjs'))
		},
	}],
})
