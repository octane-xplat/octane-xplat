import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildMacOSNative, discoverMacOSNative, nativeLoader } from '../dist/macos/native.js'

function fixture(t) {
	const app = mkdtempSync(join(tmpdir(), 'xplat-native-test-'))
	t.after(() => rmSync(app, { recursive: true, force: true }))
	mkdirSync(join(app, 'node_modules'))
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({ name: 'app', dependencies: { leaf: '1.0.0' } }),
	)

	const leaf = join(app, 'node_modules/leaf')
	mkdirSync(join(leaf, 'platforms/macos/src'), { recursive: true })
	mkdirSync(join(leaf, 'platforms/macos/include'))
	writeFileSync(join(leaf, 'package.json'), JSON.stringify({ name: 'leaf', version: '1.0.0' }))
	writeFileSync(join(leaf, 'platforms/macos/src/probe.c'), 'int probe(void) { return 1; }')
	writeFileSync(join(leaf, 'platforms/macos/include/probe.h'), 'int probe(void);')
	return { app, leaf }
}

test('no native leaves keep shipped metadata without requiring a toolchain', async (t) => {
	const { app } = fixture(t)
	writeFileSync(join(app, 'package.json'), '{"name":"app"}')
	const result = await buildMacOSNative(app)
	assert.deepEqual(result.libraries, [])
	assert.match(result.metadata.arm64, /prebuilt.*metadata\.macos\.arm64\.nsmd$/)
	assert.match(result.metadata.x86_64, /prebuilt.*metadata\.macos\.x86_64\.nsmd$/)
})

test('schema, missing globs, and paths outside the native directory fail before compilation', (t) => {
	const { app, leaf } = fixture(t)
	for (const [config, message] of [
		[{ source: [] }, /unknown xplat.macos.source/],
		[{ sources: ['platforms/macos/src/missing.c'] }, /no files match/],
		[{ sources: ['../outside.c'] }, /package-relative paths/],
		[{ sources: ['package.json'] }, /inside platforms\/macos/],
		[{ frameworks: ['Foundation;echo'] }, /invalid system/],
	]) {
		writeFileSync(
			join(leaf, 'package.json'),
			JSON.stringify({ name: 'leaf', xplat: { macos: config } }),
		)

		assert.throws(() => discoverMacOSNative(app), message)
	}
})

test('native dependency discovery resolves npm packages that share a Node builtin name', (t) => {
	const { app, leaf } = fixture(t)
	writeFileSync(
		join(leaf, 'package.json'),
		JSON.stringify({ name: 'leaf', dependencies: { buffer: '6.0.3' } }),
	)

	const buffer = join(leaf, 'node_modules/buffer')
	mkdirSync(buffer, { recursive: true })
	writeFileSync(join(buffer, 'package.json'), JSON.stringify({ name: 'buffer', version: '6.0.3' }))

	assert.equal(discoverMacOSNative(app).leaves.length, 1)
})

test('escaping symlinks cannot smuggle undeclared external cache inputs', (t) => {
	const { app, leaf } = fixture(t)
	symlinkSync(join(app, 'package.json'), join(leaf, 'platforms/macos/external.json'))
	assert.throws(() => discoverMacOSNative(app), /escapes platforms\/macos/)
})

test('private headers and package configuration participate in invalidation', (t) => {
	const { app, leaf } = fixture(t)
	const original = discoverMacOSNative(app).fingerprint
	writeFileSync(join(leaf, 'platforms/macos/src/private.h'), '#define VALUE 2')
	const header = discoverMacOSNative(app).fingerprint
	assert.notEqual(header, original)
	writeFileSync(
		join(leaf, 'package.json'),
		JSON.stringify({ name: 'leaf', xplat: { macos: { defines: ['VALUE=3'] } } }),
	)

	assert.notEqual(discoverMacOSNative(app).fingerprint, header)
})

test('native dependency cycles fail with the owning leaf', (t) => {
	const { app, leaf } = fixture(t)
	writeFileSync(join(leaf, 'package.json'), '{"name":"leaf","dependencies":{"app":"1.0.0"}}')
	mkdirSync(join(leaf, 'node_modules'))
	symlinkSync(app, join(leaf, 'node_modules/app'))
	mkdirSync(join(app, 'platforms/macos/src'), { recursive: true })
	mkdirSync(join(app, 'platforms/macos/include'))
	writeFileSync(join(app, 'platforms/macos/src/root.c'), 'int root(void) { return 2; }')
	writeFileSync(join(app, 'platforms/macos/include/root.h'), 'int root(void);')
	assert.throws(() => discoverMacOSNative(app), /native dependency cycle/)
})

