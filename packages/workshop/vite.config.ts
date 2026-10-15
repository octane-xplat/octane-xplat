import { defineConfig } from 'vite'

// Vite loads workshop.config in Node, where installed TypeScript is not executable.
// App-facing exports remain source modules compiled by the consuming app.
export default defineConfig({
	build: {
		lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
		outDir: 'dist/node',
		emptyOutDir: true,
		minify: false,
	},
})
