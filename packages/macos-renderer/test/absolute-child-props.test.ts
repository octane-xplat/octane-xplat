import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// GH#10: left/right/top/bottom are parent-directed layout props consumed by
// layoutAbsoluteChildren for every absolutelayout child, but applyProps
// dispatches on the child's own type. The flexboxlayout whitelist covers
// left/top only; absolutelayout covers none of the four — so working
// children log "ignored prop". Under an absolutelayout parent the props
// should apply silently and queue a layout reconcile; under other parents
// they are genuinely dead and the warning should remain.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const slice = source.slice(
	source.indexOf('function applyProps'),
	source.indexOf('function detach('),
)

const warnings: string[] = []
const reconciles: any[] = []

const sandbox = {
	isStackLayoutInput: (name) =>
		['flexDirection', 'gap', 'rowGap', 'columnGap', 'alignItems', 'justifyContent'].includes(name),
	syncStackLayout: () => {},
	console: { warn: (msg: unknown) => warnings.push(String(msg)) },
	queueLayoutReconcile: (_container: any, parent: any) => reconciles.push(parent),
	setLayoutAction: () => {},
	applyAccessibility: () => {},
	setSizeConstraint: () => {},
	syncLabelOverflow: () => {},
	syncText: () => {},
	DEFAULT_TEXT_LINE_HEIGHT_RATIO: 1.3,
}

const { applyProps } = runInNewContext(slice + '\n({ applyProps })', sandbox)

function node(type: string, parent?: any) {
	const item = { id: Math.random(), type, view: {}, props: {}, parent, children: [] }
	parent?.children.push(item)
	return item
}

const ignoredFor = (item: any) =>
	warnings.filter((w) => w.includes('ignored ' + item.type + ' prop'))

test('absolutelayout children consume all four position props without warnings', () => {
	const parent = node('absolutelayout')
	for (const type of ['flexboxlayout', 'absolutelayout', 'label', 'stack']) {
		const item = node(type, parent)
		warnings.length = 0
		applyProps(item, { left: 0, top: 0, right: 0, bottom: 0 })
		assert.deepEqual(ignoredFor(item), [], `${type} child warned: ${ignoredFor(item)}`)
	}
})

test('position prop changes under absolutelayout queue a layout reconcile', () => {
	const parent = node('absolutelayout')
	const item = node('flexboxlayout', parent)
	reconciles.length = 0
	applyProps(item, { right: 12 })
	assert.deepEqual(reconciles, [parent])
})

test('position props under non-absolute parents still warn as ignored', () => {
	const parent = node('stack')
	const item = node('flexboxlayout', parent)
	warnings.length = 0
	applyProps(item, { left: 0, right: 0 })
	assert.equal(ignoredFor(item).length, 2)
})
