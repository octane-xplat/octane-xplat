import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))

// Packaged-style single bundle: the JavaScriptCore host cannot resolve
// external package imports, so everything is bundled into one .cjs.
export default defineConfig(async (env) => {
	const config = await xplatMacOS(env.mode, {
		root: appRoot,
		packaged: true,
		entry: 'src/main.mjs',
	})
	return {
		...config,
		build: {
			...config.build,
			outDir: 'dist/dev',
			emptyOutDir: false,
			lib: { ...config.build.lib, formats: ['cjs'], fileName: 'app' },
		},
	}
})
