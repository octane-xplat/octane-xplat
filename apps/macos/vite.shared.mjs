import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))
const fontAssetRoot = resolve(appRoot, '../../packages/app/src/assets/fonts')

export function bundledFontDefines() {
	return {
		__XPLAT_GEIST_FONT_BASE64__: JSON.stringify(
			readFileSync(join(fontAssetRoot, 'Geist-Variable.ttf')).toString('base64'),
		),
		__XPLAT_GEIST_FONT_LICENSE__: JSON.stringify(
			readFileSync(join(fontAssetRoot, 'OFL.txt'), 'utf8'),
		),
	}
}

export function createMacOSConfig({ packaged = false, hmr = false, rules } = {}) {
	const rendererId = 'macos'
	const nativeRuntime = '@nativescript/macos-node-api'
	const virtualListBench = hmr && process.env.OCTANE_MACOS_VLIST_BENCH === '1'
	const virtualListBenchMode = process.env.OCTANE_MACOS_VLIST_MODE === 'windowed'
	const variableWindowedBench = process.env.OCTANE_MACOS_VLIST_MODE === 'variable'

	return defineConfig({
		root: appRoot,
		...(packaged ? { define: bundledFontDefines() } : {}),
		plugins: [
			xplatBoundary('macos'),
			octane({
				hmr,
				renderers: {
					registry: {
						[rendererId]: {
							module: '@xplat/macos/renderer',
							target: 'universal',
							server: 'unsupported',
							text: 'host',
							intrinsics: '@xplat/macos/renderer/intrinsics',
						},
					},
					rules: rules ?? [
						{ include: 'src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/ui/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/app/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/demos/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/auth/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/gif/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/pager/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/motion/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/platform/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{ include: '**/packages/video/src/**/*.{tsx,tsrx}', renderer: rendererId },
						{
							include: '**/node_modules/@octane-xplat/ui/src/**/*.{tsx,tsrx}',
							renderer: rendererId,
						},
						{
							include: '**/node_modules/@octane-xplat/pager/src/**/*.{tsx,tsrx}',
							renderer: rendererId,
						},
						{
							include: '**/node_modules/@octane-xplat/video/src/**/*.{tsx,tsrx}',
							renderer: rendererId,
						},
					],
				},
			}),
		],
		build: {
			outDir: packaged ? 'dist/package-build' : 'dist',
			lib: {
				entry: packaged
					? 'src/main.mjs'
					: virtualListBench
						? variableWindowedBench
							? 'src/VirtualListVariableWindowedBench.tsx'
							: virtualListBenchMode
								? 'src/VirtualListWindowedBench.tsx'
								: 'src/VirtualListBench.tsx'
						: 'src/App.tsx',
				formats: packaged ? ['cjs'] : ['es'],
				fileName: packaged ? 'main' : 'app',
			},
			rollupOptions: {
				external: packaged
					? [nativeRuntime, /^node:/]
					: [nativeRuntime, '@xplat/macos/renderer', /^octane\//],
			},
		},
		resolve: {
			conditions: ['macos', 'native'],
			alias: [
				...(packaged
					? [
							{
								find: '@xplat/macos/renderer',
								replacement: resolve(appRoot, 'src/renderer/index.mjs'),
							},
						]
					: []),
				{ find: /^octane$/, replacement: 'octane/universal/native' },
				{
					find: /^@nativescript-community\/octane$/,
					replacement: '@xplat/macos/renderer',
				},
				{
					find: './escape-props',
					replacement: resolve(appRoot, 'src/renderer/native-escape-props.mjs'),
				},
				{
					find: /^@nativescript\/core$/,
					replacement: resolve(appRoot, 'src/renderer/native-core-shim.mjs'),
				},
				{
					// core's animation-frame subpath imports ios/android-only
					// *-native internals — the shim covers both on this host.
					find: /^@nativescript\/core\/animation-frame$/,
					replacement: resolve(appRoot, 'src/renderer/native-core-shim.mjs'),
				},
			],
			extensions: [
				'.macos.tsrx',
				'.tsrx',
				'.macos.tsx',
				'.tsx',
				'.macos.ts',
				'.mjs',
				'.mts',
				'.ts',
				'.jsx',
				'.js',
				'.json',
			],
		},
	})
}
