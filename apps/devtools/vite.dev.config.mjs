import { defineConfig, mergeConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async (env) =>
	mergeConfig(await macos(env, { root: appRoot, hmr: true, entry: 'src/main.macos.ts' }), {
		build: {
			outDir: 'dist/dev',
			emptyOutDir: false,
			lib: { formats: ['cjs'], fileName: 'app' },
		},
	}),
)
