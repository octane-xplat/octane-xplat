import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
	createFingerprintAsync,
	createProjectHashAsync,
	diffFingerprints,
	diffFingerprintChangesAsync,
} from '../src/index.ts'
async function fixture(t) {
	const root = await mkdtemp(join(tmpdir(), 'xplat-fingerprint-'))
	t.after(() => rm(root, { recursive: true, force: true }))
	const write = async (path, value) => {
		const file = join(root, path)
		await mkdir(dirname(file), { recursive: true })
		await writeFile(file, typeof value === 'string' ? value : JSON.stringify(value))
		return file
	}
	await write('package.json', {
		name: 'app',
		version: '1.0.0',
		nativescript: { id: 'test.app' },
		dependencies: { '@xplat/native-fixture': 'workspace:*', 'pure-js': '1.0.0' },
	})
	await write(
		'pnpm-lock.yaml',
		'lockfileVersion: 9.0\nimporters:\n  .: {}\n  packages/native: {}\npackages:\n  pure-js@1.0.0:\n    resolution: {integrity: pure-js-public-test}\n',
	)
	await write('App_Resources/iOS/build.xcconfig', 'IPHONEOS_DEPLOYMENT_TARGET=13')
	await write('App_Resources/Android/app.gradle', 'android {}')
	await write('packages/native/package.json', {
		name: '@xplat/native-fixture',
		version: '1.0.0',
		nativescript: { platforms: { ios: '9.1', android: '9.1' } },
	})
	await write('packages/native/platforms/ios/src/Thing.swift', 'func thing() {}')
	await write('packages/native/platforms/android/java/Thing.java', 'class Thing {}')
	await write('packages/native/index.d.ts', 'export declare function thing(): void')
	await write('node_modules/pure-js/package.json', { name: 'pure-js', version: '1.0.0' })
	await write('node_modules/pure-js/index.js', 'export const message = 1')
	await mkdir(join(root, 'node_modules/@xplat'), { recursive: true })
	await symlink(
		join(root, 'packages/native'),
		join(root, 'node_modules/@xplat/native-fixture'),
		'dir',
	)
	return { root, write }
}
test('stable across checkout roots, input ordering and JS-only edits', async (t) => {
	const a = await fixture(t),
		b = await fixture(t)
	const one = await createFingerprintAsync(a.root),
		two = await createFingerprintAsync(b.root, { platforms: ['android', 'ios'] })
	assert.deepEqual(one, two)
	await a.write('src/view.ts', 'export const title = 2')
	await a.write('node_modules/pure-js/index.js', 'export const message = 9')
	await a.write(
		'pnpm-lock.yaml',
		(await readFile(join(a.root, 'pnpm-lock.yaml'), 'utf8')).replace(
			'pure-js-public-test',
			'changed-js-integrity',
		),
	)
	assert.deepEqual(await createFingerprintAsync(a.root), one)
	assert.equal(await createProjectHashAsync(a.root), one.hash)
	assert.equal(/^[0-9a-f]{64}$/.test(one.hash), true)
})
test('native files, resources, metadata, bootstrap and toolchain invalidate; per-platform selection is explicit', async (t) => {
	const f = await fixture(t),
		base = await createFingerprintAsync(f.root, { platforms: ['ios'] })
	await f.write('packages/native/platforms/android/java/Thing.java', 'class ChangedAndroid {}')
	assert.deepEqual(await createFingerprintAsync(f.root, { platforms: ['ios'] }), base)
	await f.write('packages/native/platforms/ios/src/Thing.swift', 'func changed() {}')
	const next = await createFingerprintAsync(f.root, { platforms: ['ios'] })
	assert.notEqual(next.hash, base.hash)
	assert.equal(diffFingerprints(base, next)[0].op, 'changed')
	assert.deepEqual(
		await diffFingerprintChangesAsync(base, f.root, { platforms: ['ios'] }),
		diffFingerprints(base, next),
	)
	for (const [path, text] of [
		['packages/native/index.d.ts', 'export declare function next(): void'],
		['packages/native/native/boot.m', 'static int boot = 2;'],
		['App_Resources/iOS/build.xcconfig', 'IPHONEOS_DEPLOYMENT_TARGET=16'],
	]) {
		const previous = await createProjectHashAsync(f.root)
		await f.write(path, text)
		assert.notEqual(await createProjectHashAsync(f.root), previous, path)
	}
	assert.notEqual(
		await createProjectHashAsync(f.root, { toolchain: { sdk: '1' } }),
		await createProjectHashAsync(f.root, { toolchain: { sdk: '2' } }),
	)
})
test('contents are hashed without exposing values; configured extras and ignores have concrete records', async (t) => {
	const f = await fixture(t),
		extra = {
			type: 'contents',
			id: 'declared-build-input',
			contents: 'private-fixture-input',
			reasons: ['extra'],
		}
	const result = await createFingerprintAsync(f.root, { extraSources: [extra] })
	assert.equal(JSON.stringify(result).includes(extra.contents), false)
	const ignored = await createFingerprintAsync(f.root, {
		extraSources: [extra],
		ignorePaths: ['declared-*'],
	})
	assert.equal(ignored.sources.find((s) => s.type === 'contents' && s.id === extra.id).hash, null)
	await f.write('fingerprint.config.json', { platforms: ['ios'], toolchain: { sdk: 'fixed' } })
	assert.deepEqual(
		await createFingerprintAsync(f.root),
		await createFingerprintAsync(f.root, { platforms: ['ios'], toolchain: { sdk: 'fixed' } }),
	)
	await assert.rejects(
		createFingerprintAsync(f.root, { ignorePaths: ['**/*.swift'] }),
		/Cannot ignore automatic native input/,
	)
})
test('missing native metadata, malformed options and escaping symlinks fail closed', async (t) => {
	const f = await fixture(t)
	await assert.rejects(createFingerprintAsync(f.root, { platforms: [] }), /platforms/)
	await assert.rejects(createFingerprintAsync(f.root, { hashAlgorithm: 'sha1' }), /SHA-256/)
	await f.write('fingerprint.config.js', 'throw new Error("must never execute")')
	await assert.rejects(createFingerprintAsync(f.root), /data-only/)
	await rm(join(f.root, 'fingerprint.config.js'))
	const external = await fixture(t)
	await symlink(join(external.root, 'package.json'), join(f.root, 'App_Resources/iOS/outside.json'))
	await assert.rejects(createFingerprintAsync(f.root), /escapes/)
	await rm(join(f.root, 'App_Resources/iOS/outside.json'))
	await rm(join(f.root, 'pnpm-lock.yaml'))
	await assert.rejects(createFingerprintAsync(f.root), /lockfile/)
})

