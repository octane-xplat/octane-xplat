import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sourceWithoutImports, runSlice } from './mock-globals.ts'

function fixture(add: (...args: any[]) => unknown) {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), begin = source.indexOf('let accessibilityDisplayObserver'), end = source.indexOf('// Appearance flips', begin)
	assert.ok(begin >= 0 && end > begin)
	const containers = new Set([{}]), queue = {}, workspace = { notificationCenter: { addObserverForNameObjectQueueUsingBlock: add } }
	let refreshed = 0
	const install = runSlice(source.slice(begin, end) + '\n;installAccessibilityDisplayObserver', { NSWorkspace: { sharedWorkspace: workspace }, NSOperationQueue: { mainQueue: queue }, NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification: 'display-options', appKitContainers: containers, onHostWindowResize: () => refreshed++, console: { warn() {} } })
	return { install, containers, queue, workspace, refreshed: () => refreshed }
}

test('display-option observation uses the workspace center/main queue once and ignores an empty host set', () => {
	const calls: any[][] = [], env = fixture((...args) => { calls.push(args); return {} })
	env.install(); env.install(); assert.equal(calls.length, 1)
	assert.equal(calls[0][0], 'display-options'); assert.equal(calls[0][1], env.workspace); assert.equal(calls[0][2], env.queue)
	calls[0][3](); assert.equal(env.refreshed(), 1); env.containers.clear(); calls[0][3](); assert.equal(env.refreshed(), 1)
})
test('failed observer registration does not claim installation and a later root can retry', () => {
	let attempts = 0
	const env = fixture(() => { if (++attempts === 1) {throw Error('bridge unavailable');} return {} })
	assert.doesNotThrow(env.install); env.install(); env.install(); assert.equal(attempts, 2)
})
