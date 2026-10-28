import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'
import { checkIntlBundle } from '../../../scripts/intl-test-utils.mjs'

const entry = new URL('../src/lingui.ts', import.meta.url).pathname
const source = `export * from '${entry}'`
const checks = `
 await leaf.initLingui({ locale: 'en', catalogs: { en: async () => ({ messages: {} }) } })
 assert.equal(leaf.i18n.number(1234.5), '1,234.5')
 assert.equal(leaf.i18n.date(0, {timeZone: 'UTC', year: 'numeric'}), '1970')
 assert.equal(new Intl.PluralRules('en').select(2), 'other')
 assert.equal(new Intl.ListFormat('en').format(['a', 'b']), 'a and b')
 assert.ok(new Intl.Collator('sv').compare('z', 'ä') < 0)
`

test('native Lingui initializes its required APIs, not relative time or segmentation', async () => {
	const result = await checkIntlBundle(build, {
		source,
		check:
			checks +
			`
  assert.equal(typeof Intl.RelativeTimeFormat, 'undefined')
  assert.equal(typeof Intl.Segmenter, 'undefined')
 `,
	})
	assert.equal(
		result.modules.some((id) => /intl-relativetimeformat|intl-segmenter/.test(id)),
		false,
	)
	assert.equal(
		result.modules.some((id) => id.includes('/locale-data/de.js')),
		false,
	)
	console.log(`Lingui native: ${result.bytes} uncompressed JS bytes`)
})

test('native locale and zone data register before Lingui formatting', async () => {
	const result = await checkIntlBundle(build, {
		source: `import '${new URL('../dist/locales/de.js', import.meta.url).pathname}';
   import '${new URL('../dist/locales/fr-CA.js', import.meta.url).pathname}';
   import '${new URL('../dist/time-zones/all.js', import.meta.url).pathname}'; ${source}`,
		check: `
   await leaf.initLingui({locale: 'de', catalogs: {de: async () => ({ messages: {} })}})
   assert.equal(leaf.i18n.number(1234.5), '1.234,5')
   assert.equal(new Intl.ListFormat('de').format(['a', 'b']), 'a und b')
   assert.equal(new Intl.PluralRules('fr-CA').select(0), 'one')
   assert.equal(leaf.i18n.date(0, {timeZone:'America/New_York', hour:'numeric', hourCycle:'h23'}), '19 Uhr')
  `,
	})
	assert.ok(result.modules.some((id) => id.includes('/locale-data/de.js')))
})

test('partial Intl preserves a capable existing formatter', async () => {
	await checkIntlBundle(build, {
		source,
		before: 'const NumberFormat = Intl.NumberFormat; globalThis.Intl = {NumberFormat}',
		check: checks + 'assert.equal(Intl.NumberFormat, NumberFormat)',
	})
})

test('web Lingui relies on built-ins without bundling FormatJS', async () => {
	const result = await checkIntlBundle(build, {
		source,
		mobile: false,
		before: 'const before = Intl.NumberFormat',
		check: checks + 'assert.equal(Intl.NumberFormat, before)',
	})
	assert.equal(
		result.modules.some((id) => id.includes('@formatjs')),
		false,
	)
})
