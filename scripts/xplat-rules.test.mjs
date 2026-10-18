import assert from 'node:assert/strict'
import test from 'node:test'
import { parseModule } from '@tsrx/core'
import { checkNoDomGlobals } from './xplat-rules.ts'

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

for (const [label, module] of [
	['repository', './xplat-rules.ts'],
	['published lint', '../packages/lint/src/xplat-rules.ts'],
]) {
	test(`${label} accepts facade and legacy native pragmas`, async () => {
		const { checkNativePragmaFirstLine } = await import(module)
		const filename = 'Card.mobile.tsrx'
		const body = 'export function Card() @{ <gridlayout /> }'
		for (const sourceName of ['@octane-xplat/jsx', '@nativescript-community/octane']) {
			const source = `/** @jsxImportSource ${sourceName} */\n${body}`
			assert.deepEqual(
				checkNativePragmaFirstLine(parseModule(source, filename), source, filename),
				[],
			)
		}
		for (const prefix of [
			'',
			'/** @jsxImportSource @octane-xplat/jsx/dom */\n',
			'// before\n/** @jsxImportSource @octane-xplat/jsx */\n',
		]) {
			const source = prefix + body
			const failures = checkNativePragmaFirstLine(parseModule(source, filename), source, filename)
			assert.equal(failures.length, 1)
			assert.match(failures[0].message, /@octane-xplat\/jsx/)
		}
	})
}