function machO({ cputype = 0x0100000c, minos = '13.5' } = {}) {
	const bytes = Buffer.alloc(56)
	bytes.writeUInt32LE(0xfeedfacf, 0)
	bytes.writeUInt32LE(cputype, 4)
	bytes.writeUInt32LE(1, 16)
	bytes.writeUInt32LE(24, 20)
	bytes.writeUInt32LE(0x32, 32)
	bytes.writeUInt32LE(24, 36)
	const [major, minor] = minos.split('.').map(Number)
	bytes.writeUInt32LE((major << 16) | (minor << 8), 44)
	return bytes
}

const machOCputypes = { arm64: 0x0100000c, x86_64: 0x01000007 }

function fatMachO(entries = [{ arch: 'arm64' }, { arch: 'x86_64' }]) {
	const slices = entries.map((entry) =>
		machO({ cputype: machOCputypes[entry.arch], minos: entry.minos }),
	)
	const headerSize = 8 + entries.length * 20
	const offsets = []
	let size = headerSize
	for (const slice of slices) {
		offsets.push(size)
		size += slice.length
	}

	const bytes = Buffer.alloc(size)
	bytes.writeUInt32BE(0xcafebabe, 0)
	bytes.writeUInt32BE(entries.length, 4)
	entries.forEach((entry, index) => {
		const at = 8 + index * 20
		bytes.writeUInt32BE(machOCputypes[entry.arch], at)
		bytes.writeUInt32BE(0, at + 4)
		bytes.writeUInt32BE(offsets[index], at + 8)
		bytes.writeUInt32BE(slices[index].length, at + 12)
		bytes.writeUInt32BE(0, at + 16)
		slices[index].copy(bytes, offsets[index])
	})
	return bytes
}

function prebuiltFixture(t, { bytes } = {}) {
	const app = mkdtempSync(join(tmpdir(), 'xplat-prebuilt-test-'))
	t.after(() => rmSync(app, { recursive: true, force: true }))
	mkdirSync(join(app, 'node_modules'))
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({ name: 'app', dependencies: { engine: '1.0.0' } }),
	)

	const engine = join(app, 'node_modules/engine')
	mkdirSync(join(engine, 'platforms/macos/prebuilt'), { recursive: true })
	mkdirSync(join(engine, 'platforms/macos/licenses'), { recursive: true })
	writeFileSync(join(engine, 'platforms/macos/prebuilt/libengine.dylib'), bytes ?? fatMachO())
	writeFileSync(join(engine, 'platforms/macos/licenses/engine.txt'), 'Engine License\n')
	writeFileSync(
		join(engine, 'package.json'),
		JSON.stringify({
			name: 'engine',
			xplat: {
				macos: {
					prebuiltLibraries: ['platforms/macos/prebuilt/libengine.dylib'],
					notices: 'platforms/macos/licenses/engine.txt',
				},
			},
		}),
	)
	return { app, engine }
}

test('a prebuilt-only package ships its dylib without a toolchain', async (t) => {
	const { app, engine } = prebuiltFixture(t)
	const graph = discoverMacOSNative(app)
	assert.deepEqual(graph.leaves, [])
	assert.equal(graph.prebuilt.length, 1)
	assert.equal(graph.prebuilt[0].name, 'engine')
	assert.equal(graph.prebuilt[0].file, 'libengine.dylib')
	assert.equal(
		graph.prebuilt[0].source,
		realpathSync(join(engine, 'platforms/macos/prebuilt/libengine.dylib')),
	)
	assert.equal(
		graph.prebuilt[0].notices,
		realpathSync(join(engine, 'platforms/macos/licenses/engine.txt')),
	)

	const artifact = await buildMacOSNative(app)
	assert.deepEqual(artifact.libraries, [])
	assert.equal(artifact.prebuilt.length, 1)
	assert.match(artifact.metadata.arm64, /prebuilt.*metadata\.macos\.arm64\.nsmd$/)
	assert.match(artifact.metadata.x86_64, /prebuilt.*metadata\.macos\.x86_64\.nsmd$/)
})

test('a compile leaf keeps its notices while also shipping prebuilt libraries', (t) => {
	const { app, leaf } = fixture(t)
	writeFileSync(join(leaf, 'platforms/macos/prebuilt.dylib'), fatMachO())
	writeFileSync(
		join(leaf, 'package.json'),
		JSON.stringify({
			name: 'leaf',
			xplat: {
				macos: {
					prebuiltLibraries: ['platforms/macos/prebuilt.dylib'],
					notices: 'platforms/macos/include/probe.h',
				},
			},
		}),
	)

	const graph = discoverMacOSNative(app)
	assert.equal(graph.leaves.length, 1)
	assert.equal(graph.prebuilt.length, 1)
	assert.equal(graph.prebuilt[0].file, 'prebuilt.dylib')
	assert.equal(graph.prebuilt[0].notices, null)
})

