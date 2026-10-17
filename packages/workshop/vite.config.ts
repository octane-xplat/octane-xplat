import { globSync } from 'node:fs'
import { defineConfig } from 'vite'

// Vite loads workshop.config in Node, where installed TypeScript is not executable.
// App-facing exports remain source modules compiled by the consuming app; Node
// tooling lives in src/build/ (excluded from app typecheck sweeps) and emits to
// dist/build/. src/index.ts emits to dist/index.js for the `./` node condition.
export default defineConfig({
	build: {
		lib: {
			entry: [
				'src/index.ts',
				...globSync('src/build/**/*.ts').filter(
					(f) =>
						!f.endsWith('.d.ts') &&
						!f.includes('.test.') &&
						!f.includes('macos-vite') &&
						!f.includes('macos/shell'),
				),
			],
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			treeshake: false,
			external: (id) =>
				id.startsWith('node:') ||
				(!id.startsWith('.') && !id.startsWith('/') && !id.endsWith('.ts')),
			output: {
				preserveModules: true,
				preserveModulesRoot: 'src',
			},
		},
	},
})
