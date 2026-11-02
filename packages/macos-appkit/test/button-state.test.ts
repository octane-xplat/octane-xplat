// Real renderer prop/action branch with fake native objects; no OS input/AX proof.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const start = source.indexOf("case 'button':\n\t\t\t\tif (name === 'title'")
const end = source.indexOf("case 'scrollview':", start)
assert.ok(start >= 0 && end > start)
const branch = source.slice(start, end)
function fixture() {
	const events: string[] = [], warnings: string[] = []
	const actions = new Map<number, () => void>()
	const node = { type: 'button', actionId: 1, props: {} as Record<string, any>, view: { enabled: true, title: '' },
		container: { root: { eventScope(name: string, callback: () => void) { events.push(name); callback() } } as any } }
	const apply = runSlice(`(patch) => { node.props = { ...node.props, ...patch }; for (const [name, value] of Object.entries(patch)) { switch(node.type) { ${branch} } } }`, {
		node, actionHandlers: actions, accessibilityLabels: new Map(), console: { warn: (text: string) => warnings.push(text), error: (text: string) => warnings.push(text) },
	})
	return { node, apply, events, warnings, press: () => actions.get(1)?.() }
}

test('native button isEnabled applies to the control and guards dispatched actions', () => {
	const h = fixture(); let presses = 0
	h.apply({ text: 'Google', isEnabled: false, onPress: () => presses++ })
	assert.equal(h.node.view.title, 'Google'); assert.equal(h.node.view.enabled, false)
	h.press(); assert.equal(presses, 0); assert.equal(h.events.length, 0)
	h.apply({ isEnabled: true }); h.press()
	assert.equal(h.node.view.enabled, true); assert.equal(presses, 1); assert.equal(h.events[0], 'discrete')
	h.apply({ isEnabled: false }); h.press(); assert.equal(presses, 1)
	assert.deepEqual(h.warnings, [])
})

test('clearing button isEnabled restores state without overriding an independent disabled native alias', () => {
	const h = fixture()
	h.apply({ isEnabled: false }); h.apply({ isEnabled: undefined }); assert.equal(h.node.view.enabled, true)
	h.apply({ enabled: false }); h.apply({ isEnabled: true }); assert.equal(h.node.view.enabled, false)
	h.apply({ enabled: undefined }); assert.equal(h.node.view.enabled, true)
	h.apply({ isEnabled: false, enabled: true }); assert.equal(h.node.view.enabled, false)
})

test('button dispatch uses the current handler and stops after handler/root retirement', () => {
	const h = fixture(), calls: string[] = []
	h.apply({ onPress: () => calls.push('old') }); h.apply({ onPress: () => calls.push('current') }); h.press()
	assert.deepEqual(calls, ['current'])
	h.node.container.root = null; h.press(); assert.deepEqual(calls, ['current'])
	h.apply({ onPress: undefined }); h.press(); assert.deepEqual(h.warnings, [])
})
