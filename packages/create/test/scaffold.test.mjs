import assert from 'node:assert/strict'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { managedSpecifier } from '../dist/compatibility.js'

// Dep values must track the template, not a pinned snapshot — releases bump
// template/package.json in lockstep.
const TPL = JSON.parse(readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf8'))
import {
	composeTargets,
	applyTarget,
	resolveTargets,
	targetEnabled,
	TEMPLATE_DIR,
	applyTesting,
	testingEnabled,
} from '../dist/scaffold.js'

const ALL = ['web', 'ios', 'android']

test('published scaffold entry resolves to a built file', () => {
	const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
	for (const target of Object.values(manifest.publishConfig.exports)) {
		const entry = typeof target === 'string' ? target : target.default
		assert.ok(
			existsSync(new URL(`../${entry}`, import.meta.url)),
			`missing published entry: ${entry}`,
		)
	}
})

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-scaffold-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

test('composing the full base target set reproduces the template byte-for-byte', (t) => {
	const dir = project(t)
	composeTargets(ALL, dir, { testing: false })

	for (const rel of [
		'package.json',
		'pnpm-workspace.yaml',
		'tsconfig.json',
		'vite.config.ts',
		'nativescript.config.ts',
	]) {
		assert.equal(
			readFileSync(join(dir, rel), 'utf8'),
			readFileSync(join(TEMPLATE_DIR, rel), 'utf8'),
			`${rel} differs from template`,
		)
	}
})

test('web-only scaffold drops patch entries for packages it never installs', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir)

	const yaml = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(yaml, /octane@0\.11\.0:/)
	assert.match(yaml, /@tsrx\/typescript-plugin@0\.4\.11/)
	assert.match(yaml, /configDependencies:[\s\S]*@octane-xplat\/patches/)
	assert.doesNotMatch(yaml, /@nativescript\/core@9\.1\.3/)
	assert.doesNotMatch(yaml, /@nativescript\/vite@8\.0\.17/)

	const native = project(t)
	composeTargets(['ios'], native)
	const nativeYaml = readFileSync(join(native, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(nativeYaml, /@nativescript\/core@9\.1\.3/)
})

test('every target-owned file exists in the template', async () => {
	const { targets } = await import('../dist/scaffold.js')
	for (const [id, target] of Object.entries(targets)) {
		for (const rel of target.files) {
			assert.ok(existsSync(join(TEMPLATE_DIR, rel)), `${id} claims missing file ${rel}`)
		}
	}
})

test('web-only scaffold drops native files, deps, and scripts', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir)

	assert.ok(existsSync(join(dir, 'index.html')))
	assert.ok(existsSync(join(dir, 'src/main.web.tsrx')))
	assert.ok(!existsSync(join(dir, 'nativescript.config.ts')))
	assert.ok(!existsSync(join(dir, 'src/main.ts')))
	assert.ok(!existsSync(join(dir, 'App_Resources')))

	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.main, undefined)
	assert.equal(manifest.scripts.dev, 'vite')
	assert.equal(manifest.scripts['dev:ios'], undefined)
	assert.equal(manifest.scripts.typecheck, 'xplat typecheck')
	assert.equal(manifest.scripts.lint, 'xplat lint')
	assert.equal(manifest.scripts['lint:fix'], 'xplat lint --fix')
	assert.equal(manifest.devDependencies.oxlint, undefined)
	assert.equal(manifest.devDependencies['@octane-xplat/lint'], undefined)
	assert.ok(!('dependencies' in manifest && '@nativescript/core' in manifest.dependencies))
	assert.equal(manifest.devDependencies['@nativescript/ios'], undefined)
	assert.equal(
		manifest.devDependencies['@octanejs/vite-plugin'],
		TPL.devDependencies['@octanejs/vite-plugin'],
	)

	// Web testing is included without the native runner, specs or scripts.
	assert.ok(!existsSync(join(dir, 'vitest.config.mts')))
	assert.ok(!existsSync(join(dir, 'src', 'test.ts')))
	assert.equal(manifest.scripts['test:ios'], undefined)
	assert.equal(manifest.devDependencies.vitest, 'catalog:xplat')
	assert.equal(manifest.devDependencies.jsdom, 'catalog:xplat')
	assert.equal(manifest.scripts['test:web'], 'vitest run --config vitest.web.config.mts')
	assert.ok(existsSync(join(dir, 'src/app.web.test.tsx')))
	assert.equal(manifest.devDependencies['@nativescript/unit-test-runner'], undefined)

	assert.equal(manifest.dependencies['@octane-xplat/ui'], TPL.dependencies['@octane-xplat/ui'])
})

