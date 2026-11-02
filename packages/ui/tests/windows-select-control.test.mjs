import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = ts.transpileModule(
	readFileSync(
		new URL('../src/components/forms/select-control.windows.ts', import.meta.url),
		'utf8',
	),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	const types = new Map(),
		tasks = new Map(),
		calls = [],
		openCalls = [],
		combos = []
	let taskId = 0
	class View {
		children = []
		isEnabled = true
		isLoaded = false
		eachChildView(callback) {
			for (const child of this.children) {
				if (callback(child) === false) {
					break
				}
			}
		}
		onLoaded() {
			this.isLoaded = true
		}
		onUnloaded() {
			this.isLoaded = false
		}
		_removeViewFromNativeVisualTree() {}
		disposeNativeView() {}
		_tearDownUI() {
			for (const child of this.children) {
				this._removeViewFromNativeVisualTree(child)
			}
			this.disposeNativeView()
		}
	}
	class Panel {
		get Margin() {
			return (this.target ?? this).nativeMargin ?? { Left: 0, Top: 0, Right: 0, Bottom: 0 }
		}
		set Margin(value) {
			;(this.target ?? this).nativeMargin = value
		}
		get Name() {
			return (this.target ?? this).nativeName ?? ''
		}
		get Visibility() {
			return (this.target ?? this).nativeVisibility ?? 0
		}
		set Visibility(value) {
			;(this.target ?? this).nativeVisibility = value
		}
		get Opacity() {
			return (this.target ?? this).nativeOpacity ?? 1
		}
		set Opacity(value) {
			;(this.target ?? this).nativeOpacity = value
		}
		Children = []
		constructor() {
			this.Children.Append = (value) => this.Children.push(value)
			this.Children.Clear = () => {
				this.Children.length = 0
			}
		}
	}
	class Property {
		constructor(options) {
			this.options = options
		}
		register(Type) {
			const { name, valueChanged } = this.options,
				key = Symbol(name)
			Object.defineProperty(Type.prototype, name, {
				get() {
					return this[key]
				},
				set(value) {
					this[key] = value
					valueChanged(this)
				},
			})
		}
	}
	class Item {
		set Content(value) {
			if (this.content) {
				this.content.Parent = undefined
			}
			if (value?.Parent) {
				throw Error('already parented')
			}
			this.content = value
			if (value) {
				value.Parent = this
			}
		}
		get Content() {
			return this.content
		}
	}
	class Combo {
		ApplyTemplate() {}
		index = -1
		open = false
		eventDepth = 0
		reentrantWrites = []
		constructor(xaml) {
			this.xaml = xaml
			this.items = [...xaml.matchAll(/x:Name="XplatOption\d+"/g)].map(() => new Item())
			combos.push(this)
		}
		FindName(name) {
			return this.items[Number(name.replace('XplatOption', ''))]
		}
		get SelectedIndex() {
			return this.index
		}
		set SelectedIndex(value) {
			if (value === this.index) {
				return
			}
			if (this.eventDepth) {
				this.reentrantWrites.push(value)
			}
			this.index = value
			this.eventDepth++
			try {
				this.SelectionChanged?.()
			} finally {
				this.eventDepth--
			}
		}
		get IsDropDownOpen() {
			return this.open
		}
		set IsDropDownOpen(value) {
			if (value === this.open) {
				return
			}
			this.open = value
			this.eventDepth++
			try {
				;(value ? this.DropDownOpened : this.DropDownClosed)?.()
			} finally {
				this.eventDepth--
			}
		}
	}
	const Microsoft = {
		UI: {
			Xaml: {
				Controls: { Grid: Panel },
				Visibility: { Collapsed: 1 },
				Media: {
					VisualTreeHelper: {
						GetChildrenCount: (node) => (node.target ?? node).visualChildren?.length ?? 0,
						GetChild: (node, index) => ({ target: (node.target ?? node).visualChildren[index] }),
					},
				},
				Markup: { XamlReader: { Load: (x) => new Combo(x) } },
				Automation: {
					AutomationProperties: {
						SetName: (p, n) => (p.name = n),
						SetAutomationId: (p, n) => (p.id = n),
					},
				},
			},
		},
	}
	vm.runInNewContext(source, {
		exports: {},
		setTimeout: (callback) => {
			tasks.set(++taskId, callback)
			return taskId
		},
		clearTimeout: (id) => tasks.delete(id),
		require: (name) => {
			if (name === '@nativescript/core') {
				return { View, ContentView: View, LayoutBase: View, Property }
			}
			if (name === '@nativescript-community/octane') {
				return { registerElement: (name, Type) => types.set(name, Type) }
			}
			if (name === '@octane-xplat/platform/windows') {
				return { Microsoft, NSWinRT: { asDelegate: (_type, callback) => callback } }
			}
			throw Error(name)
		},
	})
	const Control = types.get('xplatwindowsselect'),
		Option = types.get('xplatwindowsselectoption'),
		control = new Control()
	control.settings = {
		value: 'a',
		open: false,
		blocked: false,
		label: 'Choice',
		maxMenuHeight: 200,
		onPick: (value) => calls.push(value),
		onOpenChange: (value) => openCalls.push(value),
	}
	control.nativeViewProtected = control.createNativeView()
	function option(value, disabled = false, index = control.children.length) {
		const view = new Option()
		view.settings = { value, label: value.toUpperCase(), disabled }
		view.id = 'option-' + value
		view.nativeViewProtected = new Panel()
		control.children.splice(index, 0, view)
		assert.equal(control._addViewToNativeVisualTree(view), true)
		return view
	}
	function update(props) {
		control.settings = { ...control.settings, ...props }
	}
	function flush() {
		for (const [id, callback] of [...tasks]) {
			tasks.delete(id)
			callback()
		}
	}
	function remove(view) {
		control._removeViewFromNativeVisualTree(view)
		control.children.splice(control.children.indexOf(view), 1)
	}
	return {
		control,
		option,
		update,
		flush,
		remove,
		calls,
		openCalls,
		combos,
		tasks,
		get combo() {
			return control.nativeViewProtected.Children[0]
		},
	}
}

