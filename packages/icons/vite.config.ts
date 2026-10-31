import { defineConfig } from 'vite'

// Node runs the bundler plugin without the application's Octane compiler, so
// it emits plain JS — published packages must not ship .ts for Node-side
// entries (no type stripping inside node_modules). Component exports keep
// shipping as authored source and are compiled by the app.
export default defineConfig({
	build: {
		lib: {
			entry: ['src/vite/index.ts'],
			formats: ['es'],
		},
		outDir: 'dist/vite',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			external: [/^node:/, /^@iconify\//, 'vite'],
		},
	},
})
