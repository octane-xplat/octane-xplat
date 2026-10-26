/** Packed macOS-target acceptance, outside the workspace with no source
 * aliases. Requires built UI/workshop artifacts and a darwin/arm64 host.
 * Packs real tarballs, installs an external consumer, proves static
 * packaging/type/export lanes and production exclusion, then drives the
 * actual AppKit/JavaScriptCore host offscreen through the maintained
 * stdin automation journey in apps/workshop-demo/scripts/e2e-macos.ts.
 * Interaction there is recognizer-action dispatch — not OS-synthesized
 * input; screen-reader and IME remain separate qualification gates. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-workshop-packed-macos-')))
const consumer = join(work, 'consumer')
const pack = join(work, 'pack')
mkdirSync(consumer)
mkdirSync(pack)
let succeeded = false
const onDarwinArm64 = process.platform === 'darwin' && process.arch === 'arm64'
function run(command, args, cwd = consumer, options = {}) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
		...options,
	})

	assert.equal(
		result.status,
		0,
		`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
	)

	return result.stdout
}

function write(name, content) {
	writeFileSync(join(consumer, name), content)
}

try {
	const tarballs = {}
	for (const dir of ['create', 'cli', 'lib', 'ui', 'workshop', 'macos-renderer', 'css-engine']) {
		const root = join(repo, 'packages', dir)
		const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
		run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', pack], root)
		tarballs[manifest.name] =
			`file:${join(pack, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
	}

	write(
		'package.json',
		JSON.stringify(
			{
				name: 'workshop-packed-macos-acceptance',
				private: true,
				type: 'module',
				dependencies: { '@octane-xplat/ui': tarballs['@octane-xplat/ui'], octane: '0.14.0' },
				devDependencies: {
					'@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
					'@octane-xplat/cli': tarballs['@octane-xplat/cli'],
					'@octanejs/vite-plugin': '0.1.61',
					'@octane-xplat/macos-renderer': tarballs['@octane-xplat/macos-renderer'],
					'@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
					'@tsrx/oxc': '0.20.0',
					'@tsrx/core': '0.2.4',
					typescript: '5.9.3',
					vite: '8.3.0',
				},
			},
			null,
			2,
		),
	)

	write(
		'pnpm-workspace.yaml',
		`packages: []\noverrides:\n${Object.entries(tarballs)
			.map(([name, path]) => `  '${name}': '${path}'`)
			.join('\n')}\n`,
	)

	run('pnpm', ['install', '--ignore-scripts'])
	for (const name of ['ui', 'workshop', 'cli', 'macos-renderer']) {
		assert.ok(
			realpathSync(join(consumer, 'node_modules/@octane-xplat', name)).startsWith(work),
			`${name} must come from a tarball`,
		)
	}

	console.log(
		'PASS packed install resolves every @octane-xplat dependency from tarballs, no monorepo aliases',
	)

	// The consumer's real patch flow: `xplat patches apply` copies the
	// canonical set into the app and registers patchedDependencies; a second
	// install applies them. The macOS universal runtime needs the octane
	// patch (renderer-owned Children lives there).
	run('pnpm', ['exec', 'xplat', 'patches', 'apply'])
	run('pnpm', ['install', '--ignore-scripts'])
	const req = createRequire(join(consumer, 'package.json'))
	assert.match(
		realpathSync(req.resolve('octane')),
		/patch_hash/,
		'consumer octane must be the patched instance',
	)

	assert.match(
		readFileSync(req.resolve('octane/universal/native'), 'utf8'),
		/\bChildren\b/,
		'patched universal/native must carry renderer-owned Children',
	)

	console.log('PASS xplat patches apply registers the octane patch and reinstall applies it')

	const initialized = run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	assert.match(initialized, /created workshop.config.ts/)
	const config = readFileSync(join(consumer, 'workshop.config.ts'), 'utf8')
	run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	assert.equal(readFileSync(join(consumer, 'workshop.config.ts'), 'utf8'), config)

	const doctor = run('pnpm', ['exec', 'xplat', 'workshop', 'doctor', '--json'])
	const report = JSON.parse(doctor.slice(doctor.indexOf('{')))
	assert.equal(Object.keys(report.targets).length, 6)
	const macos = report.targets.macos
	assert.ok(macos, 'doctor reports a macos row')
	if (onDarwinArm64) {
		assert.equal(
			macos.status,
			'available',
			`macos must be available on darwin/arm64: ${JSON.stringify(macos)}`,
		)
	} else {
		assert.equal(macos.status, 'unsupported-host')
	}

	assert.notEqual(report.targets.windows.status, 'available')
	console.log(
		`PASS packed doctor macos row: ${macos.status} on ${process.platform}/${process.arch}`,
	)

	// The maintained acceptance catalog, without the init example.
	rmSync(join(consumer, 'src/workshop'), { recursive: true })
	cpSync(join(repo, 'apps/workshop-demo/src'), join(consumer, 'src'), { recursive: true })

	const list = run('pnpm', ['exec', 'xplat', 'workshop', 'list', '--target', 'macos', '--json'])
	const entries = JSON.parse(list.slice(list.indexOf('{'))).entries
	const byId = new Map(entries.map((e) => [e.id, e]))
	assert.equal(byId.get('counter/basic')?.applicable, true)
	assert.equal(
		byId.get('isolation/resources')?.applicable,
		true,
		'macos leaf of the merged id must apply',
	)

	assert.equal(byId.get('inputs/editable')?.applicable, false)
	assert.equal(byId.get('platform/ios-only')?.applicable, false)
	assert.equal(byId.get('platform/linux-host')?.applicable, false)
	const ids = entries.map((e) => e.id)
	assert.equal(new Set(ids).size, ids.length, 'catalog emits one row per id across disjoint leaves')
	console.log(
		'PASS packed macos catalog: merged disjoint leaves apply, foreign leaves stay listed with reasons',
	)

	// Export lanes: the packed `./macos` entry resolves to shipped source; the
	// package map must not leak unlisted subpaths.
	const macosEntry = req.resolve('@octane-xplat/workshop/macos')
	assert.match(
		macosEntry,
		/node_modules[\\/]@octane-xplat[\\/]workshop[\\/]src[\\/]macos[\\/]index\.macos\.ts$/,
	)

	assert.equal(realpathSync(macosEntry).startsWith(work), true)
	assert.throws(
		() => req.resolve('@octane-xplat/workshop/macos/stage.macos'),
		/not exported|ERR_PACKAGE_PATH_NOT_EXPORTED/,
	)

	assert.throws(
		() => req.resolve('@octane-xplat/workshop/nope'),
		/not exported|ERR_PACKAGE_PATH_NOT_EXPORTED/,
	)

	console.log('PASS packed export lanes: ./macos source entry resolves; unlisted subpaths rejected')

	// Type lanes: the contract types compile against the packed package, the
	// ./macos entry typechecks through its source types, and a bogus import
	// from that entry fails.
	write(
		'typing.contract.ts',
		readFileSync(join(repo, 'packages/workshop/tests/typing.contract.ts'), 'utf8').replace(
			"'../src/contract'",
			"'@octane-xplat/workshop'",
		),
	)

	write(
		'macos-entry.ts',
		`import { createMacOSStageHost, MacOSWorkshopController } from '@octane-xplat/workshop/macos'
void createMacOSStageHost
void MacOSWorkshopController
`,
	)

	write(
		'tsconfig.json',
		JSON.stringify({
			compilerOptions: {
				strict: true,
				noEmit: true,
				module: 'ESNext',
				moduleResolution: 'Bundler',
				target: 'ES2022',
				skipLibCheck: true,
				allowImportingTsExtensions: true,
				types: [],
			},
			files: ['typing.contract.ts', 'macos-entry.ts'],
		}),
	)

	run('pnpm', ['exec', 'tsc', '--noEmit'])

	write(
		'tsconfig.json',
		JSON.stringify({
			compilerOptions: {
				strict: true,
				noEmit: true,
				module: 'ESNext',
				moduleResolution: 'Bundler',
				target: 'ES2022',
				skipLibCheck: true,
				allowImportingTsExtensions: true,
				types: [],
			},
			files: ['typing.negative.ts'],
		}),
	)

	write(
		'typing.negative.ts',
		`import { NoSuchWorkshopExport } from '@octane-xplat/workshop/macos'
void NoSuchWorkshopExport
`,
	)

	const negative = spawnSync('pnpm', ['exec', 'tsc', '--noEmit'], {
		shell: process.platform === 'win32',
		cwd: consumer,
		encoding: 'utf8',
	})

	assert.notEqual(negative.status, 0, 'a bogus ./macos import must fail typecheck')
	assert.match(negative.stdout + negative.stderr, /NoSuchWorkshopExport/)
	console.log(
		'PASS packed type lanes: contract + ./macos entry typecheck; bogus ./macos import rejected',
	)

	// One matching Octane runtime across consumer, compiler, workshop and the
	// packed renderer — a second copy would break the story bundle's ABI.
	for (const specifier of ['@octane-xplat/workshop', '@octane-xplat/ui', '@octanejs/vite-plugin']) {
		assert.equal(
			realpathSync(createRequire(req.resolve(specifier)).resolve('octane')),
			realpathSync(req.resolve('octane')),
		)
	}

	assert.equal(
		realpathSync(
			createRequire(req.resolve('@octane-xplat/workshop')).resolve('@octane-xplat/macos-renderer'),
		),
		realpathSync(req.resolve('@octane-xplat/macos-renderer')),
	)

	console.log(
		'PASS one matching Octane runtime and macos-renderer across consumer, compiler and workshop',
	)

	// An ordinary production AppKit bundle built through the consumer's own
	// xplatMacOS pipeline excludes stories, fixture data and workshop tooling.
	write(
		'src/main.ts',
		`import '@nativescript/macos-node-api'
import { WorkshopCounter } from './counter.tsrx'
const marker = 'production-only'
void WorkshopCounter
void marker
export default marker
`,
	)

	write(
		'prod-build.mjs',
		`import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
import { build } from 'vite'
const root = ${JSON.stringify(consumer)}
const settings = await xplatMacOS('production', { root, packaged: true, entry: 'src/main.ts' })
await build({ ...settings, configFile: false })
`,
	)

	run('pnpm', ['exec', 'node', 'prod-build.mjs'], consumer, { timeout: 120_000 })
	const files = (dir) =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
		)

	const built = files(join(consumer, 'dist'))
		.map((file) => readFileSync(file, 'utf8'))
		.join('\n')

	assert.match(built, /production-only/)
	assert.doesNotMatch(
		built,
		/__xplatWorkshop|xplatWorkshop|AsyncAccount|counter\/basic|Isolation and overlay|storybook/,
	)

	console.log(
		'PASS packed macOS production bundle compiles through xplatMacOS and excludes workshop tooling',
	)

	if (!onDarwinArm64) {
		console.log(
			`SKIP real AppKit host journey — requires darwin/arm64, this is ${process.platform}/${process.arch}`,
		)

		succeeded = true
	} else {
		// The maintained AppKit journey spawns the consumer's own
		// `xplat workshop dev --target macos` offscreen and drives the stdin
		// automation protocol end to end.
		const journey = run(
			process.execPath,
			[join(repo, 'apps/workshop-demo/scripts/e2e-macos.ts'), consumer],
			consumer,
			{ timeout: 420_000 },
		)

		process.stdout.write(journey)
		const warm = /warm edit→ready latency: (\d+)ms/.exec(journey)
		assert.ok(warm, 'the macos journey must report a measured warm-edit latency')
		console.log(
			`PASS packed AppKit/JSC journey; measured warm edit→ready ${warm[1]}ms (proposed native goal ≤5000ms)`,
		)

		console.log(
			`QUALIFIED macos AppKit/JSC offscreen, darwin/${process.arch}, Node ${process.version} — OS-synthesized input, screen-reader and IME remain explicit gates`,
		)

		succeeded = true
	}
} finally {
	// Keep failure artifacts for diagnosis; successful fixtures are owned and temporary.
	if (succeeded) {
		rmSync(work, { recursive: true, force: true })
	}
}
