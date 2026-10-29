import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(
	new URL('../src/components/collections/list-viewability-observer.ios.ts', import.meta.url),
	'utf8',
)

const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

test('iOS list viewability observer registers lazily without NativeClass', () => {
	const scheduled = []
	const registrations = []
	const observed = []
	const removed = []
	const updates = []
	const context = vm.createContext({
		exports: {},
		interop: { types: { void: {}, id: {} } },
		require(name) {
			if (name === '@octane-xplat/platform/ios') {
				// Names resolve to the injected globals when the lazy
				// registration path runs.
				return new Proxy({}, { get: (_, prop) => context[prop] })
			}
			assert.equal(name, './list-viewability-runtime')
			return {
				observeLoadedListPeer: (_list, getPeer, attach) => attach(getPeer()),
			}
		},
		setTimeout(callback) {
			scheduled.push(callback)
			return scheduled.length
		},
		clearTimeout() {},
	})

	vm.runInContext(compiled, context)
	assert.equal('NativeClass' in context, false)
	assert.equal(registrations.length, 0)
	Object.assign(context, {
		NSObject: {
			extend(methods, options) {
				registrations.push({ methods, options })
				return {
					alloc: () => ({ init: () => Object.assign(Object.create(methods), { callback: null }) }),
				}
			},
		},
	})

	const table = {
		contentOffset: { y: 0 },
		adjustedContentInset: { top: 0, bottom: 0 },
		bounds: { size: { height: 50 } },
		indexPathsForVisibleRows: [{ row: 0 }],
		addObserverForKeyPathOptionsContext(observer, key) {
			observed.push({ observer, key })
		},
		removeObserverForKeyPath(observer, key) {
			removed.push({ observer, key })
		},
		rectForRowAtIndexPath: () => ({ origin: { y: 0 }, size: { height: 20 } }),
	}

	const subscription = context.exports.observeListViewability(
		{ ios: table },
		() => ({ items: ['Avery'], update: (rows) => updates.push(rows) }),
		() => {},
	)

	assert.equal(registrations.length, 1)
	assert.equal(registrations[0].options.name, 'XplatListViewabilityContentOffsetObserver')
	const selector = 'observeValueForKeyPath:ofObject:change:context:'
	assert.equal(typeof registrations[0].methods[selector], 'function')
	assert.equal(registrations[0].options.exposedMethods[selector].params.length, 4)
	assert.deepEqual(
		observed.map(({ key }) => key),
		['contentOffset', 'contentSize', 'bounds'],
	)

	scheduled.shift()()
	const observer = observed[0].observer
	observer[selector]('contentOffset', table, {}, null)
	scheduled.shift()()
	assert.equal(updates.length, 2)
	assert.equal(updates[1][0].index, 0)
	assert.equal(updates[1][0].visiblePercent, 100)

	subscription.dispose()
	assert.deepEqual(
		removed.map(({ key }) => key),
		['contentOffset', 'contentSize', 'bounds'],
	)
})
