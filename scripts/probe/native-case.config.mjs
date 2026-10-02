import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { scratchResolver } from './project.mjs'

export default async function nativeCaseConfig(project, target) {
	const load = async (name) =>
		import(pathToFileURL(createRequire(join(project, 'package.json')).resolve(name)).href)

	const [{ octane }, { nativeScriptRenderer }, { xplatBoundary, xplatNative, xplatNodeEnvDefine }] =
		await Promise.all([
			load('octane/compiler/vite'),
			load('@nativescript-community/octane/config'),
			load('@octane-xplat/cli/vite'),
		])

	const previousDirectory = process.cwd()
	let css
	try {
		process.chdir(project)
		const preset = await xplatNative('production')
		css = preset.plugins.flat(Infinity).find((plugin) => plugin?.name === 'xplat-native-css')
		if (!css) {
			throw new Error('NativeScript preset is missing its CSS normalization plugin')
		}
	} finally {
		process.chdir(previousDirectory)
	}

	return {
		root: project,
		// The npm `process.env.NODE_ENV` convention — package dev/prod switches
		// (lexical among them) read it bare; the NS runtime has no `process`,
		// so unrewritten reads throw at module eval.
		define: xplatNodeEnvDefine('production'),
		plugins: [
			scratchResolver(project),
			css,
			xplatBoundary(target),
			octane({
				renderers: {
					registry: { nativescript: nativeScriptRenderer },
					rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'nativescript' }],
				},
			}),
		],
		resolve: {
			conditions: ['native'],
			alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
			extensions: [
				`.${target}.tsrx`,
				'.mobile.tsrx',
				'.tsrx',
				`.${target}.tsx`,
				'.mobile.tsx',
				'.tsx',
				`.${target}.ts`,
				'.mobile.ts',
				'.ts',
				'.mjs',
				'.js',
				'.json',
			],
		},
		build: {
			outDir: 'case-dist',
			emptyOutDir: false,
			minify: false,
			lib: { entry: 'src/case.mjs', formats: ['cjs'], fileName: () => 'case.cjs' },
			rolldownOptions: {
				moduleTypes: { '.tsrx': 'tsx' },
				external: (id) =>
					id === '@nativescript/core' ||
					id.startsWith('@nativescript/core/') ||
					id === '@nativescript-community/octane' ||
					id === '@nativescript-community/gesturehandler' ||
					id.startsWith('octane/'),
				// The runner serves a single case.cjs — dynamic import() must not
				// split sibling chunks (they'd never reach the app). Disabling
				// code splitting still keeps dynamic imports lazy, so per-module
				// import probes keep independent pass/fail reporting.
				output: { codeSplitting: false },
			},
		},
	}
}
