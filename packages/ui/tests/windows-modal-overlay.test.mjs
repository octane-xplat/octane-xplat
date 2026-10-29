import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, require, console) {
	const exports = {}
	const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText
	vm.runInNewContext(source, { exports, require, console })
	return exports
}

const settle = async () => {
	for (let i = 0; i < 8; i++) {
		await Promise.resolve()
	}
}

function fixture({ deferClose = false } = {}) {
	const state = { focus: [], errors: [], opened: 0, closed: 0, dismissed: 0, closers: [] }
	const console = { error: (...args) => state.errors.push(args) }
	const base = load('../src/overlay-lifetime-common.ts', undefined, console)
	const exits = load('../src/windows-overlay-exit.ts', undefined, console)
	const layers = load('../src/layer-stack.ts', undefined, console)
	const xamlRoot = {}
	const child = (enabled = true) => ({
		isEnabled: enabled,
		nativeViewProtected: { IsEnabled: enabled },
	})
	const main = child()
	const disabled = child(false)
	const shade = child()
	const children = [main, disabled, shade]
	const root = {
		_shadeCover: shade,
		nativeViewProtected: { XamlRoot: xamlRoot },
		eachChildView(callback) {
			for (const view of children.slice()) {
				callback(view)
			}
		},
		hasChild(view) {
			return children.includes(view)
		},
		getPopupIndex(view) {
			return children.includes(view) ? 0 : -1
		},
		removeChild(view) {
			const i = children.indexOf(view)
			if (i >= 0) {
				children.splice(i, 1)
			}
		},
		open(view) {
			state.opened++
			children.push(view)
			return Promise.resolve()
		},
		close(view) {
			state.closed++
			if (deferClose) {
				return new Promise((resolve) =>
					state.closers.push(() => {
						root.removeChild(view)
						resolve()
					}),
				)
			}
			root.removeChild(view)
			return Promise.resolve()
		},
	}
	const Microsoft = {
		UI: {
			Xaml: {
				FocusState: { Programmatic: 3 },
				Input: {
					KeyboardNavigationMode: { Cycle: 1 },
					FocusManager: {
						FindFirstFocusableElement(scope) {
							return scope
						},
						TryFocusAsync(scope, mode) {
							state.focus.push([scope, mode])
							return Promise.resolve({ Succeeded: true })
						},
					},
				},
			},
		},
	}
	const host = () => {
		const listeners = new Map()
		return {
			isLoaded: true,
			nativeViewProtected: { XamlRoot: xamlRoot, TabFocusNavigation: 0, IsHitTestVisible: true },
			on(name, callback) {
				listeners.set(name, callback)
			},
			off(name, callback) {
				if (listeners.get(name) === callback) {
					listeners.delete(name)
				}
			},
			listeners,
		}
	}
	const api = load(
		'../src/overlay-lifetime.windows.ts',
		(name) => {
			if (name === './overlay-lifetime-common') {
				return base
			}
			if (name === './windows-overlay-exit') {
				return exits
			}
			if (name === './layer-stack') {
				return layers
			}
			if (name === '@octane-xplat/platform/windows') {
				return { Microsoft, NSWinRT: { toPromise: (value) => Promise.resolve(value) } }
			}
			throw new Error(`Unexpected import ${name}`)
		},
		console,
	)
	const create = (view = host(), label = 'Dialog') => ({
		view,
		lifetime: api.createOverlayLifetime(root, view, null, label, () => {}),
	})
	return {
		state,
		main,
		disabled,
		shade,
		children,
		root,
		host,
		create,
		layers,
		Microsoft,
		exits,
		xamlRoot,
	}
}

test('Windows dialogs disable background, preserve shade, cycle Tab and focus inside after opening', async () => {
	const { create, main, disabled, shade, state } = fixture()
	const { view, lifetime } = create()
	lifetime.open()
	assert.equal(main.nativeViewProtected.IsEnabled, false)
	assert.equal(disabled.nativeViewProtected.IsEnabled, false)
	assert.equal(shade.nativeViewProtected.IsEnabled, true)
	await settle()
	assert.equal(view.nativeViewProtected.TabFocusNavigation, 1)
	assert.deepEqual(state.focus, [[view.nativeViewProtected, 3]])
	lifetime.close()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.equal(disabled.nativeViewProtected.IsEnabled, false)
	assert.equal(view.nativeViewProtected.TabFocusNavigation, 0)
	assert.equal(view.listeners.has('keyDown'), false)
	lifetime.close()
	assert.equal(state.closed, 1)
})

test('Windows non-dialog overlays retain their original host behavior', async () => {
	const { create, main, state } = fixture()
	const { view, lifetime } = create(undefined, 'Popover')
	lifetime.open()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.equal(view.listeners.has('keyDown'), false)
	assert.deepEqual(state.focus, [])
})

