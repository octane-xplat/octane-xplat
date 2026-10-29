import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTextValueWriter, disposeTextValue, isWritingTextValue, setTextValue } from '../src/text-value.ts'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

// Actual writer/registry and native adapter source models; no SDK/IME execution.
function fixture() {
	let text = 'draft', marked = true
	const writes: string[] = [], jobs: any[] = [], observers: any[] = []
	const hooks: any = {}
	const scheduler = {
		schedule(callback: () => void) {
			const job = { callback, cancelled: 0 }; jobs.push(job); hooks.schedule?.(job); return job
		},
		cancel(job: any) { assert.equal(this, scheduler); job.cancelled++; hooks.cancel?.(job) },
	}
	const adapter = {
		read() { hooks.read?.(); return text },
		marked() { hooks.marked?.(); return marked },
		write(value: string) { hooks.write?.(value); text = value; writes.push(value) },
		observeCommit(callback: () => void) {
			const observer = { callback, removed: 0 }; observers.push(observer)
			hooks.observe?.(observer)
			return () => { observer.removed++; hooks.release?.(observer) }
		},
	}
	const writer = createTextValueWriter(adapter, scheduler)
	return { writer, adapter, scheduler, hooks, writes, jobs, observers, get text() { return text }, mark: (value: boolean) => { marked = value } }
}

test('observer acquisition coalesces reentrant values and releases a late handle after disposal', () => {
	for (const dispose of [false, true]) {
		const h = fixture()
		h.hooks.observe = (observer: any) => {
			observer.callback() // Acquisition is not ready to dispatch.
			if (dispose) h.writer.dispose(); else h.writer.update('latest')
		}
		h.writer.update('older')
		assert.equal(h.jobs.length, 0)
		assert.equal(h.observers.length, 1)
		h.mark(false); h.observers[0].callback()
		if (dispose) {
			assert.equal(h.jobs.length, 0); assert.equal(h.observers[0].removed, 1)
		} else {
			h.jobs[0].callback(); assert.deepEqual(h.writes, ['latest'])
		}
		h.writer.dispose(); assert.equal(h.observers[0].removed, 1)
	}
})

test('failed observation retires its held callback and later updates retry acquisition', () => {
	const h = fixture(), messages: unknown[][] = [], original = console.error
	console.error = (...args) => { messages.push(args) }
	try {
		h.hooks.observe = () => { throw Error('private registration payload') }
		h.writer.update('first'); h.observers[0].callback()
		assert.equal(h.jobs.length, 0)
		h.hooks.observe = undefined
		h.writer.update('latest'); h.mark(false); h.observers[1].callback(); h.jobs[0].callback()
		assert.deepEqual(h.writes, ['latest'])
		assert.deepEqual(messages, [['[macos-text] value observation unavailable']])
	} finally { h.writer.dispose(); console.error = original }
})

test('successful flush cleanup cannot let an older value overwrite a reentrant replacement', () => {
	const h = fixture()
	let replace = true
		h.hooks.release = () => { if (replace) { replace = false; h.writer.update('replacement') } }
	try {
		h.writer.update('older'); h.mark(false); h.observers[0].callback(); h.jobs[0].callback()
		assert.equal(h.text, 'replacement')
		assert.deepEqual(h.writes, ['older', 'replacement'])
		assert.equal(h.observers[0].removed, 1)
	} finally { h.writer.dispose() }
})

test('reentrant scheduling releases the old late handle and preserves the newer task', () => {
	const h = fixture()
	let reenter = true
		h.hooks.schedule = () => {
		if (reenter) { reenter = false; h.writer.update('latest'); h.writer.flushLater() }
	}
	try {
		h.writer.update('older'); h.writer.flushLater()
		assert.equal(h.jobs.length, 2); assert.equal(h.jobs[0].cancelled, 1)
		h.mark(false); h.jobs[0].callback(); assert.deepEqual(h.writes, [])
		h.jobs[1].callback(); assert.deepEqual(h.writes, ['latest'])
	} finally { h.writer.dispose() }
})