test('ios-only scaffold carries shared native machinery but not android', (t) => {
	const dir = project(t)
	composeTargets(['ios'], dir)

	assert.ok(existsSync(join(dir, 'nativescript.config.ts')))
	assert.ok(existsSync(join(dir, 'App_Resources/iOS/Info.plist')))
	assert.ok(!existsSync(join(dir, 'App_Resources/Android')))
	assert.ok(!existsSync(join(dir, 'index.html')))

	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.scripts['dev:android'], undefined)
	assert.equal(manifest.scripts.typecheck, 'xplat typecheck')

	assert.equal(
		manifest.devDependencies['@nativescript/ios'],
		TPL.devDependencies['@nativescript/ios'],
	)

	assert.equal(manifest.devDependencies['@nativescript/android'], undefined)

	assert.ok(existsSync(join(dir, 'src', 'test.ts')))
	assert.ok(existsSync(join(dir, 'src', 'app.spec.tsrx')))
	assert.ok(existsSync(join(dir, 'vitest.config.mts')))
	assert.equal(manifest.scripts['test:ios'], 'ns test ios')
	assert.equal(manifest.scripts['test:android'], undefined)
	assert.equal(manifest.devDependencies.vitest, 'catalog:xplat')
	assert.equal(manifest.devDependencies['@nativescript/unit-test-runner'], 'catalog:xplat')
	assert.equal(manifest.devDependencies.jsdom, undefined)
})

test('resolveTargets expands requires and rejects unknown targets', () => {
	assert.deepEqual(resolveTargets(['ios']), ['native-shared', 'ios'])
	assert.deepEqual(resolveTargets(['ios', 'android']), ['native-shared', 'ios', 'android'])
	assert.throws(() => resolveTargets(['beos']), /unknown target "beos"/)
})

test('applyTarget adds a platform to a web-only app without clobbering edits', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir)

	// User modified an existing file and a script — both must survive.
	writeFileSync(join(dir, 'tsconfig.json'), '{ "custom": true }\n')
	const before = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	before.scripts.lint = 'custom-lint'
	writeFileSync(join(dir, 'package.json'), JSON.stringify(before, null, '\t') + '\n')

	const report = applyTarget(dir, 'ios')
	assert.deepEqual(report.enabled, ['native-shared', 'ios'])
	assert.ok(existsSync(join(dir, 'nativescript.config.ts')))
	assert.ok(existsSync(join(dir, 'App_Resources/iOS/Info.plist')))
	assert.ok(!existsSync(join(dir, 'App_Resources/Android')))
	// applyTarget patches the app tsconfig (native ambient root + entrypoint)
	// but preserves unrelated user keys.
	const tsconfig = JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8'))
	assert.equal(tsconfig.custom, true)
	assert.ok(tsconfig.files.includes('references.d.ts'))

	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.main, 'src/main.ts')
	assert.equal(manifest.scripts.lint, 'custom-lint')
	assert.equal(manifest.scripts['dev:ios'], 'ns run ios')
	assert.equal(manifest.scripts.typecheck, 'xplat typecheck')

	assert.equal(
		manifest.devDependencies['@nativescript/ios'],
		TPL.devDependencies['@nativescript/ios'],
	)

	assert.equal(manifest.dependencies['@nativescript/core'], TPL.dependencies['@nativescript/core'])

	// The web-only scaffold's yaml lacked native patch entries — add restores
	// them so the next `pnpm install` doesn't miss the framework patches.
	const yaml = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(yaml, /@nativescript\/core@9\.1\.3/)
	assert.ok(
		yaml.includes(
			`@nativescript-community/octane@${managedSpecifier('@nativescript-community/octane')}`,
		),
	)
	assert.ok(report.patchesAdded)
})

test('applyTarget is idempotent and detects already-enabled targets', (t) => {
	const dir = project(t)
	composeTargets(ALL, dir)

	const report = applyTarget(dir, 'ios')
	assert.deepEqual(report.enabled, [])
	assert.deepEqual(report.already, ['native-shared', 'ios'])

	const second = applyTarget(dir, 'web')
	assert.deepEqual(second.enabled, [])
	assert.deepEqual(second.already, ['web'])
})

test('targetEnabled reads sentinels', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir)
	assert.equal(targetEnabled(dir, 'web'), true)
	assert.equal(targetEnabled(dir, 'ios'), false)
	assert.equal(targetEnabled(dir, 'native-shared'), false)

	const native = mkdtempSync(join(tmpdir(), 'xplat-scaffold-'))
	t.after(() => rmSync(native, { recursive: true, force: true }))
	composeTargets(['ios'], native)
	assert.equal(targetEnabled(native, 'ios'), true)
	assert.equal(targetEnabled(native, 'web'), false)
})

