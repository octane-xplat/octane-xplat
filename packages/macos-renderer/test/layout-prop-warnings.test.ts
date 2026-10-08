import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// applyProps warns `ignored <type> prop <name>` for any prop outside its
// per-type whitelist, but left/right/top/bottom are consumed by the PARENT's
// layoutAbsoluteChildren — the warning fires for props that take effect.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const applyPropsSrc = source.slice(
	source.indexOf('function applyProps'),
	source.indexOf('function detach'),
)

const warnings: string[] = []
const reconciles: any[] = []

const { applyProps } = runInNewContext(applyPropsSrc + '\n({ applyProps })', {
	console: { warn: (msg: unknown) => warnings.push(String(msg)) },
	queueLayoutReconcile: (container: any, parent: any) => reconciles.push(parent),
	setSizeConstraint: () => {},
	syncLabelOverflow: () => {},
	syncText: () => {},
	DEFAULT_TEXT_LINE_HEIGHT_RATIO: 1.3,
})

function node(type: string, parentType?: string) {
	const parent = parentType ? { type: parentType, children: [] } : null
	const child = { type, props: {}, view: {}, container: { layoutDirty: null }, parent }
	parent?.children.push(child)
	return child
}

function ignoredWarnings() {
	return warnings.filter((m) => m.includes('ignored'))
}

test.beforeEach(() => {
	warnings.length = 0
	reconciles.length = 0
})

test('absolutelayout child does not warn for left/top/right/bottom under absolutelayout parent', () => {
	applyProps(node('absolutelayout', 'absolutelayout'), { left: 0, top: 0, right: 0, bottom: 0 })
	assert.deepEqual(ignoredWarnings(), [])
})

test('flexboxlayout child does not warn for right/bottom under absolutelayout parent', () => {
	applyProps(node('flexboxlayout', 'absolutelayout'), { right: 0, bottom: 0 })
	assert.deepEqual(ignoredWarnings(), [])
})

test('leaf child does not warn for absolute offsets under absolutelayout parent', () => {
	applyProps(node('label', 'absolutelayout'), { top: 4, left: 4 })
	assert.deepEqual(ignoredWarnings(), [])
})

test('grid child props do not warn under gridlayout parent', () => {
	applyProps(node('label', 'gridlayout'), { row: 0, col: 1 })
	assert.deepEqual(ignoredWarnings(), [])
})

test('absolute offsets still warn under a parent that cannot consume them', () => {
	applyProps(node('stack', 'stack'), { top: 4 })
	assert.ok(
		ignoredWarnings().some((m) => m.includes('top')),
		'expected a warning naming the dead prop',
	)
})
