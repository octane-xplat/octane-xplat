import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Future source models: root dependencies are inert stubs; no native window,
// status/menu/title bar, renderer, OS preference or installed consumer runs.
const files = ['system-bars.macos.ts', 'index.macos.ts']
const compiled = Object.fromEntries(await Promise.all(files.map(async file => [file,
	ts.transpileModule(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
		fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText,
])))
function load(warn) {
	const context = vm.createContext({ console: { warn } }), cache = {}
	function require(name) {
		const file = files.find(file => './' + file.slice(0, -3) === name)
		if (!file) {
			if (name.startsWith('./') || name === '@octane-xplat/lib/capability') return {}
			throw new Error('Unexpected system-bars import')
		}
		if (!cache[file]) {
			const exports = cache[file] = {}
			vm.runInContext(`(function(exports, require) {${compiled[file]}\n})`, context)(exports, require)
		}
		return cache[file]
	}
	return require
}

test('AppKit root and purpose expose both shared system-bar methods as the same explicitly unsupported object', () => {
	const warnings = [], require = load(message => warnings.push(message))
	const root = require('./index.macos'), leaf = require('./system-bars.macos')
	assert.equal(root.systemBars, leaf.systemBars)
	assert.deepEqual(Object.keys(leaf.systemBars).sort(), ['setColor', 'setStatusBarStyle'])
	assert.deepEqual(warnings, [])
	assert.equal(root.systemBars.setStatusBarStyle('light'), undefined)
	assert.equal(leaf.systemBars.setStatusBarStyle('dark'), undefined)
	assert.equal(root.systemBars.setColor('private color payload'), undefined)
	assert.deepEqual(warnings, Array(3).fill('[octane-xplat] System bars are unsupported by the AppKit host.'))
})

test('AppKit unsupported system-bar calls remain inert when diagnostics fail', () => {
	const { systemBars } = load(() => { throw new Error('unavailable console') })('./system-bars.macos')
	assert.doesNotThrow(() => systemBars.setStatusBarStyle('light'))
	assert.doesNotThrow(() => systemBars.setColor('#123456'))
})

test('AppKit system-bar export conditions pair runtime/types and keep non-macOS paths', async () => {
	const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
	for (const suffix of ['', '.ts']) {
		const entry = manifest.exports['./system-bars' + suffix]
		assert.deepEqual(entry.macos, { types: './types/generated/system-bars.macos.d.ts', default: './src/system-bars.macos.ts' })
		assert.equal(entry.types, './types/generated/system-bars.d.ts')
		assert.equal(entry.default, './src/system-bars' + suffix)
	}
})