test('default apps carry no unused feature plugins for any target set', (t) => {
	for (const ids of [['web'], ['ios'], ['android'], ALL]) {
		const dir = project(t)
		composeTargets(ids, dir)
		const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
		const deps = { ...pkg.dependencies, ...pkg.devDependencies }
		for (const name of [
			'@octane-xplat/effects',
			'@octane-xplat/image',
			'@nativescript-community/gesturehandler',
			'@nativescript-community/ui-drawer',
		]) {
			assert.equal(deps[name], undefined, `${ids}: unexpected ${name}`)
		}

		assert.equal(testingEnabled(dir), true)
	}
})

test('default testing includes only enabled platforms with framework-managed versions', (t) => {
	for (const ids of [['web'], ['ios'], ['android'], ALL]) {
		const dir = project(t)
		composeTargets(ids, dir)
		const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
		const web = ids.includes('web')
		const native = ids.includes('ios') || ids.includes('android')
		assert.equal(pkg.devDependencies.vitest, 'catalog:xplat')
		assert.equal(pkg.devDependencies.jsdom, web ? 'catalog:xplat' : undefined)
		assert.equal(
			pkg.devDependencies['@nativescript/unit-test-runner'],
			native ? 'catalog:xplat' : undefined,
		)

		assert.equal(Boolean(pkg.scripts['test:web']), web)
		assert.equal(Boolean(pkg.scripts['test:ios']), ids.includes('ios'))
		assert.equal(Boolean(pkg.scripts['test:android']), ids.includes('android'))
		assert.equal(existsSync(join(dir, 'src/app.web.test.tsx')), web)
		assert.equal(existsSync(join(dir, 'src/app.spec.tsrx')), native)
		assert.equal(existsSync(join(dir, 'vitest.config.mts')), native)
		assert.equal(testingEnabled(dir), true)
		assert.match(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), /vitest: 4/)
	}
})

test('adding testing keeps user scripts, dependency specs, and existing test files', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir, { testing: false })
	const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	pkg.scripts.test = 'custom-test'
	pkg.devDependencies.vitest = 'file:../vitest'
	writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n')
	writeFileSync(join(dir, 'src/app.web.test.tsx'), '// custom test\n')
	const report = applyTesting(dir)
	assert.ok(report.scriptsSkipped.includes('test'))
	assert.ok(report.skipped.includes('src/app.web.test.tsx'))
	assert.equal(readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8'), '// custom test\n')
	const next = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(next.scripts.test, 'custom-test')
	assert.equal(next.devDependencies.vitest, 'file:../vitest')
	assert.equal(next.scripts['test:web'], 'vitest run --config vitest.web.config.mts')
	assert.deepEqual(applyTesting(dir).already, ['testing'])
})

test('adding native or web includes its test setup and preserves existing tests', (t) => {
	const dir = project(t)
	composeTargets(['web'], dir)
	const before = readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8')
	applyTarget(dir, 'ios')
	let pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(pkg.scripts['test:ios'], 'ns test ios')
	assert.equal(pkg.scripts['test:android'], undefined)
	assert.equal(pkg.devDependencies['@nativescript/unit-test-runner'], 'catalog:xplat')
	assert.equal(readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8'), before)
	applyTarget(dir, 'android')
	pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(pkg.scripts['test:android'], 'ns test android')
	const native = project(t)
	composeTargets(['android'], native)
	applyTarget(native, 'web')
	pkg = JSON.parse(readFileSync(join(native, 'package.json'), 'utf8'))
	assert.equal(pkg.devDependencies.jsdom, 'catalog:xplat')
	assert.ok(existsSync(join(native, 'src/app.web.test.tsx')))
})

test('creator includes tests for the selected platforms by default through the published bin', (t) => {
	const root = project(t)
	const dir = join(root, 'app')
	const result = spawnSync(
		process.execPath,
		[
			fileURLToPath(new URL('../dist/index.js', import.meta.url)),
			dir,
			'--targets',
			'web',
			'--no-install',
		],
		{ encoding: 'utf8' },
	)
	assert.equal(result.status, 0, result.stderr)
	const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(pkg.xplat.features.testing, true)
	assert.ok(pkg.scripts['test:web'])
	assert.equal(pkg.devDependencies['@nativescript/unit-test-runner'], undefined)
})

test('testing reuses an mts Vite config and the enclosing workspace catalog', (t) => {
	const root = project(t)
	const dir = join(root, 'apps', 'example')
	mkdirSync(dir, { recursive: true })
	composeTargets(['web'], dir, { testing: false })
	renameSync(join(dir, 'vite.config.ts'), join(dir, 'vite.config.mts'))
	renameSync(join(dir, 'pnpm-workspace.yaml'), join(root, 'pnpm-workspace.yaml'))
	applyTesting(dir)
	assert.match(
		readFileSync(join(dir, 'vitest.web.config.mts'), 'utf8'),
		/from '\.\/vite\.config\.mts'/,
	)
	assert.ok(!existsSync(join(dir, 'pnpm-workspace.yaml')))
	assert.match(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'), /vitest: 4/)
	assert.match(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'), /jsdom: 30/)
})
