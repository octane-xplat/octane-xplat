import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function evaluate(file, dependencies = {}) {
	const exports = {}
	const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText
	vm.runInNewContext(code, {
		exports,
		require(id) {
			assert.ok(id in dependencies, `Unexpected import: ${id}`)
			return dependencies[id]
		},
	})
	return exports
}

const stateModule = evaluate('../src/scrollable-area-state.ts')
const refsModule = evaluate('../src/ref-list.ts')

// Scripted hook slots exercise source logic without claiming an Octane compiler,
// renderer or WinUI pass. This hook has no conditional or repeated hook calls.
function fixture() {
	const slots = []
	let cursor = 0
	let pending = []
	let writes = 0
	const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i])
	const hooks = {
		useRef(value) {
			return (slots[cursor++] ??= { current: value })
		},
		useState(value) {
			const cell = (slots[cursor++] ??= { value })
			return [
				cell.value,
				(next) => {
					cell.value = next
					writes++
				},
			]
		},
		useCallback(callback, deps) {
			const index = cursor++
			if (!same(slots[index]?.deps, deps)) {
				slots[index] = { deps, callback }
			}
			return slots[index].callback
		},
		useLayoutEffect(effect, deps) {
			const index = cursor++
			if (!same(slots[index]?.deps, deps)) {
				const old = slots[index]
				const cell = (slots[index] = { deps })
				pending.push(() => {
					old?.cleanup?.()
					cell.cleanup = effect()
				})
			}
		},
	}
	const { useScrollableArea } = evaluate('../src/use-scrollable-area.windows.tsrx', {
		octane: hooks,
		'./ref-list': refsModule,
		'./scrollable-area-state': stateModule,
	})
	return {
		render(options = {}) {
			cursor = 0
			const result = useScrollableArea(options)
			for (const effect of pending) {
				effect()
			}
			pending = []
			return result
		},
		unmount() {
			for (const slot of slots) {
				slot.cleanup?.()
			}
		},
		get writes() {
			return writes
		},
	}
}

function bind(refs, value) {
	for (const ref of refs) {
		if (typeof ref === 'function') {
			ref(value)
		} else {
			ref.current = value
		}
	}
}

const viewport = () => ({
	isLoaded: true,
	scrollWidth: 400,
	clientWidth: 100,
	scrollLeft: 0,
	scrollHeight: 600,
	clientHeight: 200,
	scrollTop: 0,
})

const snapshot = (area) => JSON.parse(JSON.stringify(area.state))
const axis = (isScrollable, atStart, atEnd) => ({ isScrollable, atStart, atEnd })

test('Windows scroll state follows content growth and shrink without viewport resize', () => {
	const f = fixture()
	const area = f.render()
	const view = viewport()
	view.scrollHeight = view.clientHeight
	const content = {}
	const vp = area.getViewportProps()
	const cp = area.getContentProps()
	bind(vp.ref, view)
	bind(cp.ref, content)
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
	view.scrollHeight = 600
	cp.onLayoutChanged({ object: content })
	assert.deepEqual(snapshot(area).block, axis(true, true, false))
	view.scrollTop = 400
	vp.onScroll({ object: view })
	assert.deepEqual(snapshot(area).block, axis(true, false, true))
	view.scrollHeight = 100
	cp.onLayoutChanged({ object: content })
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
})

test('Windows scroll callbacks observe fresh state and layout does not synthesize scroll', () => {
	const area = fixture().render()
	const view = viewport()
	const content = {}
	const seen = []
	const vp = area.getViewportProps({
		onScroll(event) {
			seen.push(['scroll', event, area.state.block.atEnd])
		},
		onLayoutChanged(event) {
			seen.push(['viewport', event])
		},
	})
	const cp = area.getContentProps({
		onLayoutChanged(event) {
			seen.push(['content', event])
		},
	})
	bind(vp.ref, view)
	bind(cp.ref, content)
	view.scrollTop = 400
	const scroll = { object: view }
	vp.onScroll(scroll)
	const layout = { object: view }
	vp.onLayoutChanged(layout)
	const growth = { object: content }
	cp.onLayoutChanged(growth)
	assert.deepEqual(seen, [
		['scroll', scroll, true],
		['viewport', layout],
		['content', growth],
	])
})

test('Windows scroll updates axis and caller handlers without retaining old closures', () => {
	const f = fixture()
	const first = f.render({ axis: 'block' })
	const old = []
	const current = []
	const view = viewport()
	const props = first.getViewportProps({ onScroll: () => old.push('old') })
	bind(props.ref, view)
	const second = f.render({ axis: 'inline' })
	const next = second.getViewportProps({ onScroll: () => current.push('new') })
	assert.equal(next.onScroll, props.onScroll)
	assert.equal(next.ref, props.ref)
	props.onScroll({ object: view })
	assert.deepEqual(old, [])
	assert.deepEqual(current, ['new'])
	assert.deepEqual(snapshot(second), {
		inline: axis(true, true, false),
		block: axis(false, true, true),
	})
})

