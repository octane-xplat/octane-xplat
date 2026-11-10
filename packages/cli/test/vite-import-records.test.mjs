import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// Patched @nativescript/vite parses top-level import records through Vite's
// native (Oxc) parser instead of Babel, whose block-comment line tracking is
// quadratic on long minified lines (the std-DqXMpDa3.js cold-transform stall).
const versions = {
	'8.0.20': '@nativescript/vite',
	'8.0.21': 'nativescript-vite-8-0-21',
}

for (const [version, packageName] of Object.entries(versions)) {
	const base = new URL('./hmr/server/', pathToFileURL(createRequire(import.meta.url).resolve(packageName)))
	const { collectTopLevelImportRecords } = await import(new URL('websocket-served-module-helpers.js', base))
	const { ensureNativeScriptModuleBindings } = await import(new URL('websocket-module-bindings.js', base))

	it(`${version}: collects default, named, and string-named specifiers`, () => {
		const code = `import def, { a, b as c, "d-e" as f } from "pkg";`
		const records = collectTopLevelImportRecords(code)
		assert.equal(records.length, 1)
		assert.equal(records[0].source, 'pkg')
		assert.equal(records[0].text, code)
		assert.equal(records[0].hasOnlyNamedSpecifiers, false)
		assert.deepEqual(records[0].namedBindings, [
			{ importedName: 'a', text: 'a' },
			{ importedName: 'b', text: 'b as c' },
			{ importedName: 'd-e', text: '"d-e" as f' },
		])
	})

	it(`${version}: exact text slice after non-ASCII content`, () => {
		const code = `const s = "héllo→";\nimport { x } from "m";`
		const records = collectTopLevelImportRecords(code)
		assert.equal(records.length, 1)
		assert.equal(records[0].text, `import { x } from "m";`)
		assert.equal(records[0].hasOnlyNamedSpecifiers, true)
	})

	it(`${version}: collects import type and TS+JSX input`, () => {
		assert.equal(collectTopLevelImportRecords(`import type { T } from "./t";`)[0].source, './t')
		assert.equal(collectTopLevelImportRecords(`import { r } from "x";\ninterface P { a: number }\nconst el = <div a={1} />;`)[0].source, 'x')
	})

	it(`${version}: returns [] for code with no imports`, () => {
		assert.deepEqual(collectTopLevelImportRecords(`const a = 1;\nexport { a };`), [])
	})

	it(`${version}: long minified line of block comments parses fast`, () => {
		const code = `import {a} from "m";\n` + '/*#__PURE__*/'.repeat(12000) + 'const s="' + 'x'.repeat(20 * 1000 * 1000) + '";'
		const t0 = performance.now()
		const records = collectTopLevelImportRecords(code)
		const ms = performance.now() - t0
		assert.equal(records.length, 1)
		assert.equal(records[0].source, 'm')
		assert.ok(ms < 2000, `parse took ${ms}ms`)
	})

	it(`${version}: module-bindings path still rewrites vendor imports`, () => {
		const out = ensureNativeScriptModuleBindings(`import { defineStore } from "pinia";\nexport const s = defineStore('x', () => ({}));\n`)
		assert.doesNotMatch(out, /from\s+["']pinia["']/)
		assert.match(out, /__nsVendorRegistry/)
	})
}

const { collectStaticImportDefaultIntents } = await import(new URL('../../../node_modules/.bun/@nativescript+vite@8.0.20+a66b0566a0cc83aa/node_modules/@nativescript/vite/hmr/server/websocket-served-module-helpers.js', import.meta.url))
import { test } from 'node:test'
test('8.0.20: collectStaticImportDefaultIntents default/named/namespace mix', () => {
	assert.deepEqual(collectStaticImportDefaultIntents(`import def, { a } from "x";\nimport { b } from "y";\nimport * as ns from "z";\nimport type { T } from "./t";`), [
		{ src: 'x', wantsDefault: true },
		{ src: 'y', wantsDefault: false },
		{ src: 'z', wantsDefault: false },
		{ src: './t', wantsDefault: false },
	])
})
test('8.0.20: link-check intents on the long-line payload', () => {
	const code = `import {a} from "m";\n` + '/*#__PURE__*/'.repeat(12000) + 'const s="' + 'x'.repeat(20 * 1000 * 1000) + '";'
	const t0 = performance.now()
	assert.deepEqual(collectStaticImportDefaultIntents(code), [{ src: 'm', wantsDefault: false }])
	assert.ok(performance.now() - t0 < 2000)
})
