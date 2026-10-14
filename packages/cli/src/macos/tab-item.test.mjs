import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseModule } from '@tsrx/core'
import { tabItemContentRoots } from './tab-item.mjs'

const transform = tabItemContentRoots().transform

test('TabViewItem adapter preserves raw tag/key/ref, authored pragma, strings and comments', () => {
	const source = '/** @jsxImportSource @octane-xplat/jsx */\nconst x = <tabview><tabviewitem key="home" ref={ref} title="tabviewitem"><label text="tabviewitem" /></tabviewitem></tabview>\n// <tabviewitem />'
	const {code} = transform(source, '/src/App.macos.tsx')
	assert.ok(code.startsWith('/** @jsxImportSource @octane-xplat/jsx */'))
	assert.match(code, /<tabviewitem key="home" ref=\{ref\} title="tabviewitem" __tabContent=\{<>/)
	assert.match(code, /<label text="tabviewitem" \/><\/>\} \/>/)
	assert.match(code, /\/\/ <tabviewitem \/>/)
	parseModule(code, 'App.macos.tsx')
})

test('TabViewItem adapter handles nested content/TSRX and leaves web and unrelated sources alone', () => {
	const source = '/** @jsxImportSource @octane-xplat/jsx */\nexport default () => { <tabviewitem title="Home"><tabview><tabviewitem title="Nested"><label text="Content" /></tabviewitem></tabview></tabviewitem> }'
	const {code} = transform(source, '/src/App.tsrx')
	assert.equal(code.match(/__tabContent/g).length, 2)
	parseModule(code, 'App.tsrx')
	assert.equal(transform(source, '/src/App.web.tsrx'), null)
	assert.equal(transform(source.replace('@octane-xplat/jsx', '@octane-xplat/jsx/dom'), '/src/App.tsrx'), null)
	assert.equal(transform('const label = "tabviewitem"', '/src/App.tsx'), null)
	assert.equal(transform(source, '/src/notes.md'), null)
	assert.equal(transform('const empty = <tabviewitem title="Empty" />', '/src/App.tsx'), null)
})

test('TabViewItem children attributes and spreads feed the content root without duplicating expression evaluation', () => {
	const source = 'const __XplatTabProps = 1; const x = <tabviewitem children={child} {...getProps()} />'
	const {code} = transform(source, '/src/App.tsx')
	assert.match(code, /__tabContent=\{child\}/)
	assert.match(code, /\.\.\.__XplatTabProps_\(getProps\(\)\)/)
	assert.equal(code.match(/getProps\(\)/g).length, 1)
	assert.match(code, /import \{ __tabItemProps as __XplatTabProps_ \}/)
	parseModule(code, 'App.tsx')
})