test('Windows modal Escape uses portable top-layer close/block and IME ownership', async () => {
	for (const [behavior, originalKey, expected] of [
		['close', 27, 1],
		['block', 27, 0],
		['close', 229, 0],
	]) {
		const { create, layers, state, root } = fixture()
		layers.registerLayer({
			token: {},
			depth: 0,
			keyScope: () => root,
			behavior,
			dismiss() {
				state.dismissed++
			},
		})

		const { view, lifetime } = create()
		lifetime.open()
		await settle()
		let prevented = 0
		const callback = view.listeners.get('keyDown')
		callback({
			nativeEvent: { Key: 27, OriginalKey: originalKey },
			preventDefault() {
				prevented++
			},
		})

		assert.equal(state.dismissed, expected)
		assert.equal(prevented, 1)
		lifetime.close()
		callback({
			nativeEvent: { Key: 27 },
			preventDefault() {
				prevented++
			},
		})

		assert.equal(prevented, 1)
	}
})

test('Windows nested/out-of-order modal cleanup keeps shared background disabled', async () => {
	const { create, main, state } = fixture()
	const a = create()
	a.lifetime.open()
	await settle()
	const b = create()
	b.lifetime.open()
	await settle()
	assert.equal(state.opened, 2)
	assert.deepEqual(state.errors, [])
	a.lifetime.close()
	assert.equal(main.nativeViewProtected.IsEnabled, false)
	b.lifetime.close()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
})

test('Windows modal cleanup preserves an application-disabled background model', async () => {
	const { create, main } = fixture()
	const { lifetime } = create()
	lifetime.open()
	await settle()
	main.isEnabled = false
	lifetime.close()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, false)
})

test('Windows modal partial setup failure releases every acquired background', async () => {
	const { create, children, main, state } = fixture()
	children.push({
		nativeViewProtected: {
			get IsEnabled() {
				return true
			},
			set IsEnabled(_) {
				throw new Error('retired')
			},
		},
	})
	const { lifetime } = create()
	lifetime.open()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.equal(state.opened, 0)
	assert.equal(state.errors.length, 1)
})

test('Windows modal missing/foreign XamlRoot rolls back without focusing', async () => {
	const { create, main, state } = fixture()
	const { view, lifetime } = create()
	view.nativeViewProtected.XamlRoot = {}
	lifetime.open()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.deepEqual(state.focus, [])
	assert.equal(view.listeners.has('keyDown'), false)
	assert.equal(view.nativeViewProtected.TabFocusNavigation, 0)
})

test('Windows modal cleanup attempts sibling restoration after a retired proxy throws', async () => {
	const { create, main, disabled, state } = fixture()
	const { lifetime } = create()
	lifetime.open()
	await settle()
	Object.defineProperty(disabled.nativeViewProtected, 'IsEnabled', {
		set() {
			throw new Error('retired')
		},
	})
	assert.doesNotThrow(() => lifetime.close())
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.equal(state.errors.length, 1)
})

test('Windows modal guards panel hit tests and descendant control focus separately', async () => {
	const { create, children, main, shade } = fixture()
	const panel = {
		nativeViewProtected: { IsHitTestVisible: true },
		eachChildView(callback) {
			callback(main)
		},
	}
	children.splice(0, children.length, panel, shade)
	const { lifetime } = create()
	lifetime.open()
	await settle()
	assert.equal(panel.nativeViewProtected.IsHitTestVisible, false)
	assert.equal(main.nativeViewProtected.IsEnabled, false)
	lifetime.close()
	await settle()
	assert.equal(panel.nativeViewProtected.IsHitTestVisible, true)
	assert.equal(main.nativeViewProtected.IsEnabled, true)
})

test('Windows modal respects a previously handled native Escape', async () => {
	const { create, layers, state, root } = fixture()
	layers.registerLayer({
		token: {},
		depth: 0,
		keyScope: () => root,
		behavior: 'close',
		dismiss() {
			state.dismissed++
		},
	})
	const { view, lifetime } = create()
	lifetime.open()
	await settle()
	view.listeners.get('keyDown')({
		nativeEvent: { Key: 27, Handled: true },
		preventDefault() {
			throw Error('claimed twice')
		},
	})
	assert.equal(state.dismissed, 0)
	lifetime.close()
})

test('Windows rejected initial focus releases modal guards instead of leaving a half-open modal', async () => {
	const { create, main, state, Microsoft } = fixture()
	Microsoft.UI.Xaml.Input.FocusManager.TryFocusAsync = () => Promise.resolve({ Succeeded: false })
	const { view, lifetime } = create()
	lifetime.open()
	await settle()
	assert.equal(main.nativeViewProtected.IsEnabled, true)
	assert.equal(view.listeners.has('keyDown'), false)
	assert.equal(state.closed, 1)
})

