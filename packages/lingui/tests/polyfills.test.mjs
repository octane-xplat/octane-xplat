import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

// Every scenario owns its global Intl and module cache. Never patch the test host.
function run(code) {
	const result = spawnSync(
		process.execPath,
		[
			'--input-type=module',
			'-e',
			`
		import assert from 'node:assert/strict'
		${code}
	`,
		],
		{ cwd: new URL('..', import.meta.url), encoding: 'utf8' },
	)
	assert.equal(result.status, 0, result.stdout + result.stderr)
}

test('opt-in formatting initializes absent Intl in prerequisite order', () => {
	run(`
		delete globalThis.Intl
		await import('@octane-xplat/lingui/polyfills')
		assert.equal(new Intl.NumberFormat('en').format(1234.5), '1,234.5')
		assert.equal(new Intl.PluralRules('en').select(2), 'other')
		assert.equal(new Intl.RelativeTimeFormat('en', {numeric:'auto'}).format(-1, 'day'), 'yesterday')
		assert.equal(new Intl.ListFormat('en').format(['a', 'b']), 'a and b')
		assert.equal(new Intl.DateTimeFormat('en', {timeZone:'UTC', year:'numeric'}).format(0), '1970')
		assert.equal(typeof Intl.Collator, 'undefined')
		assert.equal(typeof Intl.Segmenter, 'undefined')
		const number = Intl.NumberFormat
		await import('@octane-xplat/lingui/polyfills/number')
		await import('@octane-xplat/lingui/polyfills/locales/de')
		assert.equal(Intl.NumberFormat, number)
		// Re-evaluate the guarded installer itself, bypassing its module cache.
		await import(import.meta.resolve('@formatjs/intl-numberformat/polyfill.js') + '?repeat')
		assert.equal(Intl.NumberFormat, number)
		assert.equal(new Intl.NumberFormat('de').format(1234.5), '1.234,5')
		assert.equal(new Intl.ListFormat('de').format(['a', 'b']), 'a und b')
		await import('@octane-xplat/lingui/polyfills/time-zones/all')
		const date = new Intl.DateTimeFormat('en', {timeZone:'America/New_York', hour:'numeric', hourCycle:'h23'})
		assert.equal(date.format(0), '19')
	`)
})

test('per-capability entries remain modular and support individual locale data', () => {
	run(`
		delete globalThis.Intl
		await import('@octane-xplat/lingui/polyfills/number/locales/de')
		assert.equal(new Intl.NumberFormat('de').format(1234.5), '1.234,5')
		assert.equal(typeof Intl.DateTimeFormat, 'undefined')
		assert.equal(typeof Intl.ListFormat, 'undefined')
		assert.equal(typeof Intl.Collator, 'undefined')
		await import('@octane-xplat/lingui/polyfills/number/locales/fr-CA')
		assert.equal(new Intl.PluralRules('fr-CA').select(0), 'one')
	`)
})

test('collation and segmentation are separately available without Intl', () => {
	run(`
		delete globalThis.Intl
		await import('@octane-xplat/lingui/polyfills/collator')
		assert.ok(new Intl.Collator('en', {numeric:true}).compare('item2', 'item10') < 0)
		assert.ok(new Intl.Collator('sv').compare('z', 'ä') < 0)
		await import('@octane-xplat/lingui/polyfills/segmenter')
		assert.equal([...new Intl.Segmenter('en', {granularity:'grapheme'}).segment('👨‍👩‍👧‍👦')].length, 1)
		assert.equal(typeof Intl.NumberFormat, 'undefined')
	`)
})

test('guarded imports retain capable formatting built-ins', () => {
	run(`
		const before = Object.fromEntries(['NumberFormat','DateTimeFormat','PluralRules','ListFormat','RelativeTimeFormat','Collator','Segmenter'].map(key => [key, Intl[key]]))
		await import('@octane-xplat/lingui/polyfills')
		await import('@octane-xplat/lingui/polyfills/collator')
		await import('@octane-xplat/lingui/polyfills/segmenter')
		for (const [key, value] of Object.entries(before)) assert.equal(Intl[key], value, key)
	`)
})

test('partial Intl is completed without replacing a capable constructor', () => {
	run(`
		const NumberFormat = Intl.NumberFormat
		globalThis.Intl = {NumberFormat}
		await import('@octane-xplat/lingui/polyfills')
		assert.equal(Intl.NumberFormat, NumberFormat)
		assert.equal(new Intl.ListFormat('en').format(['a', 'b']), 'a and b')
	`)
})

test('maintained bootstrap installs before dependent module evaluation', () => {
	run(`
		delete globalThis.Intl
		const example = await import('./tests/fixtures/intl-bootstrap.mjs')
		assert.equal(example.formatted, '1.234,5')
		assert.ok(example.comparison < 0)
	`)
})
