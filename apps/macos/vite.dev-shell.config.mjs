import { defineConfig } from 'vite'
import { createMacOSConfig } from './vite.shared.mjs'

const config = createMacOSConfig({ packaged: true })
export default defineConfig(async (env) => {
	const resolved = await config(env)
	return {
		...resolved,
		build: {
			...resolved.build,
			outDir: 'dist/dev',
			emptyOutDir: false,
			lib: { entry: 'src/dev-shell.mjs', formats: ['cjs'], fileName: 'shell' },
		},
	}
})
