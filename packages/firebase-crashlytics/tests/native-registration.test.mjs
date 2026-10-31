import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// The plugin installs `firebase().crashlytics` at module evaluation
// (Object.defineProperty in index.ios.js/index.android.js), so the leaf must
// import it before the first service call — `supported: true` alone never
// proved the accessor existed.
test('native leaf registers firebase().crashlytics() before first use', async () => {
	const fb = {}
	const calls = []
	const imports = []
	const plugin = {
		log: (message) => calls.push(['log', message]),
		recordError: (error) => calls.push(['recordError', error]),
	}
	const globals = {
		exports: {},
		require(id) {
			imports.push(id)
			switch (id) {
				case '@nativescript/firebase-core':
					return { firebase: () => fb }
				case '@nativescript/firebase-crashlytics':
					// Mirrors the plugin's module-eval registration.
					Object.defineProperty(fb, 'crashlytics', {
						value: () => plugin,
						writable: false,
					})
					return {}
				default:
					throw new Error(`unexpected import: ${id}`)
			}
		},
	}

	const source = ts.transpile(
		await readFile(new URL('../src/firebase-crashlytics.ts', import.meta.url), 'utf8'),
		{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	)

	vm.runInNewContext(source, globals)

	const { crashlytics } = globals.exports
	assert.deepEqual(imports, ['@nativescript/firebase-core', '@nativescript/firebase-crashlytics'])
	assert.equal(crashlytics.supported, true)
	assert.equal(
		typeof fb.crashlytics,
		'function',
		'accessor installed at module evaluation, before first use',
	)
	crashlytics.log('breadcrumb')
	crashlytics.recordError(new Error('handled'))
	assert.deepEqual(calls[0], ['log', 'breadcrumb'])
	assert.equal(calls[1][0], 'recordError')
})
