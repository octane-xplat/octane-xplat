import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseModule } from '@tsrx/core'
import { tabItemContentRoots } from './tab-item.mjs'

const transform = tabItemContentRoots().transform

test('owned-content adapter preserves keys, refs, children, strings and comments', () => {
	const source =
		'/** @jsxImportSource @octane-xplat/jsx */\nconst x = <tabview><tabviewitem key="home" ref={ref} title="tabviewitem"><label text="tabviewitem" /></tabviewitem></tabview>\n// <tabviewitem />'
	const { code } = transform(source, '/src/App.macos.tsx')
	assert.ok(code.startsWith('/** @jsxImportSource @octane-xplat/jsx */'))
	assert.match(code, /<__Xplat__PortalTabItem key="home" ref=\{ref\} title="tabviewitem">/)
	assert.match(code, /<label text="tabviewitem" \/><\/__Xplat__PortalTabItem>/)
	assert.match(code, /\/\/ <tabviewitem \/>/)
	assert.equal(code.includes('__tabContent'), false)
	parseModule(code, 'App.macos.tsx')
})

test('owned-content adapter handles nested tabs and lists and excludes its own implementation', () => {
	const source =
		'const x = <tabviewitem><tabview><tabviewitem><listview renderItem={render} /></tabviewitem></tabview></tabviewitem>'
	const { code } = transform(source, '/src/App.tsrx')
	assert.equal((code.match(/<__Xplat__PortalTabItem>/g) ?? []).length, 2)
	assert.match(code, /<__Xplat__PortalList renderItem=\{render\}/)
	parseModule(code, 'App.tsrx')
	assert.equal(transform(source, '/src/App.web.tsrx'), null)
	assert.equal(
		transform('/** @jsxImportSource @octane-xplat/jsx/dom */' + source, '/src/App.tsrx'),
		null,
	)
	assert.equal(transform(source, '/packages/macos-renderer/src/portal-components.macos.tsx'), null)
	assert.equal(transform('const label = "tabviewitem"', '/src/App.tsx'), null)
	assert.equal(transform(source, '/src/notes.md'), null)
	assert.ok(transform('const empty = <tabviewitem title="Empty" />', '/src/App.tsx'))
})

test('children attributes and spreads remain ordinary component props without repeated evaluation', () => {
	const source =
		'const __Xplat__PortalTabItem = 1; const x = <tabviewitem children={child} {...getProps()} />'
	const { code } = transform(source, '/src/App.tsx')
	assert.match(code, /children=\{child\}/)
	assert.match(code, /\.\.\.getProps\(\)/)
	assert.equal(code.match(/getProps\(\)/g).length, 1)
	assert.match(code, /__PortalTabItem as __Xplat__PortalTabItem_/)
	parseModule(code, 'App.tsx')
})
