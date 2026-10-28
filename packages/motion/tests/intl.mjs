import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'
import { checkIntlBundle } from '../../../scripts/intl-test-utils.mjs'

const source = `export * from '${new URL('../src/text-morph/semantics.ts', import.meta.url).pathname}'`

test('native segmentation owns its prerequisites without formatting polyfills', async () => {
	const result = await checkIntlBundle(build, {
		source,
		check: `
  assert.equal(leaf.planTextMorph(null, 'café 👨‍👩‍👧').frame.value, 'café 👨‍👩‍👧'); assert.equal(leaf.planTextMorph(null, 'hello world').fallback, undefined)
  assert.equal(typeof Intl.Segmenter, 'function')
  assert.equal(typeof Intl.NumberFormat, 'undefined')
  assert.equal(typeof Intl.Collator, 'undefined')
 `,
	})
	assert.ok(result.modules.some((id) => id.includes('intl-segmenter')))
	assert.equal(
		result.modules.some((id) => /intl-numberformat|intl-datetimeformat|intl-collator/.test(id)),
		false,
	)
})

test('web segmentation keeps built-ins and includes no FormatJS', async () => {
	const result = await checkIntlBundle(build, {
		source,
		mobile: false,
		before: 'const original = Intl.Segmenter',
		check: `assert.equal(leaf.planTextMorph(null, 'café 👨‍👩‍👧').frame.value, 'café 👨‍👩‍👧'); assert.equal(leaf.planTextMorph(null, 'hello world').fallback, undefined); assert.equal(Intl.Segmenter, original)`,
	})
	assert.equal(
		result.modules.some((id) => id.includes('@formatjs')),
		false,
	)
})
