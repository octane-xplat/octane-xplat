import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(
		new URL('../src/components/overlays/layer-keys.windows.ts', import.meta.url),
		'utf8',
	),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture(options = {}) {
	const pending = []
	const flush = () => {
		for (const callback of pending.splice(0)) {
			callback()
		}
	}
	const owner = { IsHostVisible: true, ContentIslandEnvironment: { AppWindowId: { Value: 7 } } }
	const state = { focus: [], captures: [], activationReads: [], primaryReads: 0, active: true }
	const control = (root = owner) => ({
		XamlRoot: root,
		IsLoaded: true,
		IsEnabled: true,
		Focus(value) {
			state.focus.push([this, value])
			return true
		},
	})
	const initial = control()
	const host = { nativeViewProtected: { XamlRoot: owner } }
	const Microsoft = {
		UI: {
			Xaml: {
				Input: {
					FocusManager: {
						GetFocusedElement() {
							throw new Error('Unscoped focus lookup is forbidden')
						},
						GetFocusedElementWithRoot(root) {
							state.captures.push(root)
							return initial
						},
					},
				},
				FocusState: { Programmatic: 3 },
			},
			Input: {
				InputActivationState: { Activated: 1 },
				InputActivationListener: {
					GetForWindowId(id) {
						state.activationReads.push(id)
						return { State: state.active ? 1 : 0 }
					},
				},
			},
		},
	}
	const Application = {
		getRootView() {
			state.primaryReads++
			return host
		},
	}
	const exits = {}
	const exitSource = ts.transpileModule(
		readFileSync(
			new URL('../src/components/overlays/windows-overlay-exit.ts', import.meta.url),
			'utf8',
		),
		{
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		},
	).outputText
	vm.runInNewContext(exitSource, { exports: exits })
	const exports = {}
	vm.runInNewContext(source, {
		exports,
		queueMicrotask: (callback) => pending.push(callback),
		require(id) {
			if (id === './windows-overlay-exit') {
				return exits
			}
			if (id === '@nativescript/core') {
				return { Application }
			}
			if (id === '@octane-xplat/platform/windows') {
				return { Microsoft }
			}
			throw new Error(`Unexpected import: ${id}`)
		},
	})
	const capture = (...args) => {
		const restore = exports.captureLayerFocus(...args)
		return () => {
			restore()
			if (options.flush !== false) {
				flush()
			}
		}
	}
	return { capture, flush, owner, initial, host, control, state, Microsoft, exits }
}

test('Windows layers restore the captured control only after checking the owning window', () => {
	const { capture, owner, initial, host, state } = fixture()
	const restore = capture(undefined, host)
	assert.deepEqual(state.captures, [owner])
	assert.deepEqual(state.focus, [])
	assert.deepEqual(state.activationReads, [])
	restore()
	assert.deepEqual(state.activationReads, [owner.ContentIslandEnvironment.AppWindowId])
	assert.deepEqual(state.focus, [[initial, 3]])
	assert.equal(state.primaryReads, 0)
})

test('Windows layers resolve the latest explicit NativeScript view or public handle on return', () => {
	for (const handle of [false, true]) {
		const { capture, host, control, state } = fixture()
		let target = undefined
		const restore = capture(() => target, host)
		const native = control()
		const view = { nativeViewProtected: native, isLoaded: true, isEnabled: true }
		target = handle ? { native: view } : view
		restore()
		assert.deepEqual(state.focus, [[native, 3]])
	}
})

test('Windows layers never fall back to primary focus for an unattached supplied host', () => {
	const { capture, control, state } = fixture()
	capture(() => control(), { nativeViewProtected: {} })()
	assert.deepEqual(state.focus, [])
	assert.deepEqual(state.captures, [])
	assert.equal(state.primaryReads, 0)
})

test('Windows layers capture the target root or primary root only when no host is supplied', () => {
	const { capture, owner, control, state } = fixture()
	const target = control()
	capture(() => ({ native: { nativeViewProtected: target } }))()
	assert.deepEqual(state.captures, [owner])
	assert.deepEqual(state.focus, [[target, 3]])
	assert.equal(state.primaryReads, 0)
	state.focus.length = 0
	capture()()
	assert.equal(state.primaryReads, 1)
	assert.equal(state.focus.length, 1)
})

test('Windows layers skip inactive and hidden owners and never query another window', () => {
	for (const reason of ['inactive', 'hidden', 'missing-window-id']) {
		const { capture, owner, host, state } = fixture()
		const restore = capture(undefined, host)
		if (reason === 'inactive') {
			state.active = false
		}

		if (reason === 'hidden') {
			owner.IsHostVisible = false
		}

		if (reason === 'missing-window-id') {
			delete owner.ContentIslandEnvironment.AppWindowId
		}

		restore()
		assert.deepEqual(state.focus, [])
		assert.equal(state.primaryReads, 0)
	}
})