test('pnpm patch digests and paths stay distinct; generated UI declarations do not change native identity', async (t) => {
	const f = await fixture(t)
	const lock = await readFile(join(f.root, 'pnpm-lock.yaml'), 'utf8')
	await f.write(
		'pnpm-lock.yaml',
		lock + 'patchedDependencies:\n  "@xplat/native-fixture@1.0.0": public-locked-patch-hash\n',
	)
	await f.write(
		'pnpm-workspace.yaml',
		'patchedDependencies:\n  "@xplat/native-fixture@1.0.0": patches/native.patch\n',
	)
	await f.write('patches/native.patch', 'public native patch one')
	const first = await createFingerprintAsync(f.root)
	await f.write(
		'packages/native/types/generated/props.d.ts',
		'export type JSOnlyProps = {text: string}',
	)
	assert.deepEqual(await createFingerprintAsync(f.root), first)
	await f.write('patches/native.patch', 'public native patch two')
	assert.notEqual(await createProjectHashAsync(f.root), first.hash)
})

test('NativeScript compatibility flags alone do not turn pure JS wrappers into native inputs', async (t) => {
	const f = await fixture(t)
	const wrapper = { name: 'pure-js', version: '1.0.0', nativescript: { platforms: { ios: '9.1' } } }
	await f.write('node_modules/pure-js/package.json', wrapper)
	await f.write('node_modules/pure-js/index.d.ts', 'export declare const uiText: string')
	const first = await createFingerprintAsync(f.root)
	await f.write('node_modules/pure-js/index.d.ts', 'export declare const uiText: number')
	await f.write('node_modules/pure-js/package.json', { ...wrapper, version: '2.0.0' })
	assert.deepEqual(await createFingerprintAsync(f.root), first)
})

