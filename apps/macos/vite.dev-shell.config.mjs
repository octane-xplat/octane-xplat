import { createMacOSConfig } from './vite.shared.mjs'

const config = createMacOSConfig({ packaged: true })
export default {
	...config,
	build: {
		...config.build,
		outDir: 'dist/dev',
		emptyOutDir: false,
		lib: { entry: 'src/dev-shell.mjs', formats: ['cjs'], fileName: 'shell' },
	},
}
