import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Future source execution with a fake Intl reader/module graph. No native SDK,
// OS preference change, generated declarations or installed resolution is proved.
const files = ['locale.macos.ts', 'device.macos.ts', 'index.macos.ts']
const compiled = Object.fromEntries(await Promise.all(files.map(async file => [file,
	ts.transpileModule(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
		fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText,
])))
const plain = value => JSON.parse(JSON.stringify(value))
function load(tag, intlOverride) {
	let reads = 0
	const intl = intlOverride === undefined ? {
		Locale: Intl.Locale,
		DateTimeFormat() { reads++; return { resolvedOptions: () => ({ locale: tag }) } },
	} : intlOverride
	const context = vm.createContext({ Intl: intl }), cache = {}
	function require(name) {
		const file = files.find(file => './' + file.slice(0, -3) === name)
		if (!file) {
			if (name.startsWith('./') || name === '@octane-xplat/lib/capability') return {}
			throw new Error('Unexpected metadata import')
		}
		if (!cache[file]) {
			const exports = cache[file] = {}
			vm.runInContext(`(function(exports, require) {${compiled[file]}\n})`, context)(exports, require)
		}
		return cache[file]
	}
	return { require, reads: () => reads, context }
}

test('AppKit metadata separates script/region and retains canonical full locale tags', () => {
	for (const [tag, expected] of [
		['zh-Hant-TW', { tag: 'zh-Hant-TW', language: 'zh', region: 'TW' }],
		['sr_Latn_RS', { tag: 'sr-Latn-RS', language: 'sr', region: 'RS' }],
		['es-419', { tag: 'es-419', language: 'es', region: '419' }],
		['en-US-u-ca-gregory', { tag: 'en-US-u-ca-gregory', language: 'en', region: 'US' }],
		['fr', { tag: 'fr', language: 'fr', region: '' }],
		['zh-Hant', { tag: 'zh-Hant', language: 'zh', region: '' }],
	]) assert.deepEqual(plain(load(tag).require('./locale.macos').locale), expected)
})

test('AppKit metadata has a valid documented fallback without a usable Intl locale', () => {
	const missing = load('fr')
	missing.context.Intl = undefined
	assert.deepEqual(plain(missing.require('./locale.macos').locale), { tag: 'en', language: 'en', region: '' })
	for (const intl of [null, {}, { DateTimeFormat() { throw new Error('unavailable') } },
		{ DateTimeFormat() { return { resolvedOptions() { throw new Error('unavailable') } } } },
		{ DateTimeFormat() { return { resolvedOptions: () => ({ locale: 'zh-TW' }) } } },
	]) assert.deepEqual(plain(load(undefined, intl).require('./locale.macos').locale), { tag: 'en', language: 'en', region: '' })
	for (const tag of [undefined, null, 123, '', 'not_a_valid_locale_!']) {
		assert.deepEqual(plain(load(tag).require('./locale.macos').locale), { tag: 'en', language: 'en', region: '' })
	}
})

test('AppKit root and purpose metadata share one snapshot and retain the truthful device subset', () => {
	const h = load('zh-Hant-TW'), root = h.require('./index.macos')
	assert.equal(root.locale, h.require('./locale.macos').locale)
	assert.equal(root.device, h.require('./device.macos').device)
	assert.deepEqual(plain(root.device), {
		os: 'macos', osVersion: 'unknown', model: 'Mac', manufacturer: 'Apple', language: 'zh', region: 'TW',
	})
	assert.equal(h.reads(), 1)
	h.context.Intl.DateTimeFormat = () => { throw new Error('later runtime change') }
	assert.equal(root.locale.tag, 'zh-Hant-TW')
	assert.equal(h.reads(), 1)
})

test('AppKit metadata export conditions select matching runtime/types and preserve other targets', async () => {
	const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
	for (const service of ['locale', 'device']) for (const suffix of ['', '.ts']) {
		const entry = manifest.exports[`./${service}${suffix}`]
		assert.equal(entry.macos, `./src/${service}.macos.ts`)
		assert.equal(entry.types, `./types/generated/${service}.d.ts`)
		assert.equal(entry.default, `./src/${service}${suffix}`)
	}
})