test('evaluates native config per call, hashes custom resources and declared NativeSource, and hides resolved values', async (t) => {
	const f = await fixture(t)
	await f.write(
		'nativescript.config.ts',
		`export default { id: process.env.XPLAT_FINGERPRINT_TEST_ID ?? 'app.one', appResourcesPath: 'Custom_Resources', ios: {NativeSource:[{name:'Bridge',path:'bridges/**/*.swift'}]} }`,
	)
	await f.write('Custom_Resources/iOS/Info.plist', 'native custom resource')
	await f.write('bridges/Bridge.swift', 'func bridge() {}')
	const first = await createFingerprintAsync(f.root, { platforms: ['ios'] })
	assert.equal(
		first.sources.some((s) => s.type === 'file' && s.filePath === 'App_Resources/iOS/Info.plist'),
		true,
	)
	assert.equal(
		first.sources.some(
			(s) => s.type === 'file' && s.filePath === 'native-source/ios/Bridge/Bridge.swift',
		),
		true,
	)
	process.env.XPLAT_FINGERPRINT_TEST_ID = 'app.two'
	try {
		assert.notEqual(await createProjectHashAsync(f.root, { platforms: ['ios'] }), first.hash)
	} finally {
		delete process.env.XPLAT_FINGERPRINT_TEST_ID
	}
	await f.write('bridges/Bridge.swift', 'func changedBridge() {}')
	assert.notEqual(await createProjectHashAsync(f.root, { platforms: ['ios'] }), first.hash)
	assert.equal(JSON.stringify(first).includes('app.one'), false)
})

test('directory lock resolutions match installed files without hashing checkout paths', async (t) => {
	const a = await fixture(t),
		b = await fixture(t)
	for (const f of [a, b]) {
		await f.write(
			'pnpm-lock.yaml',
			`lockfileVersion: 9.0\nimporters: {.: {}}\npackages:\n  '@xplat/native-fixture@file:${join(f.root, 'packages/native')}':\n    resolution: {type: directory, directory: '${join(f.root, 'packages/native')}'}\n`,
		)
	}
	assert.deepEqual(await createFingerprintAsync(a.root), await createFingerprintAsync(b.root))
})

test('native dependency resolutions change identity while derived Swift metadata and pin order do not', async (t) => {
	const f = await fixture(t)
	const file = 'platforms/ios/App.xcworkspace/xcshareddata/swiftpm/Package.resolved'
	const pin = (identity, revision) => ({
		identity,
		location: 'https://example.test/' + identity,
		state: { revision, version: '1.0.0' },
	})
	await f.write(file, {
		version: 3,
		originHash: 'derived-one',
		pins: [pin('z', '1'), pin('a', '2')],
	})
	const first = await createProjectHashAsync(f.root, { platforms: ['ios'] })
	await f.write(file, {
		version: 3,
		originHash: 'derived-two',
		pins: [pin('a', '2'), pin('z', '1')],
	})
	assert.equal(await createProjectHashAsync(f.root, { platforms: ['ios'] }), first)
	await f.write(file, { version: 3, pins: [pin('a', '3'), pin('z', '1')] })
	assert.notEqual(await createProjectHashAsync(f.root, { platforms: ['ios'] }), first)
	await f.write(file, { version: 3, pins: [pin('a', '3'), pin('a', '1')] })
	await assert.rejects(
		createFingerprintAsync(f.root, { platforms: ['ios'] }),
		/Ambiguous native Swift/,
	)
	await rm(join(f.root, file))
	await f.write('platforms/android/gradle.lockfile', 'native:engine:1.0=releaseRuntimeClasspath')
	const android = await createProjectHashAsync(f.root, { platforms: ['android'] })
	await f.write('platforms/android/gradle.lockfile', 'native:engine:2.0=releaseRuntimeClasspath')
	assert.notEqual(await createProjectHashAsync(f.root, { platforms: ['android'] }), android)
})

test('local CocoaPods sources are hashed without embedding checkout paths or derived Podfile checksum', async (t) => {
	const a = await fixture(t),
		b = await fixture(t)
	for (const f of [a, b]) {
		await f.write('local-pod/Bridge.swift', 'func bridge() {}')
		await f.write(
			'platforms/ios/Podfile.lock',
			`PODS: [Bridge (1.0)]\nEXTERNAL SOURCES:\n  Bridge:\n    :path: '${join(f.root, 'local-pod')}'\nPODFILE CHECKSUM: ${f.root}\n`,
		)
	}
	const first = await createFingerprintAsync(a.root, { platforms: ['ios'] })
	assert.deepEqual(await createFingerprintAsync(b.root, { platforms: ['ios'] }), first)
	await a.write('local-pod/Bridge.swift', 'func changed() {}')
	assert.notEqual(await createProjectHashAsync(a.root, { platforms: ['ios'] }), first.hash)
})