test('teardown retires task and observation before both throwing cleanup effects', () => {
	const h = fixture(), messages: unknown[][] = [], original = console.error
	console.error = (...args) => { messages.push(args); throw Error('diagnostic unavailable') }
	try {
		h.writer.update('pending'); h.writer.flushLater()
		h.scheduler.cancel = () => assert.fail('replacement cancel received an old handle')
		h.hooks.cancel = () => { h.observers[0].callback(); h.jobs[0].callback(); throw Error('private timer payload') }
		h.hooks.release = () => { h.observers[0].callback(); h.jobs[0].callback(); throw Error('private cleanup payload') }
		h.writer.dispose(); h.writer.dispose(); h.writer.update('retired')
		assert.equal(h.jobs[0].cancelled, 1); assert.equal(h.observers[0].removed, 1)
		assert.deepEqual(h.writes, [])
		assert.deepEqual(messages, [['[macos-text] value task cleanup failed'], ['[macos-text] value observation cleanup failed']])
	} finally { console.error = original }
})

test('read and marked-state reentry supersede stale writes before touching the native value', () => {
	for (const phase of ['read', 'marked']) {
		for (const dispose of [false, true]) {
			const h = fixture(); h.mark(false)
			let reenter = true
			h.hooks[phase] = () => { if (reenter) { reenter = false; if (dispose) h.writer.dispose(); else h.writer.update('latest') } }
			try { h.writer.update('older'); assert.deepEqual(h.writes, dispose ? [] : ['latest']) }
			finally { h.writer.dispose() }
		}
	}
})

test('registry claims factory ownership before reentrant updates and honors an unset initial value', () => {
	for (const latest of ['latest', undefined]) {
		const view = {}, writes: string[] = []
		try {
			setTextValue(view, 'older', () => {
				setTextValue(view, latest, () => assert.fail('a second factory was started'))
				return { read: () => '', marked: () => false, write: value => { assert.equal(isWritingTextValue(view), true); writes.push(value) } }
			})
			assert.deepEqual(writes, latest === undefined ? [] : ['latest'])
		} finally { disposeTextValue(view) }
	}
})

test('registry teardown cannot delete a newer writer created by the old cleanup', () => {
	const view = {}, writes: string[] = []
	try {
		setTextValue(view, 'pending', () => ({
			read: () => '', marked: () => true, write: () => assert.fail('old writer wrote'),
			observeCommit: () => () => setTextValue(view, 'replacement', () => ({ read: () => '', marked: () => false, write: value => writes.push(value) })),
		}))
		disposeTextValue(view)
		setTextValue(view, 'followup', () => assert.fail('replacement registry owner was lost'))
		assert.deepEqual(writes, ['replacement', 'followup'])
	} finally { disposeTextValue(view) }
})

test('retired factory completion or failure preserves the replacement registry owner', () => {
	for (const fail of [false, true]) {
		const view = {}, writes: string[] = []
		const install = () => setTextValue(view, 'older', () => {
			disposeTextValue(view)
			setTextValue(view, 'replacement', () => ({ read: () => '', marked: () => false, write: value => writes.push(value) }))
			if (fail) throw Error('factory failure')
			return { read: () => '', marked: () => false, write: () => assert.fail('retired factory wrote') }
		})
		try {
			if (fail) assert.throws(install, /factory failure/); else install()
			setTextValue(view, 'followup', () => assert.fail('replacement was deleted'))
			assert.deepEqual(writes, ['replacement', 'followup'])
		} finally { disposeTextValue(view) }
	}
})

test('an initial setter failure preserves the published writer and newer reentrant value', () => {
	const view = {}, writes: string[] = []
	let text = ''
	try {
		assert.throws(() => setTextValue(view, 'older', () => ({
			read: () => text, marked: () => false, write: value => {
				text = value; writes.push(value)
				if (value === 'older') { setTextValue(view, 'latest', () => assert.fail('duplicate factory')); throw Error('native failure') }
			},
		})), /native failure/)
		assert.equal(text, 'latest'); assert.equal(isWritingTextValue(view), false)
		setTextValue(view, 'followup', () => assert.fail('published writer was removed'))
		assert.deepEqual(writes, ['older', 'latest', 'followup'])
	} finally { disposeTextValue(view) }
})

