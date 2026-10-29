import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import prepare from '../prepare.cjs'
import { fileURLToPath } from 'node:url'

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-ota-prepare-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const write = (name, text) => {
		const file = join(root, name)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, text)
		return file
	}

	write('package.json', JSON.stringify({ name: 'native-prepare-fixture', version: '1.0.0' }))
	mkdirSync(join(root, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(
		fileURLToPath(new URL('../../fingerprint', import.meta.url)),
		join(root, 'node_modules/@octane-xplat/fingerprint'),
		'dir',
	)
	write('pnpm-lock.yaml', 'lockfileVersion: 9.0\nimporters: {.: {}}\npackages: {}\n')
	write('platforms/ios/Fixture/app/package.json', '{}')
	write('platforms/android/app/src/main/assets/app/package.json', '{}')
	return { root, write }
}

test('iOS wiring is idempotent and places recovery before runtime init', async (t) => {
	const f = fixture(t)
	const file = f.write(
		'platforms/ios/internal/main.m',
		'#import <Foundation/Foundation.h>\nint main() { NSString* baseDir = [[NSBundle mainBundle] resourcePath]; config.BaseDir = baseDir; }',
	)

	await prepare({
		projectDir: f.root,
		platform: 'ios',
		toolchain: { fixture: 'swift' },
		nativeConfig: {},
	})
	const first = readFileSync(file, 'utf8')
	const debug = JSON.parse(
		readFileSync(join(f.root, 'platforms/ios/Fixture/app/xplat-native.json'), 'utf8'),
	)
	assert.equal(debug.release, false)
	assert.match(debug.hash, /^[0-9a-f]{64}$/)
	await prepare({
		projectDir: f.root,
		platform: 'ios',
		toolchain: { fixture: 'swift' },
		nativeConfig: {},
	})
	assert.equal(readFileSync(file, 'utf8'), first)
	assert.equal(first.match(/baseDir = XplatOTABoot\(baseDir\)/g).length, 1)
	assert.ok(first.indexOf('baseDir = XplatOTABoot(baseDir)') < first.indexOf('config.BaseDir'))
	await prepare({
		projectDir: f.root,
		platform: 'ios',
		toolchain: { fixture: 'swift' },
		nativeConfig: {},
		release: true,
	})
	const release = JSON.parse(
		readFileSync(join(f.root, 'platforms/ios/Fixture/app/xplat-native.json'), 'utf8'),
	)
	assert.equal(release.release, true)
	assert.notEqual(release.hash, debug.hash)
	assert.deepEqual(Object.keys(release).sort(), ['format', 'hash', 'platform', 'release'])
	const record = JSON.parse(readFileSync(join(f.root, '.xplat/fingerprints/ios.json'), 'utf8'))
	assert.equal(record.hash, release.hash)
	assert.equal(record.toolchain.configuration, 'release')
	assert.equal(record.sources.length > 0, true)
})

test('Android wiring precedes initRuntime and refuses a custom application', async (t) => {
	const f = fixture(t)
	const manifest = f.write(
		'platforms/android/app/src/main/AndroidManifest.xml',
		'<application android:name="com.tns.NativeScriptApplication"/>',
	)

	const file = f.write(
		'platforms/android/app/src/main/java/com/tns/NativeScriptApplication.java',
		'class NativeScriptApplication { void onCreate() { com.tns.Runtime runtime = RuntimeHelper.initRuntime(this); } }',
	)

	await prepare({
		projectDir: f.root,
		platform: 'android',
		toolchain: { fixture: 'java' },
		nativeConfig: {},
	})
	const first = readFileSync(file, 'utf8')
	await prepare({
		projectDir: f.root,
		platform: 'android',
		toolchain: { fixture: 'java' },
		nativeConfig: {},
	})
	assert.equal(readFileSync(file, 'utf8'), first)
	assert.ok(first.indexOf('xplatOTABoot();') < first.indexOf('RuntimeHelper.initRuntime'))
	writeFileSync(manifest, '<application android:name="example.CustomApplication"/>')
	await assert.rejects(
		() =>
			prepare({
				projectDir: f.root,
				platform: 'android',
				toolchain: { fixture: 'java' },
				nativeConfig: {},
			}),
		/custom Android Application/,
	)
})

test('iOS refuses SwiftUI startup that bypasses main.m', async (t) => {
	const f = fixture(t)
	f.write('App_Resources/iOS/build.xcconfig', 'NS_SWIFTUI_BOOT = 1')
	await assert.rejects(
		() =>
			prepare({
				projectDir: f.root,
				platform: 'ios',
				toolchain: { fixture: 'swift' },
				nativeConfig: {},
			}),
		/SwiftUI boot/,
	)
})
