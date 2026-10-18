import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		lib: {
			entry: ['index.ts', 'scaffold.ts', 'compatibility.ts'],
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
				preserveModulesRoot: '.',
			},
		},
	},
})
