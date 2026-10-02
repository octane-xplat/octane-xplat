import { defineConfig } from 'vitest/config'
import { octane } from '@octanejs/vite-plugin'

// Component tests run through the same octane transform the web app uses —
// web suffix chain so leaves resolve to their DOM implementations.
export default defineConfig({
	plugins: [...octane()],
	resolve: {
		conditions: ['web'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.mjs',
			'.mts',
			'.ts',
			'.jsx',
			'.js',
			'.json',
		],
	},
	test: {
		// Repo-root so package test globs don't traverse pnpm workspace
		// symlinks (packages/app/node_modules/@xplat/*) and double-run.
		root: '../..',
		include: ['packages/*/src/**/*.test.{ts,tsx,tsrx}', 'apps/web/test/**/*.test.ts'],
		// Platform-specific tests run from their owning package, where native
		// resolution and renderer setup are available. In particular, mobile
		// tests need the NativeScript renderer and native aliases.
		// packages/motion runs its own vitest configs (jsdom + native); running
		// its web tests here under the node environment crashes on `history`.
		exclude: [
			'**/*.mobile.test.*',
			'**/*.ios.test.*',
			'**/*.android.test.*',
			'**/*.macos.test.*',
			'**/packages/motion/**',
		],
	},
})
