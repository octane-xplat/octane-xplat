import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'
import { octane } from 'octane/compiler/vite'

for (const symbol of ['Text', 'Table', 'Timestamp']) {
	test(`${symbol} consumer does not pull Intl polyfills into its bundle`, async () => {
		const entry = new URL('./intl-consumer.ts', import.meta.url).pathname
		const result = await build({
			configFile: false,
			logLevel: 'error',
			plugins: [
				{
					name: 'intl-consumer',
					resolveId: (id) => (id === entry ? id : null),
					load: (id) => (id === entry ? `export { ${symbol} } from '@octane-xplat/ui'` : null),
				},
				octane({ ssr: false }),
			],
			resolve: {
				conditions: ['web'],
				extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.tsx', '.mjs', '.js', '.json'],
			},
			build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
		})
		const chunks = [result]
			.flat()
			.flatMap((output) => output.output)
			.filter((item) => item.type === 'chunk')
		const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules))
		assert.ok(modules.length)
		assert.equal(
			modules.some((id) => /formatjs|lingui\/dist\/polyfills/.test(id)),
			false,
		)
		console.log(
			`${symbol}: ${chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0)} JS bytes; no FormatJS modules`,
		)
	})
}
