import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const patches = new URL('../tools/platform-qualification/patches/windows-layout/', import.meta.url)
const added = (name) =>
	readFileSync(new URL(name, patches), 'utf8')
		.split('\n')
		.filter((line) => line.startsWith('+') && !line.startsWith('+++'))
		.map((line) => line.slice(1))
		.join('\n')
const emit = (source) =>
	ts.transpileModule(source, {
		compilerOptions: {
			target: ts.ScriptTarget.ES2017,
			module: ts.ModuleKind.ESNext,
			useDefineForClassFields: false,
			removeComments: true,
		},
	}).outputText
const source = emit(
	`class FlexboxLayout extends FlexboxLayoutBase {${added('core-preferred-source.patch')}}`,
)
const packaged = emit(
	`class FlexboxLayout extends FlexboxLayoutBase {${added('core-preferred-package.patch')}}`,
)

test('preferred-size source and package patches contain the same lifecycle', () => {
	assert.equal(source, packaged)
})

function harness(code, available = true) {
	class Base {
		_addViewToNativeVisualTree(child) {
			if (child.rejectInsertion) {
				return false
			}
			child.parent = this
			return true
		}
		_removeViewFromNativeVisualTree(child) {
			child.parent = undefined
		}
		disposeNativeView() {
			this.preferredCountAtBaseDisposal = this._preferredChildren.size
			this.disposed = true
		}
	}
	const writes = []
	const widget = available
		? Object.fromEntries(
				['Width', 'Height'].flatMap((axis) => [
					['GetPreferred' + axis, (native) => native['preferred' + axis] ?? -1],
					[
						'SetPreferred' + axis,
						(native, value) => {
							native['preferred' + axis] = value
							writes.push({ native, axis, value })
						},
					],
				]),
			)
		: {}
	const Parent = vm.runInNewContext(code + '\nFlexboxLayout', {
		FlexboxLayoutBase: Base,
		FlexboxWidget: widget,
	})
	const child = () => ({
		nativeViewProtected: { Width: 100, Height: 10 },
		style: {
			width: 100,
			height: 10,
			listeners: new Map(),
			on(name, callback) {
				if (!this.listeners.has(name)) {
					this.listeners.set(name, new Set())
				}
				this.listeners.get(name).add(callback)
			},
			off(name, callback) {
				const callbacks = this.listeners.get(name)
				callbacks?.delete(callback)
				if (!callbacks?.size) {
					this.listeners.delete(name)
				}
			},
			set(name, value) {
				this[name] = value
				for (const callback of this.listeners.get(name + 'Change') ?? []) {
					callback()
				}
			},
		},
	})
	return { Parent, child, writes }
}