test('schedule/native-write failures retain explicit retry and log fixed diagnostics only', () => {
	const h = fixture(), messages: unknown[][] = [], original = console.error
	console.error = (...args) => { messages.push(args) }
	try {
		h.writer.update('latest'); h.mark(false)
		h.hooks.schedule = () => { throw Error('private scheduling payload') }
		h.writer.flushLater(); h.jobs[0].callback(); assert.deepEqual(h.writes, [])
		h.hooks.schedule = undefined
		h.hooks.write = () => { throw Error('private input payload') }
		h.writer.flushLater(); h.jobs[1].callback(); assert.equal(h.writer.isWriting, false)
		h.hooks.write = undefined
		h.writer.flushLater(); h.jobs[2].callback()
		assert.deepEqual(h.writes, ['latest'])
		assert.deepEqual(messages, [['[macos-text] value scheduling failed'], ['[macos-text] deferred value write failed']])
	} finally { h.writer.dispose(); console.error = original }
})

test('inline scheduler completion releases the late handle once and repeated callbacks stay inert', () => {
	const h = fixture()
		h.hooks.schedule = (job: any) => job.callback()
	try {
		h.writer.update('latest'); h.mark(false); h.writer.flushLater()
		assert.deepEqual(h.writes, ['latest']); assert.equal(h.jobs[0].cancelled, 1)
		h.jobs[0].callback(); assert.deepEqual(h.writes, ['latest'])
	} finally { h.writer.dispose() }
})

const nativeSource = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
function nativeFixture() {
	let adapter: any, acquired: any
	const center: any = {
		addObserverForNameObjectQueueUsingBlock(_name, _window, _queue, callback) {
			assert.equal(this, center); acquired = { callback, removed: 0 }; callback(); return acquired
		},
		removeObserver(token) { assert.equal(this, center); token.removed++ },
	}
	const host = { defaultCenter: center }, window = {}, view: any = { window }, node: any = { type: 'textfield', view }
	const body = nativeSource.slice(nativeSource.indexOf('function updateNativeTextValue('), nativeSource.indexOf('function syncTextControlState('))
	const { updateNativeTextValue } = runSlice(body + '\n({ updateNativeTextValue })', {
		setTextValue: (_view, _value, create) => { adapter = create() },
		NSNotificationCenter: host, NSWindowDidUpdateNotification: 'update',
	})
	updateNativeTextValue(node, 'next')
	return { adapter, host, center, view, node, window, token: () => acquired }
}

test('native commit observation captures cleanup and guards setup, replaced windows/views and retirement', () => {
	const h = nativeFixture()
	let notices = 0
	const release = h.adapter.observeCommit(() => { notices++ }), token = h.token()
	assert.equal(notices, 0, 'registration callback is not ready')
	token.callback(); assert.equal(notices, 1)
	h.view.window = {}; token.callback(); assert.equal(notices, 1)
	h.view.window = h.window; h.node.view = {}; token.callback(); assert.equal(notices, 1)
	h.node.view = h.view
	h.center.removeObserver = () => assert.fail('new remover received old token')
	h.host.defaultCenter = {} as any
	release(); release(); token.callback()
	assert.equal(token.removed, 1); assert.equal(notices, 1)
})

test('native observation without a window or after acquisition replacement returns no false handle', () => {
	const h = nativeFixture(), add = h.center.addObserverForNameObjectQueueUsingBlock
	h.view.window = null
	assert.equal(h.adapter.observeCommit(() => assert.fail('missing window dispatched')), undefined)
	h.view.window = h.window
	h.center.addObserverForNameObjectQueueUsingBlock = function(...args) {
		const token = add.apply(this, args); h.node.view = {}; return token
	}
	assert.equal(h.adapter.observeCommit(() => assert.fail('replaced view dispatched')), undefined)
	const token = h.token(); assert.equal(token.removed, 1); token.callback()
})
