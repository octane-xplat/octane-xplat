import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
// This is a packaging config, not a runnable web app. The explicit config
// filename keeps CLI app discovery from treating this tool package as an app.
// Keep the TypeScript CLI intact as a reference during the Nim migration.
// Only this plugin closure is compiled into the project-installed package;
// there is no published dependency on the CLI or a call back into its runtime.
const source = resolve(root, '../cli/src')
const entries = ['vite', 'macos/vite', 'linux-gtk/vite']

export default defineConfig({
	build: {
		lib: {
			entry: Object.fromEntries(entries.map((name) => [name, resolve(source, `${name}.ts`)])),
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			external: (id) => id.startsWith('node:') || (!id.startsWith('.') && !id.startsWith('/')),
			output: {
				preserveModules: true,
				preserveModulesRoot: source,
				entryFileNames: '[name].js',
			},
		},
	},
	plugins: [
		{
			name: 'build-plugin-declarations',
			closeBundle() {
				for (const name of [...entries, 'css-platform.types']) {
					const input = name === 'css-platform.types' ? `${name}.ts` : `${name}.d.ts`
					const output = resolve(root, 'dist', `${name}.d.ts`)
					mkdirSync(dirname(output), { recursive: true })
					const declarations = readFileSync(resolve(source, input), 'utf8')
						.replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2')
					writeFileSync(output, declarations)
				}
			},
		},
	],
})