test('Windows layers reject a foreign explicit target or a host moved to another XamlRoot', () => {
	for (const moved of ['target', 'host', 'captured-control']) {
		const { capture, initial, host, control, state } = fixture()
		const target = moved === 'target' ? control({}) : undefined
		const restore = capture(() => target, host)
		if (moved === 'host') {
			host.nativeViewProtected = { XamlRoot: {} }
		}

		if (moved === 'captured-control') {
			initial.XamlRoot = {}
		}

		restore()
		assert.deepEqual(state.focus, [])
	}
})

test('Windows layers skip unloaded or disabled views and controls without fallback', () => {
	for (const field of ['isLoaded', 'isEnabled', 'IsLoaded', 'IsEnabled']) {
		const { capture, host, control, state } = fixture()
		const native = control()
		const view = { nativeViewProtected: native }
		const restore = capture(() => ({ native: view }), host)
		if (field[0] === 'i') {
			view[field] = false
		} else {
			native[field] = false
		}

		restore()
		assert.deepEqual(state.focus, [])
	}
	const { capture, host, initial, state } = fixture()
	const restore = capture(undefined, host)
	initial.IsLoaded = false
	restore()
	assert.deepEqual(state.focus, [])
})

test('Windows layers fail closed when activation or focus projections are absent', () => {
	for (const missing of ['activation', 'state', 'focus-state', 'focus-method', 'capture']) {
		const { capture, host, initial, Microsoft, state } = fixture()
		if (missing === 'capture') {
			delete Microsoft.UI.Xaml.Input.FocusManager
		}

		const restore = capture(undefined, host)
		if (missing === 'activation') {
			delete Microsoft.UI.Input.InputActivationListener
		}

		if (missing === 'state') {
			delete Microsoft.UI.Input.InputActivationState
		}

		if (missing === 'focus-state') {
			delete Microsoft.UI.Xaml.FocusState
		}

		if (missing === 'focus-method') {
			delete initial.Focus
		}

		assert.doesNotThrow(restore)
		assert.deepEqual(state.focus, [])
	}
})

test('Windows layers tolerate retired proxies and failing target getters without fallback', () => {
	const { capture, host, initial, Microsoft, state } = fixture()
	const restore = capture(() => {
		throw new Error('retired ref')
	}, host)
	assert.doesNotThrow(restore)
	assert.deepEqual(state.focus, [])
	initial.Focus = () => {
		throw new Error('retired native')
	}
	assert.doesNotThrow(capture(undefined, host))
	Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElementWithRoot = () => {
		throw new Error('closed')
	}
	assert.doesNotThrow(capture(undefined, host))
	assert.equal(state.primaryReads, 0)
})

test('Windows focus return waits for modal background cleanup', () => {
	const { capture, flush, host, initial, state } = fixture({ flush: false })
	const restore = capture(undefined, host)
	initial.IsEnabled = false
	restore()
	assert.deepEqual(state.focus, [])
	initial.IsEnabled = true
	flush()
	assert.deepEqual(state.focus, [[initial, 3]])
})

test('Windows focus return rechecks activation when deferred restoration runs', () => {
	const { capture, flush, host, state } = fixture({ flush: false })
	capture(undefined, host)()
	state.active = false
	flush()
	assert.deepEqual(state.focus, [])
})

test('Windows explicit focus return survives a missing scoped snapshot projection', () => {
	const { capture, host, control, Microsoft, state } = fixture()
	Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElementWithRoot = () => {
		throw new Error('snapshot projection absent')
	}
	const target = control()
	capture(() => ({ native: { nativeViewProtected: target } }), host)()
	assert.deepEqual(state.focus, [[target, 3]])
	state.focus.length = 0
	capture(undefined, host)()
	assert.deepEqual(state.focus, [])
	assert.equal(state.primaryReads, 0)
})

test('Windows .NET focus capture supplies the owner to the scoped overload', () => {
	const { capture, owner, initial, host, Microsoft, state } = fixture()
	delete Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElementWithRoot
	Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElement = (...args) => {
		assert.deepEqual(args, [owner])
		return initial
	}
	capture(undefined, host)()
	assert.deepEqual(state.focus, [[initial, 3]])
	assert.equal(state.primaryReads, 0)
})

test('Windows rejects an ambiguous focus overload returning another root', () => {
	const { capture, control, host, Microsoft, state } = fixture()
	delete Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElementWithRoot
	Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElement = () => control({})
	capture(undefined, host)()
	assert.deepEqual(state.focus, [])
	assert.equal(state.primaryReads, 0)
})

test('Windows focus return waits for all native exits and rechecks target eligibility afterward', async () => {
	for (const disabled of [false, true]) {
		const { capture, owner, host, initial, state, exits } = fixture()
		let finishFirst, finishLast
		exits.trackWindowsOverlayExit(
			owner,
			new Promise((resolve) => {
				finishFirst = resolve
			}),
		)

		exits.trackWindowsOverlayExit(
			owner,
			new Promise((resolve) => {
				finishLast = resolve
			}),
		)

		capture(undefined, host)()
		assert.equal(state.focus.length, 0)
		finishFirst()
		for (let i = 0; i < 8; i++) {
			await Promise.resolve()
		}

		assert.equal(state.focus.length, 0)
		initial.IsEnabled = !disabled
		finishLast()
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}

		assert.equal(state.focus.length, disabled ? 0 : 1)
	}
})
