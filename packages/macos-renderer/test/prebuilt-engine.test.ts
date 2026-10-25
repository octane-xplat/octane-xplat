import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// The Mason engine ships prebuilt inside this package so packaged apps do
// not need a Rust toolchain; these checks pin the shipping contract.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const dylibPath = join(packageRoot, 'platforms/macos/prebuilt/libxplatmason.dylib')

function packageFile(path: string) {
	return join(packageRoot, path)
}

function machOMinimumSystemVersion(bytes: Buffer): string | null {
	if (bytes.length < 32 || bytes.readUInt32LE(0) !== 0xfeedfacf) {
		return null
	}

	const commands = bytes.readUInt32LE(16)
	let offset = 32
	for (let index = 0; index < commands; index++) {
		if (offset + 8 > bytes.length) {
			return null
		}

		const command = bytes.readUInt32LE(offset)
		const size = bytes.readUInt32LE(offset + 4)
		if (size < 8 || offset + size > bytes.length) {
			return null
		}

		if (command === 0x32 && size >= 24) {
			const version = bytes.readUInt32LE(offset + 12)
			return `${version >>> 16}.${(version >>> 8) & 255}`
		}

		offset += size
	}

	return null
}

test('the package publishes the prebuilt engine files', () => {
	assert.ok(manifest.files.includes('platforms'))
	assert.deepEqual(manifest.xplat?.macos?.prebuiltLibraries, [
		'platforms/macos/prebuilt/libxplatmason.dylib',
	])
	assert.equal(manifest.xplat?.macos?.notices, 'platforms/macos/licenses/nativescript-mason.txt')
	assert.ok(existsSync(packageFile(manifest.xplat.macos.notices)))
})

test('the engine manifest checksum matches the shipped bytes', () => {
	const prebuilt = JSON.parse(
		readFileSync(join(packageRoot, 'platforms/macos/prebuilt/manifest.json'), 'utf8'),
	)
	assert.equal(prebuilt.library, 'libxplatmason.dylib')
	const sha = createHash('sha256').update(readFileSync(dylibPath)).digest('hex')
	assert.equal(prebuilt.sha256['libxplatmason.dylib'], sha)
})

test('the engine is a thin arm64 Mach-O within the app deployment target', () => {
	const bytes = readFileSync(dylibPath)
	assert.equal(bytes.readUInt32LE(0), 0xfeedfacf, 'expected a Mach-O 64-bit binary')
	assert.equal(bytes.readUInt32LE(4), 0x0100000c, 'expected a thin arm64 slice')
	const minos = machOMinimumSystemVersion(bytes)
	assert.ok(minos, 'expected an LC_BUILD_VERSION deployment target')
	const [major, minor] = minos.split('.').map(Number)
	assert.ok(
		major < 13 || (major === 13 && minor <= 5),
		`engine requires macOS ${minos}, above the 13.5 floor`,
	)
})