test('Windows Selector retains shared content and rolls rejected native selection back after the event', () => {
	const f = fixture(),
		a = f.option('a')
	f.option('disabled', true)
	const b = f.option('b')
	f.control.onLoaded()
	assert.equal(a.peer.Content, a.nativeViewProtected)
	assert.equal(b.peer.name, 'B')
	assert.equal(b.peer.id, 'option-b')
	assert.equal(f.combo.SelectedIndex, 0)
	assert.equal(a.peer.IsTabStop, true)
	assert.equal(b.peer.IsTabStop, true)
	f.combo.SelectedIndex = 2
	assert.deepEqual(f.calls, ['b'])
	assert.deepEqual(f.combo.reentrantWrites, [])
	assert.equal(f.combo.SelectedIndex, 2)
	f.flush()
	assert.equal(f.combo.SelectedIndex, 0)
	assert.deepEqual(f.calls, ['b'])
	f.update({
		onPick: (value) => {
			f.calls.push('new:' + value)
			f.update({ value, open: false })
		},
	})
	f.combo.SelectedIndex = 2
	assert.deepEqual(f.combo.reentrantWrites, [])
	f.flush()
	assert.equal(f.combo.SelectedIndex, 2)
	assert.deepEqual(f.calls, ['b', 'new:b'])
})

test('Windows Selector reports native popup intent once and respects controlled open state', () => {
	const f = fixture()
	f.option('a')
	f.option('b')
	f.control.onLoaded()
	f.combo.IsDropDownOpen = true
	assert.deepEqual(f.openCalls, [true])
	f.flush()
	assert.equal(f.combo.IsDropDownOpen, false)
	f.update({ open: true })
	assert.deepEqual(f.openCalls, [true])
	assert.equal(f.combo.IsDropDownOpen, true)
	f.update({
		onOpenChange: (open) => {
			f.openCalls.push(open)
			f.update({ open })
		},
	})
	f.combo.IsDropDownOpen = false
	f.flush()
	assert.deepEqual(f.openCalls, [true, false])
	assert.equal(f.combo.IsDropDownOpen, false)
})

