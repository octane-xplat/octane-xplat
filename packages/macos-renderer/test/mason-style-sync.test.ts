import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

function fixture() {
	const styles: Record<string, unknown>[] = []
	let fail = false
	const host = {
		performSelectorWithObjectWithObject(_selector: string, op: string, args: any[]) {
			if (op === 'node' || op === 'mnode') {
				return 1
			}
			if (op === 'style') {
				if (fail) {
					throw new Error('style failed')
				}

				styles.push(JSON.parse(JSON.stringify(args[1])))
			}
			return null
		},
	}
	const api = runSlice(
		sourceWithoutImports(new URL('../src/mason.ts', import.meta.url)).replaceAll('export ', '') +
			'\n({ syncMasonNode, layoutMasonChildren, releaseMasonNodes })',
		{
			process: { env: {} },
			NSThread: { mainThread: { threadDictionary: { objectForKey: () => host } } },
		},
	)
	const node: any = {
		type: 'masonview',
		children: [],
		props: { style: { gap: 8 } },
		view: { bounds: { size: { width: 100, height: 80 } } },
	}
	return {
		...api,
		node,
		styles,
		fail: (value: boolean) => {
			fail = value
		},
	}
}

test('unchanged styles skip engine writes; nested changes and removal still apply', () => {
	const env = fixture()
	env.syncMasonNode(env.node, () => env.node.view)
	for (let i = 0; i < 20; i++) {
		env.syncMasonNode(env.node, () => env.node.view)
	}
	assert.equal(env.styles.length, 1)
	env.node.props.style.gap = 12
	env.syncMasonNode(env.node, () => env.node.view)
	assert.deepEqual(env.styles.at(-1)?.gapRow, [0, 12])
	delete env.node.props.style.gap
	env.syncMasonNode(env.node, () => env.node.view)
	assert.equal(env.styles.length, 3)
	assert.equal(env.styles.at(-1)?.gapRow, undefined)
})

test('temporary root dimensions restore authored styles and follow resizing', () => {
	const env = fixture()
	const layout = () =>
		env.layoutMasonChildren(
			env.node,
			() => env.node.view,
			() => {},
		)
	layout()
	assert.deepEqual(env.styles.at(-1)?.width, [1, 100])
	assert.deepEqual(env.styles.at(-1)?.height, [1, 80])
	// An ancestor synchronizes this node as a child after it laid out as a root.
	env.syncMasonNode(env.node, () => env.node.view)
	assert.equal(env.styles.at(-1)?.width, undefined)
	assert.equal(env.styles.at(-1)?.height, undefined)
	env.node.view.bounds.size.width = 240
	layout()
	assert.deepEqual(env.styles.at(-1)?.width, [1, 240])
})

test('recreated handles receive their styles even when the native handle is reused', () => {
	const env = fixture()
	env.syncMasonNode(env.node, () => env.node.view)
	env.releaseMasonNodes(env.node)
	env.syncMasonNode(env.node, () => env.node.view)
	assert.equal(env.styles.length, 2)
})

test('scroll-content sizing does not leave the authored size cache stale', () => {
	const env = fixture()
	env.node.type = 'scrollview'
	env.node.props.style = { width: 300, height: 400, minHeight: 250, maxHeight: 800 }
	env.layoutMasonChildren(
		env.node,
		() => env.node.view,
		() => {},
	)
	for (const key of ['width', 'height', 'minHeight', 'maxHeight']) {
		assert.equal(env.styles.at(-1)?.[key], undefined)
	}
	env.syncMasonNode(env.node, () => env.node.view)
	assert.deepEqual(env.styles.at(-1)?.width, [1, 300])
	assert.deepEqual(env.styles.at(-1)?.minHeight, [1, 250])
})

test('failed native style writes are retried', () => {
	const env = fixture()
	env.syncMasonNode(env.node, () => env.node.view)
	env.node.props.style.gap = 20
	env.fail(true)
	assert.throws(() => env.syncMasonNode(env.node, () => env.node.view), /style failed/)
	env.fail(false)
	env.syncMasonNode(env.node, () => env.node.view)
	assert.equal(env.styles.length, 2)
	assert.deepEqual(env.styles.at(-1)?.gapRow, [0, 20])
})

test('a failed write invalidates the previous style before restoration', () => {
	const env = fixture()
	env.syncMasonNode(env.node, () => env.node.view)
	env.node.props.style.gap = 20
	env.fail(true)
	assert.throws(() => env.syncMasonNode(env.node, () => env.node.view), /style failed/)
	env.node.props.style.gap = 8
	env.fail(false)
	env.syncMasonNode(env.node, () => env.node.view)
	assert.equal(env.styles.length, 2)
	assert.deepEqual(env.styles.at(-1)?.gapRow, [0, 8])
})