// These execute the real patch methods against a small parent/style protocol.
// Native sizing and WinUI arrangement require the packaged legacy-layout driver.
for (const [name, code] of Object.entries({ source, package: packaged })) {
	test(`${name}: fixed dimensions update without duplicate writes or listeners`, () => {
		const { Parent, child, writes } = harness(code)
		const parent = new Parent(),
			view = child()
		assert.equal(parent._addViewToNativeVisualTree(view), true)
		assert.equal(view.nativeViewProtected.preferredWidth, 100)
		assert.equal(view.nativeViewProtected.preferredHeight, 10)
		assert.equal(view.style.listeners.size, 2)
		view.style.set('width', 100)
		assert.equal(writes.length, 2)
		view.style.set('width', 120)
		view.style.set('height', 20)
		assert.equal(view.nativeViewProtected.preferredWidth, 120)
		assert.equal(view.nativeViewProtected.preferredHeight, 20)
		assert.equal(parent._preferredChildren.size, 1)
	})

	test(`${name}: removal restores fixed constraints and preserves unrelated listeners`, () => {
		const { Parent, child, writes } = harness(code)
		const parent = new Parent(),
			view = child()
		const unrelated = () => {}
		view.style.on('widthChange', unrelated)
		parent._addViewToNativeVisualTree(view)
		const stale = parent._preferredChildren.get(view).sync
		view.style.set('width', 120)
		view.nativeViewProtected.Width = NaN
		view.nativeViewProtected.Height = NaN
		parent._removeViewFromNativeVisualTree(view)
		assert.equal(view.nativeViewProtected.Width, 120)
		assert.equal(view.nativeViewProtected.Height, 10)
		assert.equal(view.nativeViewProtected.preferredWidth, -1)
		assert.equal(view.nativeViewProtected.preferredHeight, -1)
		assert.equal(parent._preferredChildren.size, 0)
		assert.deepEqual([...view.style.listeners.get('widthChange')], [unrelated])
		assert.equal(view.style.listeners.has('heightChange'), false)
		const count = writes.length
		stale()
		assert.equal(writes.length, count)
	})

	test(`${name}: percent, auto and invalid dimensions stay outside fixed inputs`, () => {
		const { Parent, child } = harness(code)
		const parent = new Parent(),
			view = child()
		parent._addViewToNativeVisualTree(view)
		for (const value of [{ unit: '%', value: 0.5 }, 'auto', NaN, Infinity, -1, null]) {
			view.style.set('width', value)
			assert.equal(view.nativeViewProtected.preferredWidth, -1)
		}
		for (const value of [0, { unit: 'dip', value: 0 }]) {
			view.style.set('width', value)
			assert.equal(view.nativeViewProtected.preferredWidth, 0)
		}
	})

	test(`${name}: reparenting rejects old callbacks and recreates one owner`, () => {
		const { Parent, child, writes } = harness(code)
		const first = new Parent(),
			second = new Parent(),
			view = child()
		first._addViewToNativeVisualTree(view)
		const stale = first._preferredChildren.get(view).sync
		first._removeViewFromNativeVisualTree(view)
		view.style.set('width', 90)
		second._addViewToNativeVisualTree(view)
		const count = writes.length
		stale()
		assert.equal(writes.length, count)
		assert.equal(view.nativeViewProtected.preferredWidth, 90)
		assert.equal(first._preferredChildren.size, 0)
		assert.equal(second._preferredChildren.size, 1)
		assert.equal(view.style.listeners.get('widthChange').size, 1)
	})

	test(`${name}: changed native identity cannot write into a replacement view`, () => {
		const { Parent, child, writes } = harness(code)
		const parent = new Parent(),
			view = child()
		parent._addViewToNativeVisualTree(view)
		const stale = parent._preferredChildren.get(view).sync
		const replacement = { Width: 27, Height: 13 }
		view.nativeViewProtected = replacement
		const count = writes.length
		view.style.set('width', 90)
		parent._removeViewFromNativeVisualTree(view)
		stale()
		assert.deepEqual(replacement, { Width: 27, Height: 13 })
		assert.equal(writes.length, count)
		assert.equal(view.style.listeners.size, 0)
		assert.equal(parent._preferredChildren.size, 0)
	})

	test(`${name}: disposal releases every child before base disposal`, () => {
		const { Parent, child } = harness(code)
		const parent = new Parent(),
			views = [child(), child()]
		for (const view of views) {
			parent._addViewToNativeVisualTree(view)
		}
		parent.disposeNativeView()
		assert.equal(parent.disposed, true)
		assert.equal(parent.preferredCountAtBaseDisposal, 0)
		assert.equal(parent._preferredChildren.size, 0)
		for (const view of views) {
			assert.equal(view.style.listeners.size, 0)
			assert.equal(view.nativeViewProtected.preferredWidth, -1)
		}
	})

	test(`${name}: failed insertion and original Widgets do not install listeners`, () => {
		const { Parent, child } = harness(code)
		const parent = new Parent(),
			view = child()
		view.rejectInsertion = true
		assert.equal(parent._addViewToNativeVisualTree(view), false)
		assert.equal(view.style.listeners.size, 0)
		const old = harness(code, false),
			fallback = new old.Parent(),
			unpatched = old.child()
		assert.equal(fallback._addViewToNativeVisualTree(unpatched), true)
		assert.equal(unpatched.style.listeners.size, 0)
		assert.equal(unpatched.nativeViewProtected.Width, 100)
	})
}
