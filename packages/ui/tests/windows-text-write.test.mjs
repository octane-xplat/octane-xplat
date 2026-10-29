import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/components/forms/text-write.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	const exports = {}
	vm.runInNewContext(source, { exports })
	const { writeText, isWritingText } = exports
	const state = {
		writes: 0,
		echoes: [],
		selections: [],
		afterWrite: null,
		failText: false,
		failSelect: false,
	}
	const native = {
		SelectionStart: 2,
		SelectionLength: 3,
		Select(start, length) {
			if (state.failSelect) {
				throw new Error('detached')
			}
			state.selections.push([start, length])
			this.SelectionStart = start
			this.SelectionLength = length
		},
	}
	let text = 'abcdef'
	const view = {
		nativeViewProtected: native,
		get text() {
			return text
		},
		set text(value) {
			if (state.failText) {
				throw new Error('text rejected')
			}
			text = value
			state.writes++
			state.echoes.push(isWritingText(view))
			native.SelectionStart = 0
			native.SelectionLength = 0
			state.afterWrite?.()
		},
	}
	return { writeText, isWritingText, view, native, state }
}

test('Windows controlled writes restore caret/range and suppress synchronous echoes', () => {
	const { writeText, isWritingText, view, state } = fixture()
	writeText(view, 'ABCDEF')
	assert.equal(view.text, 'ABCDEF')
	assert.deepEqual(state.selections, [[2, 3]])
	assert.deepEqual(state.echoes, [true])
	assert.equal(isWritingText(view), false)
	state.selections.length = 0
	writeText(view, 'ABCDEF')
	assert.equal(state.writes, 1)
	assert.deepEqual(state.selections, [])
})

test('Windows selection clamps on shrink and uses UTF-16 offsets without splitting range math', () => {
	const { writeText, view, native, state } = fixture()
	writeText(view, 'abc')
	assert.deepEqual(state.selections, [[2, 1]])
	native.SelectionStart = 3
	native.SelectionLength = 0
	writeText(view, 'a😀b')
	assert.deepEqual(state.selections.at(-1), [3, 0])
	writeText(view, null)
	assert.equal(view.text, '')
	assert.deepEqual(state.selections.at(-1), [0, 0])
})

test('Windows secure/missing/invalid selection surfaces retain plain guarded writes', () => {
	for (const replacement of [
		undefined,
		{},
		{
			SelectionStart: -1,
			SelectionLength: 2,
			Select() {
				throw new Error('must not select')
			},
		},
		{
			get SelectionStart() {
				throw new Error('unsupported')
			},
		},
	]) {
		const { writeText, isWritingText, view, state } = fixture()
		view.nativeViewProtected = replacement
		writeText(view, 'new')
		assert.equal(view.text, 'new')
		assert.deepEqual(state.echoes, [true])
		assert.equal(isWritingText(view), false)
	}
})

test('Windows text failures clear suppression and selection failures retain accepted text', () => {
	const { writeText, isWritingText, view, state } = fixture()
	state.failText = true
	assert.throws(() => writeText(view, 'new'), /text rejected/)
	assert.equal(isWritingText(view), false)
	state.failText = false
	state.failSelect = true
	writeText(view, 'new')
	assert.equal(view.text, 'new')
	assert.equal(isWritingText(view), false)
})

test('Windows controlled writes do not restore a retired native control', () => {
	const { writeText, view, state } = fixture()
	state.afterWrite = () => {
		view.nativeViewProtected = {}
	}
	writeText(view, 'new')
	assert.equal(view.text, 'new')
	assert.deepEqual(state.selections, [])
})

test('Windows nested writes retain outer suppression and a newer value owns its selection', () => {
	const { writeText, isWritingText, view, state } = fixture()
	state.afterWrite = () => {
		state.afterWrite = null
		writeText(view, 'latest')
		assert.equal(isWritingText(view), true)
	}
	writeText(view, 'outer')
	assert.equal(view.text, 'latest')
	assert.deepEqual(state.echoes, [true, true])
	assert.deepEqual(state.selections, [[0, 0]])
	assert.equal(isWritingText(view), false)
})
