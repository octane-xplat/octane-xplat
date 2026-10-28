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
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-media-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd, env = process.env) {
	const result = spawnSync(command, args, {
		cwd,
		env,
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
	})

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
	'@nativescript/camera',
	'@nativescript/imagepicker',
	'@nativescript/core',
	'@nativescript/types',
	'@octane-xplat/platform',
	'@octane-xplat/lib',
	'octane',
]

const consumers = {
	web: `import { media } from '@octane-xplat/media'
const picked: Promise<import('@octane-xplat/media').PickedImage | null> = media.pickImage()
const ensureResult = media.requestPermissions('camera')
const captured = media.capturePhoto({ saveToGallery: true })
void picked
void ensureResult
void captured
`,
	native: `import { media } from '@octane-xplat/media'
const picked: Promise<import('@octane-xplat/media').PickedImage | null> = media.pickImage()
const ensureResult = media.requestPermissions('camera')
const captured = media.capturePhoto({ saveToGallery: true })
void picked
void ensureResult
void captured
`,
	macos: `import { media } from '@octane-xplat/media'
const picked: Promise<import('@octane-xplat/media').PickedImage | null> = media.pickImage()
const multiple: Promise<import('@octane-xplat/media').PickedImage[]> = media.pickImages()
const ensureResult = media.requestPermissions('camera')
const captured = media.capturePhoto({ saveToGallery: true })
void picked
void multiple
void ensureResult
void captured
`,
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
	const packageLink = join(modules, '@octane-xplat/media')
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
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log('media packed consumer: exports typecheck in Bundler mode')

	// The macOS object driver resolves non-relative imports (e.g.
	// '@octane-xplat/lib/capability') from the packed package root — put the
	// workspace dep in scope the way an installed consumer would have it.
	const driverDeps = join(extractedRoot, 'node_modules', '@octane-xplat')
	mkdirSync(driverDeps, { recursive: true })
	symlinkSync(join(repoRoot, 'packages/lib'), join(driverDeps, 'lib'), 'dir')

	// Exercise the packed public macOS entries, including the preview owner's release API.
	const filesPack = join(temporary, 'files-pack')
	const filesExtracted = join(temporary, 'files-extracted')
	mkdirSync(filesPack)
	mkdirSync(filesExtracted)
	run('pnpm', ['pack', '--pack-destination', filesPack], join(repoRoot, 'packages/files'))
	const filesTarballs = readdirSync(filesPack).filter((name) => name.endsWith('.tgz'))
	assert.equal(filesTarballs.length, 1)
	run('tar', ['-xzf', join(filesPack, filesTarballs[0]), '-C', filesExtracted], temporary)
	run(process.execPath, ['--test', join(packageRoot, 'tests/macos-picker.test.mjs')], repoRoot, {
		...process.env,
		XPLAT_MEDIA_TEST_PACKAGE: packedRoot,
		XPLAT_FILES_TEST_PACKAGE: join(filesExtracted, 'package'),
	})

	console.log('media packed consumer: macOS selection/release object-driver checks passed')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
