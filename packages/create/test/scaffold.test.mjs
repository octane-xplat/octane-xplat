import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

// Dep values must track the template, not a pinned snapshot — releases bump
// template/package.json in lockstep.
const TPL = JSON.parse(readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf8'))
import {
	composeTargets,
	applyTarget,
	resolveTargets,
	targetEnabled,
	TEMPLATE_DIR,
} from '../scaffold.mjs'

const ALL = ['web', 'ios', 'android']

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-scaffold-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

test('composing the full target set reproduces the template byte-for-byte', (t) => {
	const dir = project(t)
	composeTargets(ALL, dir)

	for (const rel of ['package.json', 'pnpm-workspace.yaml', 'tsconfig.json', 'vite.config.ts', 'nativescript.config.ts']) {
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
	assert.match(yaml, /octane@0\.6\.3:/)
	assert.match(yaml, /@tsrx\/typescript-plugin@0\.4\.11/)
	assert.match(yaml, /configDependencies:[\s\S]*@octane-xplat\/patches/)
	assert.doesNotMatch(yaml, /@nativescript\/core@9\.1\.2/)
	assert.doesNotMatch(yaml, /@nativescript\/vite@8\.0\.17/)

	const native = project(t)
	composeTargets(['ios'], native)
	const nativeYaml = readFileSync(join(native, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(nativeYaml, /@nativescript\/core@9\.1\.2/)
})

test('every target-owned file exists in the template', async () => {
	const { targets } = await import('../scaffold.mjs')
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
	assert.equal(manifest.scripts.typecheck, 'tsrx-tsc --noEmit')
	assert.ok(!('dependencies' in manifest && '@nativescript/core' in manifest.dependencies))
	assert.equal(manifest.devDependencies['@nativescript/ios'], undefined)
	assert.equal(manifest.devDependencies['@octanejs/vite-plugin'], TPL.devDependencies['@octanejs/vite-plugin'])
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
	assert.equal(
		manifest.scripts.typecheck,
		'tsrx-tsc --noEmit && tsrx-tsc --noEmit -p tsconfig.native.json',
	)

	assert.equal(manifest.devDependencies['@nativescript/ios'], TPL.devDependencies['@nativescript/ios'])
	assert.equal(manifest.devDependencies['@nativescript/android'], undefined)
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
	assert.equal(readFileSync(join(dir, 'tsconfig.json'), 'utf8'), '{ "custom": true }\n')

	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.main, 'src/main.ts')
	assert.equal(manifest.scripts.lint, 'custom-lint')
	assert.equal(manifest.scripts['dev:ios'], 'ns run ios')
	assert.equal(
		manifest.scripts.typecheck,
		'tsrx-tsc --noEmit && tsrx-tsc --noEmit -p tsconfig.native.json',
	)

	assert.equal(manifest.devDependencies['@nativescript/ios'], TPL.devDependencies['@nativescript/ios'])
	assert.equal(manifest.dependencies['@nativescript/core'], TPL.dependencies['@nativescript/core'])

	// The web-only scaffold's yaml lacked native patch entries — add restores
	// them so the next `pnpm install` doesn't miss the framework patches.
	const yaml = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(yaml, /@nativescript\/core@9\.1\.2/)
	assert.match(yaml, /@nativescript-community\/octane@0\.2\.4/)
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
