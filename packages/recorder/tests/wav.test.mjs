import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/wav.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
	verbatimModuleSyntax: false,
})

const sandbox = { exports: {}, module: { exports: {} } }
sandbox.exports = sandbox.module.exports
vm.runInNewContext(compiled, sandbox)
const { wavHeader, encodeWavFloat32, decodeBase64, inspectPcmWav } = sandbox.exports

const view = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
const asciiAt = (bytes, at, length) => String.fromCharCode(...bytes.subarray(at, at + length))

test('wavHeader emits canonical 16-bit PCM RIFF framing', () => {
	const header = wavHeader(8000, 16000, 1)
	assert.equal(header.length, 44)
	const v = view(header)
	assert.equal(asciiAt(header, 0, 4), 'RIFF')
	assert.equal(v.getUint32(4, true), 36 + 8000)
	assert.equal(asciiAt(header, 8, 4), 'WAVE')
	assert.equal(asciiAt(header, 12, 4), 'fmt ')
	assert.equal(v.getUint32(16, true), 16)
	assert.equal(v.getUint16(20, true), 1) // PCM
	assert.equal(v.getUint16(22, true), 1) // mono
	assert.equal(v.getUint32(24, true), 16000)
	assert.equal(v.getUint32(28, true), 32000) // byte rate
	assert.equal(v.getUint16(32, true), 2) // block align
	assert.equal(v.getUint16(34, true), 16) // bit depth
	assert.equal(asciiAt(header, 36, 4), 'data')
	assert.equal(v.getUint32(40, true), 8000)
})

test('encodeWavFloat32 writes interleaved little-endian int16 samples', () => {
	const bytes = encodeWavFloat32(
		[new Float32Array([0, 0.5, -0.5, 1, -1]), new Float32Array([0, -1, 1, 0.25, -0.25])],
		44100,
	)

	const v = view(bytes)
	assert.equal(bytes.length, 44 + 5 * 2 * 2)
	assert.equal(v.getUint16(22, true), 2)
	assert.equal(v.getUint32(24, true), 44100)
	assert.equal(v.getUint32(40, true), 20)
	assert.equal(v.getInt16(44 + 0, true), 0) // L0
	assert.equal(v.getInt16(44 + 2, true), 0) // R0
	assert.equal(v.getInt16(44 + 4, true), Math.trunc(0x7fff * 0.5)) // L1
	assert.equal(v.getInt16(44 + 6, true), -32768) // R1 clamped from -1
	assert.equal(v.getInt16(44 + 12, true), 32767) // L3 clamped from +1
	assert.equal(v.getInt16(44 + 16, true), -32768) // L4
	assert.equal(v.getInt16(44 + 18, true), Math.floor(-0.25 * 0x8000)) // R4
})

test('encodeWavFloat32 tolerates uneven channel lengths as silence', () => {
	const bytes = encodeWavFloat32([new Float32Array([0.5]), new Float32Array(0)], 8000)
	const v = view(bytes)
	assert.equal(bytes.length, 48) // 44-byte header + 1 stereo frame
	assert.equal(v.getInt16(44, true), Math.trunc(0x7fff * 0.5))
	assert.equal(v.getInt16(46, true), 0)
})

// decodeBase64 runs inside the vm sandbox — compare element lists, not
// cross-realm Uint8Array identities.
const list = (bytes) => Array.from(bytes)

test('decodeBase64 round-trips WAV bytes', () => {
	const wav = encodeWavFloat32([new Float32Array([0.25, -0.25, 0.75])], 8000)
	const base64 = Buffer.from(wav).toString('base64')
	assert.deepEqual(list(decodeBase64(base64)), list(wav))
})

test('decodeBase64 handles unpadded input', () => {
	assert.deepEqual(list(decodeBase64('QQ')), [0x41]) // 'A'
	assert.deepEqual(list(decodeBase64('QUE')), [0x41, 0x41])
})

test('inspectPcmWav derives duration and metadata from sample bytes', () => {
	const bytes = encodeWavFloat32([new Float32Array(160), new Float32Array(160)], 16000)
	const metadata = inspectPcmWav(bytes)
	assert.equal(metadata.channels, 2)
	assert.equal(metadata.sampleRate, 16000)
	assert.equal(metadata.durationSeconds, 0.01)
	// Nonzero offsets are supported (bridge views need not own their buffer).
	const padded = new Uint8Array(bytes.length + 7)
	padded.set(bytes, 7)
	assert.equal(inspectPcmWav(padded.subarray(7)).durationSeconds, 0.01)
})

test('inspectPcmWav accepts extra chunks with odd-byte padding', () => {
	const canonical = encodeWavFloat32([new Float32Array([0.5])], 8000)
	const bytes = new Uint8Array(canonical.length + 10)
	bytes.set(canonical.subarray(0, 36))
	bytes.set([74, 85, 78, 75, 1, 0, 0, 0, 42, 0], 36) // JUNK + 1 byte + pad
	bytes.set(canonical.subarray(36), 46)
	view(bytes).setUint32(4, bytes.length - 8, true)
	assert.equal(inspectPcmWav(bytes).durationSeconds, 1 / 8000)
})

for (const [name, alter] of [
	['unfinalized header', (v) => v.setUint32(4, 0, true)],
	['truncated samples', (v) => v.setUint32(40, 999, true)],
	['non-PCM format', (v) => v.setUint16(20, 3, true)],
	['non-16-bit samples', (v) => v.setUint16(34, 24, true)],
	['invalid byte rate', (v) => v.setUint32(28, 1, true)],
	['invalid block alignment', (v) => v.setUint16(32, 4, true)],
	['zero sample rate', (v) => v.setUint32(24, 0, true)],
]) {
	test(`inspectPcmWav rejects ${name}`, () => {
		const bytes = encodeWavFloat32([new Float32Array([0.5])], 8000)
		alter(view(bytes))
		assert.throws(() => inspectPcmWav(bytes), /finalized 16-bit PCM WAV/)
	})
}

test('inspectPcmWav rejects empty takes and incomplete stereo frames', () => {
	assert.throws(() => inspectPcmWav(wavHeader(0, 44100, 1)), /finalized/)
	const bytes = new Uint8Array(46)
	bytes.set(wavHeader(2, 44100, 2))
	assert.throws(() => inspectPcmWav(bytes), /finalized/)
})