test('configuration helper modules evaluate freshly without mutating Node module caches', async (t) => {
	const f = await fixture(t)
	await f.write('nativescript.config.js', "module.exports = require('./native-settings.js')")
	await f.write(
		'native-settings.js',
		"module.exports = {id: process.env.XPLAT_FINGERPRINT_TEST_ID ?? 'app.one'}",
	)
	const first = await createProjectHashAsync(f.root)
	process.env.XPLAT_FINGERPRINT_TEST_ID = 'app.two'
	try {
		assert.notEqual(await createProjectHashAsync(f.root), first)
	} finally {
		delete process.env.XPLAT_FINGERPRINT_TEST_ID
	}
})

test('Bun locks fingerprint native resolutions and local patches while ignoring unrelated JS locks', async (t) => {
	const { root, write } = await fixture(t)
	const { rm } = await import('node:fs/promises')
	await rm(join(root, 'pnpm-lock.yaml'))
	const lock = {
		lockfileVersion: 3,
		workspaces: { '': {}, 'packages/native': { name: '@xplat/native-fixture', version: '1.0.0' } },
		packages: { 'pure-js': ['pure-js@1.0.0', '', {}, 'js-integrity'] },
	}
	await write('bun.lock', JSON.stringify(lock))
	const first = await createFingerprintAsync(root)
	lock.packages['pure-js'][3] = 'changed-js-integrity'
	await write('bun.lock', JSON.stringify(lock))
	assert.deepEqual(await createFingerprintAsync(root), first)
	const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	pkg.packageManager = 'bun@1.4.4'
	pkg.patchedDependencies = { '@xplat/native-fixture@1.0.0': 'patches/native.patch' }
	await write('package.json', pkg)
	await write('patches/native.patch', 'native patch one')
	const patched = await createFingerprintAsync(root)
	assert.notEqual(patched.hash, first.hash)
	await write('patches/native.patch', 'native patch two')
	assert.notEqual((await createFingerprintAsync(root)).hash, patched.hash)
})

test('Bun native archive resolutions hash integrity without checkout paths and reject version drift', async (t) => {
	const a = await fixture(t),
		b = await fixture(t)
	const { rm } = await import('node:fs/promises')
	for (const f of [a, b]) {
		await rm(join(f.root, 'pnpm-lock.yaml'))
		await f.write(
			'bun.lock',
			JSON.stringify({
				lockfileVersion: 3,
				workspaces: { '': {} },
				packages: {
					'@xplat/native-fixture': [
						'@xplat/native-fixture@' + join(f.root, 'native.tgz'),
						{},
						'sha512-native-one',
					],
				},
			}),
		)
	}
	const one = await createFingerprintAsync(a.root)
	assert.deepEqual(await createFingerprintAsync(b.root), one)
	await b.write(
		'bun.lock',
		JSON.stringify({
			packages: {
				'@xplat/native-fixture': [
					'@xplat/native-fixture@' + join(b.root, 'native.tgz'),
					{},
					'sha512-native-two',
				],
			},
		}),
	)
	assert.notEqual((await createFingerprintAsync(b.root)).hash, one.hash)
	await b.write(
		'bun.lock',
		JSON.stringify({
			packages: {
				'@xplat/native-fixture': ['@xplat/native-fixture@9.0.0', '', {}, 'sha512-native-one'],
			},
		}),
	)
	await assert.rejects(createFingerprintAsync(b.root), /disagrees with Bun lock metadata/)
})

test('retained lockfiles require an explicit manager and ignore the unselected lockfile', async (t) => {
	const { root, write } = await fixture(t)
	await write('bun.lock', {
		workspaces: { '': {}, 'packages/native': { name: '@xplat/native-fixture', version: '1.0.0' } },
		packages: {},
	})
	await assert.rejects(createFingerprintAsync(root), /Both Bun and pnpm lockfiles/)
	const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	await write('package.json', { ...pkg, packageManager: 'bun@1.4.4' })
	await write('pnpm-lock.yaml', 'invalid: [')
	await createFingerprintAsync(root)
	await write('package.json', { ...pkg, packageManager: 'pnpm@11.24.0' })
	await write('pnpm-lock.yaml', { importers: { '.': {}, 'packages/native': {} }, packages: {} })
	await write('bun.lock', 'invalid JSON')
	await createFingerprintAsync(root)
})
