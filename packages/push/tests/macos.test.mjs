import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { assertMacOSPush } from './macos-contract.mjs'

test('macOS import and subscriptions stay inert without SDK or host access', async () => {
	const exports = {}
	const globals = { exports }
	const accesses = []
	for (const name of [
		'require',
		'objc',
		'interop',
		'UNUserNotificationCenter',
		'FIRApp',
		'UIApplication',
		'Notification',
		'navigator',
		'setTimeout',
		'setInterval',
		'addEventListener',
	]) {
		Object.defineProperty(globals, name, {
			get() {
				accesses.push(name)
				throw new Error(`unexpected SDK, listener or host access: ${name}`)
			},
		})
	}

	const source = ts.transpile(
		await readFile(new URL('../src/push.macos.ts', import.meta.url), 'utf8'),
		{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	)

	vm.runInNewContext(source, globals)
	await assertMacOSPush(exports.push)
	assert.deepEqual(accesses, [], 'no imports, native authorization or listeners')
})
