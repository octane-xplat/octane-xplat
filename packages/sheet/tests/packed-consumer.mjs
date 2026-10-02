import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-sheet-consumer-'))
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
	'octane',
	'@nativescript-community/octane',
	'@nativescript/core',
	'@nativescript/types',
]

const consumers = {
	web: `import { BottomSheet, type BottomSheetProps } from '@octane-xplat/sheet/web'
const focusRef = { current: null as HTMLElement | null }
const props: BottomSheetProps = { open: true, label: 'Account actions', finalFocusRef: focusRef }
const sheet = <BottomSheet {...props} />
void sheet
`,
	native: `import { SwiftUIBottomSheet, type SwiftUIBottomSheetProps } from '@octane-xplat/sheet/ios'
import { MaterialBottomSheet, type MaterialBottomSheetProps } from '@octane-xplat/sheet/android'
const iosProps: SwiftUIBottomSheetProps = { open: true, detents: ['medium', 'large'] }
const androidProps: MaterialBottomSheetProps = { open: false }
const ios = <SwiftUIBottomSheet {...iosProps} />
const android = <MaterialBottomSheet {...androidProps} />
// @ts-expect-error detents follows the published union
const badDetent = <SwiftUIBottomSheet detents={['huge']} />
void ios
void android
void badDetent
`,
	macos: `import { AppKitSheet, type AppKitSheetProps } from '@octane-xplat/sheet/macos'
const sheet = <AppKitSheet open={true} />
void sheet
`,
}

const extraFiles = {}

// Mirrors the create template's per-target tsconfig: suffix typing selects
// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
// ambient globals, and skipLibCheck stays on — NativeScript's third-party
// ambient declarations carry upstream lib conflicts.
const targetConfig = {
	web: {
		jsxImportSource: 'octane',
		moduleSuffixes: ['.web', ''],
		customConditions: ['web'],
		types: [],
		subpaths: ['./web'],
	},
	native: {
		jsxImportSource: 'octane',
		moduleSuffixes: ['.ios', '.android', '.mobile', ''],
		customConditions: ['native'],
		types: ['@nativescript/types'],
		subpaths: ['./ios', './android'],
	},
	macos: {
		jsxImportSource: 'octane',
		moduleSuffixes: ['.macos', ''],
		customConditions: ['macos'],
		types: [],
		subpaths: ['./macos'],
	},
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/sheet')
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

	writeFileSync(join(consumerRoot, 'consumer.tsx'), consumers[target])
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
					jsx: 'react-jsx',
					jsxImportSource: config.jsxImportSource,
					moduleSuffixes: config.moduleSuffixes,
					customConditions: config.customConditions,
					types: config.types.filter((name) => {
						const segments = name.split('/')
						const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
						return existsSync(join(modules, ...pkg, 'package.json'))
					}),
					skipLibCheck: true,
				},
				files: ['consumer.tsx', ...Object.keys(extraFiles)],
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
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
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
		const stylesheet = exportsMap['./web/styles.css']
		assert.equal(typeof stylesheet, 'string', `export map ${index} exposes the web stylesheet`)
		assert(
			existsSync(join(packedRoot, stylesheet.replace(/^\.\//, ''))),
			`export map ${index} stylesheet is present in the packed package`,
		)
	}

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
				{
					name: 'nodenext',
					module: 'nodenext',
					moduleResolution: 'nodenext',
				},
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log('sheet packed consumer: exports typecheck in Bundler and NodeNext modes')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
