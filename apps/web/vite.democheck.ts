import { defineConfig } from 'vite'
import base from './vite.config'

// Scratch config — same plugins/resolution as the real app, different entry.
// Used to compile-check @xplat/demos without touching main.tsrx.
export default defineConfig({
	...base,
	build: {
		outDir: 'dist-democheck',
		rollupOptions: { input: 'democheck.html' },
	},
})
