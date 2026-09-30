import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		outDir: 'dist',
		lib: { entry: 'src/main.macos.js', formats: ['cjs'], fileName: 'main' },
		rollupOptions: { external: ['@nativescript/macos-node-api', /^node:/] },
	},
})