test('Windows Selector rejects disabled items and blocked commits and resets names and menu limits', () => {
	const f = fixture()
	const a = f.option('a'),
		disabled = f.option('disabled', true),
		b = f.option('b')
	f.control.onLoaded()
	assert.equal(disabled.peer.IsEnabled, false)
	assert.equal(disabled.peer.IsTabStop, false)
	f.combo.SelectedIndex = 1
	f.flush()
	assert.deepEqual(f.calls, [])
	assert.equal(f.combo.SelectedIndex, 0)
	f.update({ blocked: true, open: true, label: 'Updated', maxMenuHeight: 150 })
	assert.equal(f.combo.IsEnabled, false)
	assert.equal(f.combo.IsDropDownOpen, false)
	assert.equal(f.combo.name, 'Updated')
	assert.equal(f.combo.MaxDropDownHeight, 150)
	f.combo.SelectedIndex = 2
	f.flush()
	assert.deepEqual(f.calls, [])
	assert.equal(f.combo.SelectedIndex, 0)
	f.update({ blocked: false, value: 'b' })
	assert.equal(f.combo.IsEnabled, true)
	assert.equal(f.combo.SelectedIndex, 2)
	b.settings = { ...b.settings, label: 'B revised', disabled: true }
	assert.equal(b.peer.name, 'B revised')
	assert.equal(b.peer.IsEnabled, false)
	assert.equal(a.peer.IsTabStop, true)
})

test('Windows Selector rebuilds structural changes without duplicate parenting or stale events', () => {
	const f = fixture(),
		a = f.option('a'),
		b = f.option('b')
	f.control.onLoaded()
	const old = f.combo,
		stale = old.SelectionChanged
	f.option('new', false, 1)
	assert.notEqual(f.combo, old)
	assert.equal(a.peer.Content, a.nativeViewProtected)
	assert.equal(b.peer.Content, b.nativeViewProtected)
	assert.equal(old.SelectionChanged, null)
	assert.equal(old.DropDownOpened, null)
	stale()
	assert.deepEqual(f.calls, [])
	f.update({ value: 'b' })
	assert.equal(f.combo.SelectedIndex, 2)
	f.remove(a)
	assert.equal(f.combo.SelectedIndex, 1)
	f.combo.SelectedIndex = 0
	assert.equal(f.tasks.size, 1)
	const late = f.combo.SelectionChanged
	f.control.onUnloaded()
	assert.equal(f.tasks.size, 0)
	late()
	assert.deepEqual(f.calls, ['new'])
	f.control.onLoaded()
	assert.equal(f.combo.SelectedIndex, 1)
	f.control._tearDownUI()
	assert.equal(f.tasks.size, 0)
	assert.equal(b.owner, undefined)
	assert.equal(b.peer, undefined)
})

test('Windows Selector unmount inside a selection callback cannot restart retired timers', () => {
	const f = fixture()
	f.option('a')
	f.option('b')
	f.control.onLoaded()
	const combo = f.combo
	f.update({
		onPick: () => {
			f.control.onUnloaded()
			f.control._tearDownUI()
		},
	})
	combo.SelectedIndex = 1
	assert.equal(f.tasks.size, 0)
	assert.equal(combo.SelectionChanged, null)
	assert.equal(combo.DropDownOpened, null)
	assert.equal(combo.DropDownClosed, null)
})

test('Windows Selector borrows typed accessors for base wrappers and leaves popup content intact', () => {
	const f = fixture()
	f.option('a')
	f.control.onLoaded()
	const caption = { nativeName: 'ContentPresenter', nativeOpacity: 1 },
		glyph = { nativeName: 'DropDownGlyph', nativeVisibility: 0, nativeOpacity: 1 },
		highlight = {
			nativeName: 'HighlightBackground',
			nativeVisibility: 0,
			nativeMargin: { Left: -4, Top: -4, Right: -4, Bottom: -4 },
		},
		background = { nativeName: 'Background', nativeOpacity: 1 }
	const optionContent = { nativeName: 'ContentPresenter', nativeOpacity: 1 },
		popup = { nativeName: 'Popup', visualChildren: [optionContent] }
	f.combo.visualChildren = [
		{ nativeName: 'LayoutRoot', visualChildren: [caption, glyph, highlight, background, popup] },
	]
	const stale = f.combo.LayoutUpdated
	stale()
	assert.equal(caption.nativeOpacity, 0)
	assert.equal(glyph.nativeVisibility, 0)
	assert.equal(glyph.nativeOpacity, 0)
	assert.equal(highlight.nativeVisibility, 0)
	assert.deepEqual({ ...highlight.nativeMargin }, { Left: 0, Top: 0, Right: 0, Bottom: 0 })
	assert.equal(background.nativeOpacity, 0)
	assert.equal(optionContent.nativeOpacity, 1)
	f.control.onUnloaded()
	caption.nativeOpacity = 1
	stale()
	assert.equal(caption.nativeOpacity, 1)
	assert.equal(f.combo.LayoutUpdated, null)
})