test('Windows dialogs without interactive content give their native host a temporary tab stop', async () => {
	const { create, state, Microsoft } = fixture()
	Microsoft.UI.Xaml.Input.FocusManager.FindFirstFocusableElement = () => null
	const { view, lifetime } = create()
	view.nativeViewProtected.IsTabStop = false
	lifetime.open()
	await settle()
	assert.equal(view.nativeViewProtected.IsTabStop, true)
	assert.deepEqual(state.focus, [[view.nativeViewProtected, 3]])
	lifetime.close()
	assert.equal(view.nativeViewProtected.IsTabStop, false)
})

test('Windows suffix type resolution keeps the common lifetime separate from the modal adapter', () => {
	const dir = mkdtempSync(join(tmpdir(), 'windows-modal-types-'))
	try {
		const env = join(dir, 'env.d.ts')
		writeFileSync(
			env,
			"declare const console: {error(...args:unknown[]):void};\ndeclare module '@octane-xplat/platform/windows' { export const Microsoft:any; export const NSWinRT:any; }\n",
		)

		const program = ts.createProgram({
			rootNames: [
				fileURLToPath(new URL('../src/overlay-lifetime.windows.ts', import.meta.url)),
				env,
			],
			options: {
				strict: true,
				noEmit: true,
				target: ts.ScriptTarget.ES2022,
				module: ts.ModuleKind.ESNext,
				moduleResolution: ts.ModuleResolutionKind.Bundler,
				moduleSuffixes: ['.windows', ''],
				lib: ['lib.es2022.d.ts'],
				types: [],
				skipLibCheck: true,
			},
		})

		const errors = ts
			.getPreEmitDiagnostics(program)
			.filter((item) => item.category === ts.DiagnosticCategory.Error)

		assert.deepEqual(
			errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')),
			[],
		)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})

test('Windows modal Escape selects its own root even when another window has a newer layer', async () => {
	const { create, layers, root, state } = fixture()
	let foreign = 0
	layers.registerLayer({
		token: {},
		depth: 0,
		keyScope: () => root,
		behavior: 'close',
		dismiss() {
			state.dismissed++
		},
	})
	layers.registerLayer({
		token: {},
		depth: 5,
		keyScope: () => ({ nativeViewProtected: { XamlRoot: {} } }),
		behavior: 'close',
		dismiss() {
			foreign++
		},
	})
	const { view, lifetime } = create()
	lifetime.open()
	await settle()
	let claimed = 0
	view.listeners.get('keyDown')({
		nativeEvent: { Key: 27 },
		preventDefault() {
			claimed++
		},
	})
	assert.equal(claimed, 1)
	assert.equal(state.dismissed, 1)
	assert.equal(foreign, 0)
	lifetime.close()
})

test('Portable layer key adapters without a scope retain global ownership and live scope metadata', () => {
	const { layers } = fixture()
	let selected = 0,
		scope = {}
	const token = {}
	layers.registerLayer({
		token,
		depth: 0,
		keyScope: () => scope,
		behavior: 'close',
		dismiss() {
			selected++
		},
	})
	const current = {}
	scope = current
	let claimed = 0
	layers.dispatchLayerKey({
		key: 'Escape',
		acceptScope: (value) => value === current,
		preventDefault() {
			claimed++
		},
	})
	assert.equal(claimed, 1)
	assert.equal(selected, 1)
	layers.dispatchLayerKey({
		key: 'Escape',
		preventDefault() {
			claimed++
		},
	})
	assert.equal(claimed, 2)
	assert.equal(selected, 2)
})

test('Windows modal focus barrier waits for native backdrop exit and remains scoped to its root', async () => {
	const { create, state, exits, xamlRoot, main } = fixture({ deferClose: true })
	const { lifetime } = create()
	lifetime.open()
	await settle()
	lifetime.close()
	assert.equal(main.nativeViewProtected.IsEnabled, false)
	let restored = 0
	exits.afterWindowsOverlayExit(xamlRoot, () => {
		assert.equal(main.nativeViewProtected.IsEnabled, true)
		restored++
	})
	assert.equal(restored, 0)
	let otherRoot = 0
	exits.afterWindowsOverlayExit({}, () => otherRoot++)
	assert.equal(otherRoot, 1)
	state.closers[0]()
	await settle()
	assert.equal(restored, 1)
})

test('Windows failed native close releases background guards and does not strand the focus barrier', async () => {
	for (const failure of ['throws', 'rejects']) {
		const { create, root, main, state, exits, xamlRoot } = fixture()
		const { lifetime, view } = create()
		lifetime.open()
		await settle()
		root.close = () => {
			if (failure === 'throws') {
				throw new Error('native close failed')
			}
			return Promise.reject(new Error('native close failed'))
		}

		lifetime.close()
		let restored = false
		exits.afterWindowsOverlayExit(xamlRoot, () => {
			assert.equal(main.nativeViewProtected.IsEnabled, true)
			restored = true
		})

		await settle()
		assert.equal(restored, true)
		assert.equal(main.nativeViewProtected.IsEnabled, true)
		assert.equal(root.hasChild(view), false)
		assert.equal(state.errors.length, 1)
	}
})
