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
const { wavHeader, encodeWavFloat32, decodeBase64 } = sandbox.exports

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