test('Windows scroll props preserve caller data and compose nested callback/object refs', () => {
	const area = fixture().render()
	const view = viewport()
	const objectRef = { current: null }
	const callback = []
	const refs = [[(value) => callback.push(value)], objectRef]
	const style = { height: 200 }
	const props = area.getViewportProps({
		ref: refs,
		style,
		orientation: 'horizontal',
		testID: 'notes',
	})
	assert.equal(props.style, style)
	assert.equal(props.orientation, 'horizontal')
	assert.equal(props.testID, 'notes')
	bind(props.ref, view)
	assert.equal(objectRef.current, view)
	assert.deepEqual(callback, [view])
	assert.equal(area.getViewportProps({ ref: refs }).ref, props.ref)
	bind(props.ref, null)
	assert.equal(objectRef.current, null)
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
})

test('Windows scroll normalizes invalid ranges and clamps overscroll in layout units', () => {
	const area = fixture().render({ axis: 'both' })
	const view = viewport()
	const props = area.getViewportProps()
	bind(props.ref, view)
	view.scrollLeft = -50
	view.scrollTop = 900
	props.onScroll({ object: view })
	assert.deepEqual(snapshot(area), {
		inline: axis(true, true, false),
		block: axis(true, false, true),
	})
	view.scrollWidth = Infinity
	view.scrollHeight = NaN
	props.onLayoutChanged({ object: view })
	assert.deepEqual(snapshot(area), {
		inline: axis(false, true, true),
		block: axis(false, true, true),
	})
	view.scrollWidth = 101
	view.scrollHeight = 201
	props.onLayoutChanged({ object: view })
	assert.deepEqual(snapshot(area).inline, axis(false, true, true))
	view.clientWidth = -1
	view.clientHeight = Infinity
	props.onLayoutChanged({ object: view })
	assert.deepEqual(snapshot(area), {
		inline: axis(false, true, true),
		block: axis(false, true, true),
	})
})

test('Windows scroll ignores retired hosts and clears state on detach or failed geometry', () => {
	const area = fixture().render()
	const first = viewport()
	const second = viewport()
	const calls = []
	const props = area.getViewportProps({ onScroll: () => calls.push('scroll') })
	bind(props.ref, first)
	bind(props.ref, second)
	first.scrollTop = 400
	props.onScroll({ object: first })
	assert.deepEqual(calls, [])
	assert.deepEqual(snapshot(area).block, axis(true, true, false))
	second.isLoaded = false
	props.onLayoutChanged({ object: second })
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
	second.isLoaded = true
	Object.defineProperty(second, 'scrollHeight', {
		get() {
			throw new Error('retired proxy')
		},
	})
	assert.doesNotThrow(() => props.onLayoutChanged({ object: second }))
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
	bind(props.ref, null)
	props.onScroll({ object: second })
	assert.deepEqual(calls, [])
})

test('Windows scroll coalesces unchanged measurements and stops callbacks after unmount', () => {
	const f = fixture()
	const area = f.render()
	const view = viewport()
	const content = {}
	const calls = []
	const vp = area.getViewportProps({ onScroll: () => calls.push('scroll') })
	const cp = area.getContentProps({ onLayoutChanged: () => calls.push('content') })
	bind(vp.ref, view)
	bind(cp.ref, content)
	const writes = f.writes
	vp.onLayoutChanged({ object: view })
	cp.onLayoutChanged({ object: content })
	assert.equal(f.writes, writes)
	assert.deepEqual(calls, ['content'])
	calls.length = 0
	f.unmount()
	view.scrollTop = 400
	vp.onScroll({ object: view })
	cp.onLayoutChanged({ object: content })
	assert.deepEqual(calls, [])
	assert.equal(f.writes, writes)
})

test('Windows scroll measures late load and reload while preserving caller lifecycle handlers', () => {
	const area = fixture().render()
	const view = viewport()
	view.isLoaded = false
	const events = []
	const props = area.getViewportProps({
		onLoaded: (event) => events.push(['loaded', event, area.state.block.isScrollable]),
		onUnloaded: (event) => events.push(['unloaded', event, area.state.block.isScrollable]),
	})
	bind(props.ref, view)
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
	view.isLoaded = true
	const loaded = { object: view }
	props.onLoaded(loaded)
	assert.deepEqual(snapshot(area).block, axis(true, true, false))
	view.isLoaded = false
	const unloaded = { object: view }
	props.onUnloaded(unloaded)
	assert.deepEqual(snapshot(area).block, axis(false, true, true))
	view.isLoaded = true
	props.onLoaded(loaded)
	assert.deepEqual(events, [
		['loaded', loaded, true],
		['unloaded', unloaded, false],
		['loaded', loaded, true],
	])
})
