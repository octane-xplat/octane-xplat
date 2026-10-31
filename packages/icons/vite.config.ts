import { defineConfig } from 'vite'

// Node runs the bundler plugin and registry CLI without the application's
// Octane compiler, so they emit plain JS — published packages must not ship
// .ts for Node-side entries (no type stripping inside node_modules).
// Component exports keep shipping as authored source and are compiled by
// the app.
export default defineConfig({
	build: {
		lib: {
			entry: {
				'vite/index': 'src/vite/index.ts',
				'build/index': 'src/build/index.ts',
				'build/cli': 'src/build/cli.ts',
			},
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			external: [/^node:/, /^@iconify\//, 'vite'],
		},
	},
})
