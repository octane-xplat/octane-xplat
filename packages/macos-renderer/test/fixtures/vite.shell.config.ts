import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(async ({ mode }) => {
	const config = await xplatMacOS(mode, { entry: 'src/dev-shell.ts', outDir: 'dist/dev' })
	return { ...config, build: { ...config.build, emptyOutDir: false } }
})