test('a thin arm64 prebuilt library is rejected for missing the x86_64 slice', async (t) => {
	const { app } = prebuiltFixture(t, { bytes: machO({ cputype: 0x0100000c }) })
	await assert.rejects(() => buildMacOSNative(app), /lacks an x86_64 slice/)
})

test('a prebuilt library slice above the app deployment target is rejected', async (t) => {
	const { app } = prebuiltFixture(t, {
		bytes: fatMachO([{ arch: 'arm64' }, { arch: 'x86_64', minos: '27.0' }]),
	})
	await assert.rejects(
		() => buildMacOSNative(app),
		/requires macOS 27\.0, above the declared 13\.5/,
	)
})

test('non-Mach-O and single-arch prebuilt libraries are rejected', async (t) => {
	const { app } = prebuiltFixture(t, { bytes: Buffer.from('not a mach-o') })
	await assert.rejects(() => buildMacOSNative(app), /not a Mach-O binary/)

	const { app: text } = prebuiltFixture(t, { bytes: Buffer.alloc(64, 'not a mach-o ') })
	await assert.rejects(() => buildMacOSNative(text), /not a Mach-O binary/)

	const { app: app32 } = prebuiltFixture(t, { bytes: machO({ cputype: 0x01000007 }) })
	await assert.rejects(() => buildMacOSNative(app32), /lacks an arm64 slice/)
})

test('prebuilt library declarations reject invalid paths and keys', (t) => {
	for (const [config, message, extra] of [
		[
			{ prebuiltLibraries: ['platforms/macos/prebuilt/libengine.so'] },
			/must be a .dylib/,
			(engine) => writeFileSync(join(engine, 'platforms/macos/prebuilt/libengine.so'), machO()),
		],
		[{ prebuiltLibraries: ['package.json'] }, /inside platforms\/macos/],
		[
			{
				prebuiltLibraries: ['platforms/macos/prebuilt/libengine.dylib'],
				frameworks: ['Foundation'],
			},
			/requires native sources/,
		],
	]) {
		const { app, engine } = prebuiltFixture(t)
		extra?.(engine)
		writeFileSync(
			join(engine, 'package.json'),
			JSON.stringify({ name: 'engine', xplat: { macos: config } }),
		)

		assert.throws(() => discoverMacOSNative(app), message)
	}
})

test('duplicate prebuilt basenames across packages are rejected', (t) => {
	const { app, engine } = prebuiltFixture(t)
	const other = join(app, 'node_modules/other')
	mkdirSync(join(other, 'platforms/macos'), { recursive: true })
	writeFileSync(join(other, 'platforms/macos/libengine.dylib'), machO())
	writeFileSync(
		join(other, 'package.json'),
		JSON.stringify({
			name: 'other',
			xplat: { macos: { prebuiltLibraries: ['platforms/macos/libengine.dylib'] } },
		}),
	)
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({ name: 'app', dependencies: { engine: '1.0.0', other: '1.0.0' } }),
	)

	assert.throws(() => discoverMacOSNative(app), /Multiple packages ship prebuilt libengine\.dylib/)
	assert.ok(engine)
})

test('prebuilt bytes and notices participate in the fingerprint', (t) => {
	const { app, engine } = prebuiltFixture(t)
	const original = discoverMacOSNative(app).fingerprint
	writeFileSync(join(engine, 'platforms/macos/prebuilt/libengine.dylib'), machO({ minos: '14.0' }))
	assert.notEqual(discoverMacOSNative(app).fingerprint, original)
	writeFileSync(join(engine, 'platforms/macos/licenses/engine.txt'), 'Engine License v2\n')
	assert.notEqual(discoverMacOSNative(app).fingerprint, original)
})

test('the loader dlopens prebuilt libraries from packaged and source paths', async (t) => {
	const { app, engine } = prebuiltFixture(t)
	const artifact = await buildMacOSNative(app)
	const packaged = nativeLoader(artifact, { packaged: true })
	assert.match(packaged, /privateFrameworksPath/)
	assert.match(packaged, /libengine\.dylib/)

	const dev = nativeLoader(artifact)
	assert.match(dev, /dlopen/)
	assert.ok(dev.includes(realpathSync(join(engine, 'platforms/macos/prebuilt/libengine.dylib'))))
})
