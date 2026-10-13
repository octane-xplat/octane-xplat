import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/session-backend.ios.ts', import.meta.url), 'utf8')
const start = source.indexOf('const preferAutoStabilization =')
const end = source.indexOf('const mapInterruptionReason =', start)
assert.ok(start >= 0 && end > start)
const compiled = ts.transpile('const videoStabilizationModeAuto = -1;\n' + source.slice(start, end) + '\nglobalThis.prefer = preferAutoStabilization', {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})
const context = vm.createContext({})
vm.runInContext(compiled, context)
const { prefer } = context

test('supported connections receive the automatic stabilization preference', () => {
	const connection = {
		preferredVideoStabilizationMode: 0,
		isVideoStabilizationModeSupported(mode) {
			assert.equal(this, connection)
			assert.equal(mode, -1)
			return true
		},
	}
	prefer(connection)
	assert.equal(connection.preferredVideoStabilizationMode, -1)
})

test('explicit unsupported mode leaves the preference unchanged', () => {
	const connection = { preferredVideoStabilizationMode: 0, supportsVideoStabilization: true, isVideoStabilizationModeSupported: () => false }
	prefer(connection)
	assert.equal(connection.preferredVideoStabilizationMode, 0)
})

test('older connections use the capability fallback and missing connections no-op', () => {
	for (const supported of [true, false]) {
		const connection = { preferredVideoStabilizationMode: 0, supportsVideoStabilization: supported }
		prefer(connection)
		assert.equal(connection.preferredVideoStabilizationMode, supported ? -1 : 0)
	}
	prefer(null)
	prefer(undefined)
})
