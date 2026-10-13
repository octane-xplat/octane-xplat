import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/session-backend.ios.ts', import.meta.url), 'utf8')
const start = source.indexOf('const stopSessionIfIdle =')
const end = source.indexOf('\n\t}', start) + 3
assert.ok(start >= 0 && end > start)
const compiled = ts.transpile(source.slice(start, end) + '\nglobalThis.stop = stopSessionIfIdle', {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const load = (overrides = {}) => {
	const events = []
	const context = vm.createContext({
		session: { stopRunning: () => events.push('stop') },
		captureSink: undefined,
		previewHost: undefined,
		interrupted: true,
		clearObservers: () => events.push('clear'),
		observer: { availability: (value) => events.push(['availability', value]) },
		...overrides,
	})

	context.notify = (phase) => {
		context.interrupted = phase === 'began'
		events.push(['interruption', phase])
	}

	vm.runInContext(compiled, context)
	return { context, events }
}

test('idle teardown ends interruption and restores availability for the next session', () => {
	const { context, events } = load()
	context.stop()
	assert.equal(context.session, undefined)
	assert.equal(context.interrupted, false)
	assert.deepEqual(events, ['stop', 'clear', ['interruption', 'ended'], ['availability', true]])
	context.stop()
	assert.equal(events.length, 4)
})

test('active preview or capture keeps its session and interruption state', () => {
	for (const overrides of [{ previewHost: {} }, { captureSink: {} }]) {
		const { context, events } = load(overrides)
		context.stop()
		assert.ok(context.session)
		assert.equal(context.interrupted, true)
		assert.deepEqual(events, [])
	}
})

test('uninterrupted teardown restores availability without a spurious ended event', () => {
	const { context, events } = load({ interrupted: false })
	context.stop()
	assert.deepEqual(events, ['stop', 'clear', ['availability', true]])
})
