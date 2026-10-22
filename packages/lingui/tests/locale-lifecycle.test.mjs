import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { setupI18n } from '@lingui/core'
import ts from 'typescript'

const source = ts.transpile(readFileSync(new URL('../src/lingui.ts', import.meta.url), 'utf8'), {
	module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
})

function load() {
	const exports = {}
	// Use the real Lingui engine with a fresh instance for each scenario.
	const i18n = setupI18n()
	vm.runInNewContext(source, {
		exports,
		require(id) {
			if (id === '@lingui/core') {
				return { i18n }
			}
			assert.equal(id, './detect-locale')
			return { detectSystemLocale: () => 'en' }
		},
	})
	return exports
}

const catalog = (hello) => async () => ({ messages: { hello } })

test('sequential locale changes activate the requested real-engine catalog', async () => {
	const api = load()
	await api.initLingui({ catalogs: { en: catalog('Hello'), de: catalog('Hallo') }, locale: 'en' })
	await api.setLocale('de')
	assert.equal(api.getLocale(), 'de')
	assert.equal(api.i18n.locale, 'de')
	assert.equal(api.i18n._('hello'), 'Hallo')
})

test('the latest locale choice wins when an older catalog finishes later', async () => {
	const api = load()
	const saved = []
	const notifications = []
	api.subscribeLocale(() => notifications.push(api.getLocale()))
	let finishFrench
	const french = new Promise((resolve) => { finishFrench = resolve })
	await api.initLingui({
		catalogs: { en: catalog('Hello'), fr: () => french, de: catalog('Hallo') }, locale: 'en',
		persist: { load: () => undefined, save: (locale) => { saved.push(locale) } },
	})
	const older = api.setLocale('fr')
	await api.setLocale('de')
	finishFrench({ messages: { hello: 'Bonjour' } })
	await older
	assert.deepEqual(saved, ['en', 'de'])
	assert.deepEqual(notifications, ['en', 'de'])
	assert.equal(api.getLocale(), 'de')
	assert.equal(api.i18n.locale, 'de')
	assert.equal(api.i18n._('hello'), 'Hallo')
})


test('an unregistered choice does not supersede a pending registered locale', async () => {
	const api = load()
	let finishFrench
	const french = new Promise((resolve) => { finishFrench = resolve })
	await api.initLingui({ catalogs: { en: catalog('Hello'), fr: () => french }, locale: 'en' })
	const pending = api.setLocale('fr')
	await assert.rejects(api.setLocale('missing'), /no catalog registered/)
	finishFrench({ messages: { hello: 'Bonjour' } })
	await pending
	assert.equal(api.getLocale(), 'fr')
	assert.equal(api.i18n._('hello'), 'Bonjour')
})

test('a failed newer catalog does not allow an older choice to activate', async () => {
	const api = load()
	let finishFrench
	const french = new Promise((resolve) => { finishFrench = resolve })
	await api.initLingui({
		catalogs: { en: catalog('Hello'), fr: () => french, de: async () => { throw new Error('catalog unavailable') } },
		locale: 'en',
	})
	const older = api.setLocale('fr')
	await assert.rejects(api.setLocale('de'), /catalog unavailable/)
	finishFrench({ messages: { hello: 'Bonjour' } })
	await older
	assert.equal(api.getLocale(), 'en')
	assert.equal(api.i18n._('hello'), 'Hello')
})
