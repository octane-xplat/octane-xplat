// Compile installed source with the consumer's Octane pipeline; typecheck d.ts separately.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	realpathSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { build } = await import(require.resolve('vite'))
const { octane } = await import(require.resolve('@octanejs/vite-plugin'))
const { nativeScriptRenderer } = await import(
	require.resolve('@nativescript-community/octane/config')
)

const ts = require('typescript')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-platform-source-')))
const modules = join(temporary, 'node_modules/@octane-xplat')

try {
	execFileSync('pnpm', ['pack', '--pack-destination', temporary], {
		cwd: root,
		stdio: 'pipe',
		shell: process.platform === 'win32',
	})

	const tarball = readdirSync(temporary).find((file) => file.endsWith('.tgz'))

	// The packed platform's `workspace:*` dep on @octane-xplat/lib resolves to
	// the published version, which predates ./capability — pin the in-repo pack.
	const libPack = join(temporary, 'lib-pack')
	mkdirSync(libPack)
	execFileSync('pnpm', ['pack', '--pack-destination', libPack], {
		cwd: join(root, '../lib'),
		stdio: 'pipe',
		shell: process.platform === 'win32',
	})

	const libTarball = readdirSync(libPack).find((file) => file.endsWith('.tgz'))

	writeFileSync(
		join(temporary, 'package.json'),
		JSON.stringify({
			private: true,
			type: 'module',
			dependencies: { '@octane-xplat/platform': `file:${join(temporary, tarball)}` },
		}),
	)

	// pnpm overrides do not reach into file:-packed dependency graphs — rewrite
	// the packed manifest's lib spec through the readPackage hook instead.
	writeFileSync(
		join(temporary, '.pnpmfile.cjs'),
		`module.exports = { hooks: { readPackage(pkg) {
			if (pkg.dependencies?.['@octane-xplat/lib']) {
				pkg.dependencies['@octane-xplat/lib'] = 'file:${join(libPack, libTarball)}'
			}
			return pkg
		} } }\n`,
	)

	execFileSync('pnpm', ['install', '--ignore-scripts', '--config.auto-install-peers=false'], {
		shell: process.platform === 'win32',
		cwd: temporary,
		stdio: 'pipe',
	})

	const installed = realpathSync(join(modules, 'platform'))
	assert.ok(installed.startsWith(temporary + '/'), 'consumer uses its installed tarball')
	const store = join(temporary, 'node_modules/.pnpm')
	assert.ok(!existsSync(join(temporary, 'node_modules/@nativescript/macos-node-api')))
	assert.ok(
		!readdirSync(store).some((name) => name.startsWith('@nativescript+macos-node-api@')),
		'platform services must not install a macOS host SDK in every app',
	)

	for (const target of ['native', 'web', 'linux', 'macos']) {
		const native = target === 'native' || target === 'macos'
		const renderer = target === 'macos' ? 'macos' : 'nativescript'
		const extensions = (
			target === 'linux'
				? ['.linux', '.web', '']
				: target === 'web'
					? ['.web', '']
					: target === 'macos'
						? ['.macos', '']
						: ['.mobile', '']
		).flatMap((suffix) => ['.tsrx', '.tsx', '.ts', '.js'].map((ext) => suffix + ext))

		const compile = async (contents, define = {}) => {
			const entry = join(temporary, 'runtime.mjs')
			writeFileSync(entry, contents)
			const result = await build({
				root: temporary,
				configFile: false,
				logLevel: 'error',
				define,
				plugins: [
					...octane(
						native
							? {
									renderers: {
										registry: {
											[renderer]:
												target === 'macos'
													? {
															module: '@octane-xplat/macos-renderer',
															target: 'universal',
															server: 'unsupported',
															text: 'host',
														}
													: nativeScriptRenderer,
										},
										rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer }],
									},
								}
							: {},
					),
				],
				resolve: { conditions: [target], extensions },
				build: {
					write: false,
					minify: false,
					lib: { entry, formats: ['es'] },
					rolldownOptions: {
						moduleTypes: { '.tsrx': 'tsx' },
						external: [
							/^octane(?:\/|$)/,
							/^@nativescript(?:-community)?\//,
							/^@octane-xplat\/macos-renderer/,
							'vitest',
						],
						output: { paths: (id) => (native && id === 'octane' ? 'octane/universal/native' : id) },
					},
				},
			})

			const chunks = (Array.isArray(result) ? result : [result])
				.flatMap((result) => result.output)
				.filter((chunk) => chunk.type === 'chunk')

			return {
				code: chunks.map((c) => c.code).join('\n'),
				files: chunks.flatMap((c) => Object.keys(c.modules)),
			}
		}

		const subpaths = ['', '/host', '/host/web', '/host/services', '/dev-actions']
		if (target === 'native') {
			subpaths.push('/testing')
		}

		if (target !== 'macos') {
			for (const service of ['screen', 'safe-area', 'lifecycle', 'breakpoints']) {
				subpaths.push(`/${service}`)
			}

			subpaths.push('/clipboard', '/keep-awake')
		} else {
			subpaths.push('/use-keep-awake', '/connectivity', '/storage')
		}

		const contents = subpaths
			.map(
				(subpath, i) =>
					`import * as entry${i} from '@octane-xplat/platform${subpath}'; console.log(entry${i});`,
			)
			.join('\n')

		const result = await compile(contents)
		assert.ok(
			result.files.some((file) => file.startsWith(installed + '/src/')),
			'consumer compiles installed source',
		)

		if (target !== 'macos') {
			assert.ok(
				result.files.some((file) => file.endsWith('.tsrx')),
				'hook sources enter the compiler',
			)
		}

		if (native) {
			assert.doesNotMatch(
				result.code,
				/from ['"]octane['"]/,
				'native hooks never import the DOM runtime',
			)
		} else {
			assert.doesNotMatch(result.code, /from ['"]@nativescript/, 'web source avoids NativeScript')
			for (const service of ['screen', 'safe-area', 'lifecycle', 'breakpoints']) {
				assert.ok(
					result.files.includes(`${installed}/src/${service}.web.tsrx`),
					`${service} selects the web hook`,
				)

				assert.ok(
					!result.files.includes(`${installed}/src/${service}.tsrx`),
					`${service} excludes the native hook`,
				)
			}
		}

		const selectedService =
			target === 'macos'
				? 'storage.macos.ts'
				: `clipboard${target === 'native' ? '' : `.${target}`}.ts`

		assert.ok(
			result.files.includes(`${installed}/src/${selectedService}`),
			'selects platform service',
		)

		// Explicit extension aliases preserve their original native/default meaning.
		// Check them separately so they cannot mask a canonical subpath regression.
		const legacy =
			target === 'macos'
				? []
				: ['screen', 'safe-area', 'lifecycle', 'breakpoints'].flatMap((service) => [
						`/${service}.ts`,
						`/${service}.tsrx`,
						...(target === 'web'
							? [`/${service}.web`, `/${service}.web.ts`, `/${service}.web.tsrx`]
							: []),
					])

		const legacyContents = legacy
			.map(
				(subpath, i) =>
					`import * as legacy${i} from '@octane-xplat/platform${subpath}'; console.log(legacy${i});`,
			)
			.join('\n')

		if (legacy.length) {
			await compile(legacyContents)
		}

		writeFileSync(join(temporary, 'consumer.ts'), contents + '\n' + legacyContents)
		for (const mode of [ts.ModuleResolutionKind.Bundler, ts.ModuleResolutionKind.NodeNext]) {
			const program = ts.createProgram([join(temporary, 'consumer.ts')], {
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				module:
					mode === ts.ModuleResolutionKind.Bundler ? ts.ModuleKind.ESNext : ts.ModuleKind.NodeNext,
				moduleResolution: mode,
				target: ts.ScriptTarget.ESNext,
				customConditions: [target],
			})

			assert.deepEqual(
				ts
					.getPreEmitDiagnostics(program)
					.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
				[],
			)

			assert.deepEqual(
				program
					.getSourceFiles()
					.filter((file) => file.fileName.startsWith(installed + '/') && !file.isDeclarationFile)
					.map((file) => file.fileName),
				[],
				'plain TypeScript consumes declarations without implementation source',
			)
		}

		const action = `if (import.meta.env.DEV) {
			const { registerDevAction } = await import('@octane-xplat/platform/dev-actions');
			registerDevAction({ id: 'fixture.native-consumer-secret', title: 'Read test identity',
				description: 'Return an artificial test value.', result: { fields: { value: { type: 'string' } } },
				effects: { summary: 'Read fixture identity.' }, run: () => ({ value: 'FIXTURE_TEST_CREDENTIAL' }) });
		}`

		assert.match(
			(await compile(action, { 'import.meta.env.DEV': 'true' })).code,
			/FIXTURE_TEST_CREDENTIAL/,
		)

		assert.doesNotMatch(
			(await compile(action, { 'import.meta.env.DEV': 'false' })).code,
			/fixture\.native-consumer-secret|FIXTURE_TEST_CREDENTIAL|__xplat_dev__|__XPLAT_DEV_BRIDGE__/,
		)

		console.log(
			`platform packed consumer: ${target} source compiles, declarations stay isolated, production dev-actions excluded`,
		)
	}
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
