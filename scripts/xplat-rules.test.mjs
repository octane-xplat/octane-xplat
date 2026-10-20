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
	test(`${label} accepts NavLink activation without inventing gesture props`, async () => {
		const { checkNoViewOnPress } = await import(module)
		const filename = 'Links.mobile.tsx'
		const source =
			'<><NavLink onPress={cancel} /><NavLink onPressIn={enter} /><View onPress={press} /></>'
		const failures = checkNoViewOnPress(parseModule(source, filename), source, filename)
		assert.deepEqual(
			failures.map(({ message }) => message),
			[
				'<NavLink> has no onPressIn — it will never fire. Wrap in <Pressable>.',
				'<View> has no onPress — it will never fire. Wrap in <Pressable>.',
			],
		)
	})

	test(`${label} accepts GTK framework renderer declarations without weakening app pragmas`, async () => {
		const { checkNativePragmaFirstLine } = await import(module)
		const source =
			'/** @jsxImportSource @nativescript-community/octane */\nexport function Pane() { return <masonview /> }'
		for (const filename of [
			'packages/ui/src/RoutePane.gtk.tsrx',
			'/repo/packages/ui/src/RoutePane.gtk.tsrx',
		]) {
			assert.deepEqual(
				checkNativePragmaFirstLine(parseModule(source, filename), source, filename),
				[],
			)
		}
		for (const filename of ['apps/demo/src/App.gtk.tsrx', 'packages/other/src/Pane.gtk.tsrx']) {
			assert.equal(
				checkNativePragmaFirstLine(parseModule(source, filename), source, filename).length,
				1,
			)
		}
	})

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

for (const [label, module] of [
	['repository', './xplat-rules.ts'],
	['published lint', '../packages/lint/src/xplat-rules.ts'],
]) {
	test(`${label} rejects removed routing APIs with canonical replacements`, async () => {
		const { checkNoRemovedRoutingApi } = await import(module)
		const source = `import { pushRoute, useRoute, registerRoutes } from '@octane-xplat/ui/routing'
import { NavLink } from '@octane-xplat/ui'
import { router } from '@octane-xplat/ui/routing'`
		const failures = checkNoRemovedRoutingApi(parseModule(source, 'app.tsrx'), source, 'app.tsrx')
		assert.equal(failures.length, 3)
		assert.match(failures[0].message, /router\.push/)
		assert.match(failures[1].message, /useRouteMatch|useRouterState|getRouteApi/)
		assert.match(failures[2].message, /routes\.gen/)
	})

	test(`${label} rejects route module augmentation outside generated files`, async () => {
		const { checkNoRouteAugmentation } = await import(module)
		const source = `declare module '@octane-xplat/ui/routing' { interface RegisteredRouteContracts {} }`
		assert.equal(checkNoRouteAugmentation(parseModule(source, 'app.ts'), source, 'app.ts').length, 1)
		assert.equal(checkNoRouteAugmentation(parseModule(source, 'x.gen.ts'), source, 'x.gen.ts').length, 0)
	})

	test(`${label} rejects destination casts and interpolated paths`, async () => {
		const { checkNoDestinationCast, checkNoInterpolatedRoutePath } = await import(module)
		const source = `const d = { to: '/items/' + id } as any
const e = { to: \`/items/\${id}\`, params: {} }
const f = { to: '/items/:id', params: { id } } as Destination
push({ to: raw as '/items/:id' })
const link = <NavLink to={dest as any} />`
		assert.equal(checkNoDestinationCast(parseModule(source, 'app.tsx'), source, 'app.tsx').length >= 2, true)
		assert.equal(checkNoInterpolatedRoutePath(parseModule(source, 'app.tsx'), source, 'app.tsx').length, 2)
	})

	test(`${label} leaves non-route 'to' keys and assertions alone`, async () => {
		const { checkNoDestinationCast, checkNoInterpolatedRoutePath } = await import(module)
		const source = `const anim = { from: 0, to: \`\${n}%\` }
const range = { to: x as number }
const style = { to: '100%' } as const`
		assert.equal(checkNoDestinationCast(parseModule(source, 'app.ts'), source, 'app.ts').length, 0)
		assert.equal(checkNoInterpolatedRoutePath(parseModule(source, 'app.ts'), source, 'app.ts').length, 0)
	})
}
