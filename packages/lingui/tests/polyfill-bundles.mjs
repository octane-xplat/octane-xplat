import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'

for (const feature of ['number', 'index', 'collator']) {
	test(`${feature} bundle contains only explicitly selected capabilities and data`, async () => {
		const entry = new URL(`../dist/polyfills/${feature}.js`, import.meta.url).pathname
		const result = await build({
			configFile: false,
			logLevel: 'error',
			build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
		})
		const chunks = [result]
			.flat()
			.flatMap((result) => result.output)
			.filter((item) => item.type === 'chunk')
		const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules))
		assert.ok(modules.some((id) => id.includes('@formatjs')))
		assert.equal(
			modules.some((id) => id.includes('intl-segmenter')),
			false,
		)
		assert.equal(
			modules.some((id) => id.includes('/locale-data/de.js')),
			false,
		)
		if (feature !== 'collator') {
			assert.equal(
				modules.some((id) => id.includes('intl-collator')),
				false,
			)
		}
		if (feature === 'number') {
			assert.equal(
				modules.some((id) => id.includes('intl-datetimeformat')),
				false,
			)
		}
		console.log(
			`${feature}: ${chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0)} JS bytes`,
		)
	})
}
