import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(async ({ mode }) => {
	const config = await xplatMacOS(mode, {
		packaged: false,
		hmr: true,
		entry: 'src/App.macos.tsx',
		outDir: 'dist/dev',
	})

	return {
		...config,
		build: { ...config.build, lib: { ...config.build.lib, formats: ['cjs'], fileName: 'app' } },
	}
})
