import { globSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'

// The CLI runs under plain Node — emit per-module ESM mirroring src/ so bins,
// spawned entries, and subpath exports resolve inside the published tarball.
export default defineConfig({
	build: {
		lib: {
			entry: globSync('src/**/*.ts').filter(
				(f) => !f.endsWith('.d.ts') && !f.includes('.test.'),
			),
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			// Module-per-file emit: every source file must survive as a module —
			// treeshaking drops `export {}` from type-only contract stubs, and an
			// empty .js is not a module to consumers' tsc.
			treeshake: false,
			external: (id) =>
				/^node:/.test(id) || (!id.startsWith('.') && !id.startsWith('/') && !id.endsWith('.ts')),
			output: {
				preserveModules: true,
				preserveModulesRoot: 'src',
			},
		},
	},
	plugins: [
		{
			name: 'keep-empty-modules',
			apply: 'build',
			closeBundle() {
				// Type-only sources emit as empty files — rolldown drops the
				// `export {}` marker even with treeshake off, and a zero-byte .js
				// is not a module to consumers' tsc. Restore the marker.
				const restore = (dir: string) => {
					for (const entry of readdirSync(dir, { withFileTypes: true })) {
						const p = join(dir, entry.name)
						if (entry.isDirectory()) restore(p)
						else if (entry.name.endsWith('.js') && statSync(p).size === 0)
							writeFileSync(p, 'export {}\n')
					}
				}
				restore('dist')
			},
		},
	],
})
