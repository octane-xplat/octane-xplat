// Source/bridge regression only; no AppKit process or OS resize is exercised.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const eventContext = { exports: {} }
vm.runInNewContext(ts.transpile(
	await readFile(new URL('../../../apps/macos/src/platform-events.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
), eventContext)

async function installedHost() {
	const source = ts.transpile(
		await readFile(new URL('../../../apps/macos/src/appkit.ts', import.meta.url), 'utf8'),
		{ module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
	)
	const parsed = ts.createSourceFile('appkit.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
	const install = parsed.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'installPlatformServices')
	assert.ok(install)
	const window = {
		frame: { size: { width: 900, height: 650 } },
		contentView: { bounds: { size: { width: 900, height: 600 } } },
	}
	const services = { appState: 'active', primaryWindow: window, windowResizeListeners: new Set(), appStateListeners: new Set() }
	const hover = () => {}
	const context = {
		...eventContext.exports,
		__xplatAppKit: { observeHover: hover },
		shared: { running: true, platformServices: services },
		app: {},
		NSBundle: { mainBundle: {} },
		announceAppKit: () => {},
	}
	vm.runInNewContext(install.getText(parsed) + '\ninstallPlatformServices()', context)
	return { host: context.__xplatAppKit, services, window, hover }
}

test('AppKit host retains live accessors while preserving renderer services', async () => {
	const { host, services, hover } = await installedHost()
	assert.equal(host.observeHover, hover)
	assert.equal(typeof Object.getOwnPropertyDescriptor(host, 'windowSize').get, 'function')
	assert.equal(typeof Object.getOwnPropertyDescriptor(host, 'appState').get, 'function')
	assert.equal(host.appState, 'active')
	services.appState = 'inactive'
	assert.equal(host.appState, 'inactive')
})

test('AppKit window snapshots use content dimensions and stay stable until dimensions change', async () => {
	const { host, window } = await installedHost()
	const first = host.windowSize
	assert.equal(first.width, 900)
	assert.equal(first.height, 600)
	assert.equal(first.orientation, 'landscape')
	assert.equal(host.windowSize, first)
	window.contentView.bounds.size = { width: 400, height: 700 }
	const next = host.windowSize
	assert.notEqual(next, first)
	assert.equal(next.width, 400)
	assert.equal(next.height, 700)
	assert.equal(next.orientation, 'portrait')
	assert.equal(host.windowSize, next)
})

test('AppKit resize subscriptions read new dimensions and clean up', async () => {
	const { host, services, window } = await installedHost()
	const observed = []
	const off = host.onWindowResize(() => observed.push(host.windowSize.width))
	window.contentView.bounds.size.width = 500
	for (const notify of services.windowResizeListeners) notify(window)
	assert.deepEqual(observed, [500])
	off()
	assert.equal(services.windowResizeListeners.size, 0)
})
