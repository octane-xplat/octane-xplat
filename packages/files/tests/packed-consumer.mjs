import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'octane-xplat-files-consumer-')))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with ${result.status}`)
	}
}

// Deps the consumer needs in scope — the package's declared dependencies and
// peers plus the renderer's jsx-runtime source.
const dependencies = [
	'@nativescript-community/ui-document-picker',
	'@nativescript/core',
	'@nativescript/types',
	'@octane-xplat/platform',
	'@octane-xplat/ui',
	'octane',
]

const consumers = {
	web: `import { FileInput, files } from '@octane-xplat/files'
import type { FileInputProps } from '@octane-xplat/files'
const inputProps: FileInputProps = { value: null, onChange: () => {} }
void FileInput
void inputProps
const picked = files.pick('image/*')
const ref = picked.then((file) => file?.uri)
// @ts-expect-error readText needs a FileRef
const bad = files.readText('path')
void picked
void ref
void bad
`,
	native: `import { FileInput, files } from '@octane-xplat/files'
import type { FileInputProps } from '@octane-xplat/files'
const inputProps: FileInputProps = { value: null, onChange: () => {} }
void FileInput
void inputProps
const picked = files.pick('image/*')
const ref = picked.then((file) => file?.uri)
// @ts-expect-error readText needs a FileRef
const bad = files.readText('path')
void picked
void ref
void bad
`,
	macos: `import { FileInput, files } from '@octane-xplat/files'
import type { FileInputProps } from '@octane-xplat/files'
const inputProps: FileInputProps = { value: null, onChange: () => {} }
void FileInput
void inputProps
const picked = files.pick()
void picked
`,
}

for (const target of Object.keys(consumers)) {
	consumers[target] +=
		`import { FileInput as DirectFileInput } from '@octane-xplat/files/FileInput'\nvoid DirectFileInput\n`
}

const extraFiles = {}

// Mirrors the create template's per-target tsconfig: suffix typing selects
// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
// ambient globals, and skipLibCheck stays on — NativeScript's third-party
// ambient declarations carry upstream lib conflicts.
const targetConfig = {
	web: {
		moduleSuffixes: ['.web', ''],
		customConditions: ['web'],
		types: ['vite/client'],
	},
	native: {
		moduleSuffixes: ['.ios', '.android', '.mobile', ''],
		customConditions: ['native'],
		types: ['@nativescript/types'],
	},
	macos: {
		moduleSuffixes: ['.macos', ''],
		customConditions: ['macos'],
		types: [],
	},
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/files')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	for (const dependency of dependencies) {
		const source = join(packageRoot, 'node_modules', dependency)
		const fallback = join(repoRoot, 'node_modules', dependency)
		const resolved = existsSync(source) ? source : existsSync(fallback) ? fallback : null
		if (!resolved) {
			continue
		}

		const targetPath = join(modules, dependency)
		mkdirSync(dirname(targetPath), { recursive: true })
		symlinkSync(resolved, targetPath, 'dir')
	}

	// ESM consumer — NodeNext treats extensionless .tsx as CJS without it,
	// which would let an ESM-only package slip type checks its runtime
	// resolution can't satisfy.
	writeFileSync(
		join(consumerRoot, 'package.json'),
		JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
	)

	writeFileSync(join(consumerRoot, 'consumer.ts'), consumers[target])
	for (const [name, contents] of Object.entries(extraFiles)) {
		writeFileSync(join(consumerRoot, name), contents)
	}

	const config = targetConfig[target]
	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: mode.module,
					moduleResolution: mode.moduleResolution,
					target: 'esnext',
					moduleSuffixes: config.moduleSuffixes,
					customConditions: config.customConditions,
					types: config.types.filter((name) => {
						const segments = name.split('/')
						const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
						return existsSync(join(modules, ...pkg, 'package.json'))
					}),
					skipLibCheck: true,
				},
				files: ['consumer.ts', ...Object.keys(extraFiles)],
			},
			null,
			2,
		),
	)

	run(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
		consumerRoot,
	)

	const listed = spawnSync(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath, '--listFilesOnly'],
		{ cwd: consumerRoot, encoding: 'utf8' },
	)

	assert.equal(listed.status, 0, listed.stderr)
	const implementation = listed.stdout
		.split('\n')
		.filter((file) => file.startsWith(packageLink + '/') && !file.endsWith('.d.ts'))

	assert.deepEqual(implementation, [], `${target}/${mode.name} loaded implementation source`)
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const require = createRequire(import.meta.url)
	const { build } = require('vite')
	const { octane } = require('@octanejs/vite-plugin')
	const { nativeScriptRenderer } = require('@nativescript-community/octane/config')
	const modules = join(temporary, 'node_modules/@octane-xplat')
	mkdirSync(modules, { recursive: true })
	symlinkSync(packedRoot, join(modules, 'files'), 'dir')
	for (const target of ['native', 'web', 'linux']) {
		const native = target === 'native'
		const suffixes =
			target === 'linux' ? ['.linux', '.web', ''] : native ? ['.mobile', ''] : ['.web', '']

		const entry = join(temporary, 'runtime.mjs')
		writeFileSync(
			entry,
			`import * as files from '@octane-xplat/files';
