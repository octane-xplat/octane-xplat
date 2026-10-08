import assert from 'node:assert/strict'
import test from 'node:test'
import { parseModule } from '@tsrx/core'
import { checkNoDomGlobals } from './xplat-rules.mjs'

function violations(source, filename = 'sample.macos.ts') {
	return checkNoDomGlobals(parseModule(source, filename), source, filename).map(
		({ node }) => node.name,
	)
}

test('DOM-looking identifiers resolve lexical bindings', () => {
	assert.deepEqual(
		violations(`
			import location from './location'
			const { window: localWindow, location: localLocation } = source
			function read(location: string, window: unknown) { return location + window }
			const nested = (window: unknown) => { const location = window; return location }
			try { throw 1 } catch (window) { console.log(window) }
			console.log(location, localWindow, localLocation, nested)
		`),
		[],
	)
})

test('unbound DOM references remain rejected in typed platform source', () => {
	for (const filename of ['sample.macos.ts', 'sample.macos.tsrx']) {
		assert.deepEqual(
			violations('const result: string = location.href; window.alert(result)', filename),
			['location', 'window'],
		)
	}
})

test('a binding in one scope does not hide an unbound reference in another', () => {
	assert.deepEqual(violations('function local(window: unknown) { return window }; location.href'), [
		'location',
	])
})
