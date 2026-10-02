import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
// Isolate the imperative service from its AppKit-rendered content wrapper.
const source = readFileSync(
	new URL('../src/bottom-sheet-service.macos.ts', import.meta.url),
	'utf8',
).replace(
	"import { ImperativeSheetPanel } from './bottom-sheet-panel.macos.tsrx'",
	'const ImperativeSheetPanel = () => null',
)

const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
}).outputText

const { openBottomSheet, closeBottomSheet, bottomSheetHost } = await import(
	`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test('AppKit imperative sheets preserve results and close the latest sheet first', async () => {
	const opened = []
	globalThis.__xplatAppKit = {
		presentSurface(options) {
			let resolve
			const controller = {
				closes: 0,
				closedPromise: new Promise((r) => {
					resolve = r
				}),
				close() {
					this.closes++
					resolve()
				},
			}

			opened.push({ options, controller })
			return controller
		},
	}

	const first = openBottomSheet(
		() => null,
		{ id: 1 },
		{ snapPoints: ['25%', 300], hasScrim: false, label: 'Choose' },
	)

	const second = openBottomSheet(() => null)
	assert.deepEqual(opened[0].options.props.params, { id: 1 })
	assert.equal(opened[0].options.modal, false)
	assert.deepEqual(opened[0].options.snapPoints, ['25%', 300])
	closeBottomSheet('second')
	assert.equal(await second, 'second')
	assert.equal(opened[0].controller.closes, 0)
	opened[0].options.props.close('first')
	assert.equal(await first, 'first')
	closeBottomSheet('again')
	assert.equal(
		opened.every((entry) => entry.controller.closes === 1),
		true,
	)

	assert.equal(bottomSheetHost(), null)
})

test('content can close synchronously while mounting without leaving an active sheet', async () => {
	let closes = 0
	globalThis.__xplatAppKit = {
		presentSurface(options) {
			options.props.close('during render')
			return {
				close() {
					closes++
				},
				closedPromise: Promise.resolve(),
			}
		},
	}

	assert.equal(await openBottomSheet(() => null), 'during render')
	await Promise.resolve()
	closeBottomSheet()
	assert.equal(closes, 1)
})

test('user and owner close settle once; failed mount rejects without an active entry', async () => {
	let options, resolve
	globalThis.__xplatAppKit = {
		presentSurface(next) {
			options = next
			return {
				close() {},
				closedPromise: new Promise((r) => {
					resolve = r
				}),
			}
		},
	}

	const pending = openBottomSheet(() => null)
	options.onDismiss()
	resolve()
	assert.equal(await pending, 'closed')
	globalThis.__xplatAppKit.presentSurface = () => {
		throw new Error('mount failed')
	}

	await assert.rejects(
		openBottomSheet(() => null),
		/mount failed/,
	)

	closeBottomSheet()
	delete globalThis.__xplatAppKit
	await assert.rejects(
		openBottomSheet(() => null),
		/no shared sheet presenter/,
	)
})
