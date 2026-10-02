import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/index.macos.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

function load() {
	const context = {
		exports: {},
		require: () => ({}),
		console: { warn: () => assert.fail('announce must not warn') },
	}

	vm.runInNewContext(compiled, context)
	return context
}

test('macOS announce returns void, ignores blank text, and reads the current host each call', () => {
	const context = load()
	const { announce } = context.exports
	assert.equal(announce('before host install'), undefined)
	const first = []
	context.__xplatAppKit = { announce: (text) => first.push(text) }
	for (const text of ['', ' \n\t']) {
		assert.equal(announce(text), undefined)
	}

	assert.equal(announce('  Saved ✓  '), undefined)
	announce('  Saved ✓  ')
	assert.deepEqual(first, ['  Saved ✓  ', '  Saved ✓  '])
	const second = []
	context.__xplatAppKit = { announce: (text) => second.push(text) }
	announce('Updated')
	assert.deepEqual(second, ['Updated'])
	delete context.__xplatAppKit
	assert.equal(announce('after host removal'), undefined)
})

test('AppKit notification has the exact text and medium priority on every request', async () => {
	const calls = []
	const source = await readFile(
		new URL('../../../apps/macos/src/accessibility.mjs', import.meta.url),
		'utf8',
	)

	const context = {
		NSAccessibilityPostNotificationWithUserInfo: (...args) => calls.push(args),
		NSAccessibilityAnnouncementRequestedNotification: 'announcement',
		NSAccessibilityAnnouncementKey: 'text',
		NSAccessibilityPriorityKey: 'priority',
		NSAccessibilityPriorityLevel: { Medium: 50 },
	}

	vm.runInNewContext(source.replace('export function', 'function'), context)
	const app = {}
	context.announceAppKit('', app)
	context.announceAppKit(' \n', app)
	context.announceAppKit('Saved ✓', app)
	context.announceAppKit('Saved ✓', app)
	assert.equal(calls.length, 2)
	for (const [element, notification, info] of calls) {
		assert.equal(element, app)
		assert.equal(notification, 'announcement')
		assert.equal(info.text, 'Saved ✓')
		assert.equal(info.priority, 50)
		assert.equal(Object.keys(info).length, 2)
	}
})

test('installed host stops posting when its lifecycle terminates and retains no announcement state', async () => {
	const source = await readFile(
		new URL('../../../apps/macos/src/appkit.mjs', import.meta.url),
		'utf8',
	)

	const parsed = ts.createSourceFile(
		'appkit.mjs',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	)

	const install = parsed.statements.find(
		(node) => ts.isFunctionDeclaration(node) && node.name?.text === 'installPlatformServices',
	)

	assert.ok(install)
	const posts = []
	const app = {}
	const services = { appState: 'active' }
	const shared = { running: true, platformServices: services }
	const originalKeys = Object.keys(services)
	const context = {
		shared,
		app,
		NSBundle: { mainBundle: {} },
		announceAppKit: (...args) => posts.push(args),
	}

	vm.runInNewContext(install.getText(parsed) + '\ninstallPlatformServices()', context)
	context.__xplatAppKit.announce('Saved')
	context.__xplatAppKit.announce('Saved')
	shared.running = false
	context.__xplatAppKit.announce('After termination')
	assert.equal(posts.length, 2)
	assert.equal(posts[0][1], app)
	assert.equal(posts[1][1], app)
	assert.deepEqual(Object.keys(services), originalKeys)
})