import { FileInput } from '@octane-xplat/files/FileInput'; console.log(files, FileInput)`,
		)

		const result = await build({
			root: temporary,
			configFile: false,
			logLevel: 'error',
			plugins: octane(
				native
					? {
							renderers: {
								registry: { nativescript: nativeScriptRenderer },
								rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
							},
						}
					: {},
			),
			resolve: {
				conditions: [target],
				extensions: suffixes.flatMap((suffix) =>
					['.tsrx', '.tsx', '.ts', '.js'].map((ext) => suffix + ext),
				),
			},
			build: {
				write: false,
				minify: false,
				lib: { entry, formats: ['es'] },
				rolldownOptions: {
					moduleTypes: { '.tsrx': 'tsx' },
					external: [
						/^octane(?:\/|$)/,
						/^@nativescript(?:-community)?\//,
						/^@octane-xplat\/(?:ui|platform)(?:\/|$)/,
					],
					output: { paths: (id) => (native && id === 'octane' ? 'octane/universal/native' : id) },
				},
			},
		})

		const chunks = (Array.isArray(result) ? result : [result])
			.flatMap((result) => result.output)
			.filter((chunk) => chunk.type === 'chunk')

		assert.ok(
			chunks.some((chunk) => Object.keys(chunk.modules).some((file) => file.endsWith('.tsrx'))),
			'consumer compiles authored component source',
		)

		const selectedSource = `FileInput${native ? '' : `.${target}`}.tsrx`
		assert.ok(
			chunks.some((chunk) =>
				Object.keys(chunk.modules).includes(join(packedRoot, 'src', selectedSource)),
			),
			'direct component subpath selects its platform source',
		)

		if (target === 'web') {
			assert.ok(
				!chunks.some((chunk) => chunk.imports.some((path) => path.startsWith('@nativescript'))),
				'web entry avoids NativeScript',
			)
		} else if (native) {
			assert.doesNotMatch(
				chunks.map((chunk) => chunk.code).join('\n'),
				/from ['"]octane['"]/,
				'native avoids the DOM runtime',
			)
		}
	}

	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

	const exportMaps = [
		workspaceManifest.exports,
		workspaceManifest.publishConfig?.exports ?? packedManifest.exports,
	]

	const uniqueExportMaps = exportMaps.filter(
		(exportsMap, index) =>
			exportsMap &&
			exportMaps.findIndex(
				(candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
			) === index,
	)

	for (const [index, exportsMap] of uniqueExportMaps.entries()) {
		const consumerPackage = join(temporary, `package-${index}`)
		cpSync(packedRoot, consumerPackage, { recursive: true })
		const consumerManifestPath = join(consumerPackage, 'package.json')
		const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
		consumerManifest.exports = exportsMap
		writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)

		for (const target of Object.keys(consumers)) {
			// Subpath exports absent from a map (e.g. ./macos only exists in the
			// workspace map) cannot resolve — skip that lane for that map.
			const targetSubpaths = targetConfig[target].subpaths ?? ['.']
			if (!targetSubpaths.every((subpath) => exportsMap[subpath])) {
				continue
			}

			for (const mode of [
				{
					name: 'bundler',
					module: 'esnext',
					moduleResolution: 'bundler',
				},
				{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log(
		'files packed consumer: app compiler resolves source; declarations pass Bundler and NodeNext',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
