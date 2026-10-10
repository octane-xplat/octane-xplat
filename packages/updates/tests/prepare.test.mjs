import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import prepare from '../prepare.cjs'

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-ota-prepare-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const write = (name, text) => {
		const file = join(root, name)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, text)
		return file
	}

	return { root, write }
}

test('iOS wiring is idempotent and places recovery before runtime init', (t) => {
	const f = fixture(t)
	const file = f.write(
		'platforms/ios/internal/main.m',
		'#import <Foundation/Foundation.h>\nint main() { NSString* baseDir = [[NSBundle mainBundle] resourcePath]; config.BaseDir = baseDir; }',
	)

	prepare({ projectDir: f.root, platform: 'ios' })
	const first = readFileSync(file, 'utf8')
	prepare({ projectDir: f.root, platform: 'ios' })
	assert.equal(readFileSync(file, 'utf8'), first)
	assert.equal(first.match(/baseDir = XplatOTABoot\(baseDir\)/g).length, 1)
	assert.ok(first.indexOf('baseDir = XplatOTABoot(baseDir)') < first.indexOf('config.BaseDir'))
})

test('Android wiring precedes initRuntime and refuses a custom application', (t) => {
	const f = fixture(t)
	const manifest = f.write(
		'platforms/android/app/src/main/AndroidManifest.xml',
		'<application android:name="com.tns.NativeScriptApplication"/>',
	)

	const file = f.write(
		'platforms/android/app/src/main/java/com/tns/NativeScriptApplication.java',
		'class NativeScriptApplication { void onCreate() { com.tns.Runtime runtime = RuntimeHelper.initRuntime(this); } }',
	)

	prepare({ projectDir: f.root, platform: 'android' })
	const first = readFileSync(file, 'utf8')
	prepare({ projectDir: f.root, platform: 'android' })
	assert.equal(readFileSync(file, 'utf8'), first)
	assert.ok(first.indexOf('xplatOTABoot();') < first.indexOf('RuntimeHelper.initRuntime'))
	writeFileSync(manifest, '<application android:name="example.CustomApplication"/>')
	assert.throws(
		() => prepare({ projectDir: f.root, platform: 'android' }),
		/custom Android Application/,
	)
})

test('iOS refuses SwiftUI startup that bypasses main.m', (t) => {
	const f = fixture(t)
	f.write('App_Resources/iOS/build.xcconfig', 'NS_SWIFTUI_BOOT = 1')
	assert.throws(() => prepare({ projectDir: f.root, platform: 'ios' }), /SwiftUI boot/)
})
