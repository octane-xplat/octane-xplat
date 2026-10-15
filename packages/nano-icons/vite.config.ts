import { defineConfig } from 'vite'

// Node runs the font CLI without the application's Octane compiler.
// Component exports ship as authored source and are compiled by the app.
export default defineConfig({
	build: {
		lib: {
			entry: ['src/build/index.ts', 'src/build/cli.ts'],
			formats: ['es'],
		},
		outDir: 'dist/build',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			external: [
				/^node:/,
				/^@iconify\//,
				'@xmldom/xmldom',
				'cubic2quad',
				'fonteditor-core',
				'pathkit-wasm',
				'svg2ttf',
			],
		},
	},
})
