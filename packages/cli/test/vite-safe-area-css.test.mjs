import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { build } from 'vite'
import { pxToDip, xplatCss } from '../dist/vite.js'

for (const edge of ['top', 'right', 'bottom', 'left']) {
	test(`warns about ${edge} safe-area functions in native dev CSS`, () => {
		const plugin = pxToDip()
		const warnings = []
		const context = { warn: (message) => warnings.push(message) }
		const id = '\0virtual:bamboo.css'
		const css = `.chrome { padding: max(10px, env(safe-area-inset-${edge}, 0px)); }`
		const result = plugin.transform.call(context, css, id)
		assert.match(result, /env\(safe-area-inset-/)
		assert.match(result, /10dip/)
		assert.equal(warnings.length, 1)
		assert.ok(warnings[0].startsWith(id + ':'))
		assert.match(warnings[0], /unsupported on native.*useSafeAreaInsets\(\).*inline style/)
		plugin.transform.call(context, css, id)
		assert.equal(warnings.length, 1, 'deduplicates per stylesheet')
		plugin.transform.call(context, css, '/other.css?direct')
		assert.equal(warnings.length, 2)
	})
}

test('warns on emitted Bamboo assets after deferred build conversion', () => {
	const plugin = pxToDip()
	plugin.configResolved({ command: 'build' })
	const warnings = []
	const context = { warn: (message) => warnings.push(message) }
	const css = '@layer utilities { .chrome { padding-top: env(safe-area-inset-top); } }'
	assert.equal(plugin.transform.call(context, css, '\0virtual:bamboo.css'), undefined)
	assert.equal(warnings.length, 0)
	const asset = { type: 'asset', fileName: 'bamboo.css', source: new TextEncoder().encode(css) }
	plugin.generateBundle.call(context, {}, { 'bamboo.css': asset })
	assert.equal(warnings.length, 1)
	assert.match(warnings[0], /^bamboo\.css: env/)
	assert.doesNotMatch(asset.source, /@layer/)
	assert.match(asset.source, /env\(safe-area-inset-top\)/)
})

test('ignores safe-area text in comments, strings, unrelated functions and removed web-only rules', () => {
	const plugin = pxToDip()
	const css = `
	/* env(safe-area-inset-top) */
	.example { content: "env(safe-area-inset-right)"; --other: my-env(safe-area-inset-top); }
	/* xplat-web-only:start */
	.browser { padding: env(safe-area-inset-bottom); }
	/* xplat-web-only:end */`
	plugin.transform.call({ warn: assert.fail }, css, '/style.css')
})

test('diagnoses the framework safe-area class too', () => {
	const css = readFileSync(new URL('../../ui/src/theme/tokens.css', import.meta.url), 'utf8')
	const warnings = []
	pxToDip().transform.call({ warn: (message) => warnings.push(message) }, css, '/tokens.css')
	assert.equal(warnings.filter((message) => message.includes('env(safe-area-inset-*)')).length, 1)
})

test('native Vite builds warn for shared CSS while web-only rules and web builds stay quiet', async () => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-safe-area-css-'))
	try {
		writeFileSync(join(root, 'main.js'), "import './style.css'")
		for (const platform of ['web', 'ios', 'android']) {
			for (const webOnly of [false, true]) {
				const rule = '.chrome { padding-top: env(safe-area-inset-top); }'
				writeFileSync(join(root, 'style.css'), webOnly ? `@platform web { ${rule} }` : rule)
				const warnings = []
				const result = await build({
					root,
					configFile: false,
					logLevel: 'silent',
					plugins: [xplatCss(platform), ...(platform === 'web' ? [] : [pxToDip()])],
					build: {
						write: false,
						minify: false,
						lib: { entry: join(root, 'main.js'), formats: ['es'], cssFileName: 'styles' },
						rolldownOptions: { onwarn: (warning) => warnings.push(warning.message) },
					},
				})

				const safeAreaWarnings = warnings.filter((message) =>
					message.includes('env(safe-area-inset-*)'),
				)

				assert.equal(
					safeAreaWarnings.length > 0,
					platform !== 'web' && !webOnly,
					`${platform}, webOnly=${webOnly}`,
				)

				if (platform === 'web') {
					const output = Array.isArray(result)
						? result.flatMap((bundle) => bundle.output)
						: result.output

					const css = output
						.filter((file) => file.type === 'asset')
						.map((file) => file.source)
						.join('\n')

					assert.match(css, /env\(safe-area-inset-top\)/)
				}
			}
		}
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})

test('new core keeps a qualification warning without claiming its resolver is absent', () => {
	const warnings = []
	pxToDip({ masonSafeAreaEnvironment: true }).transform.call(
		{ warn: (message) => warnings.push(message) },
		'.chrome { padding-top: env(safe-area-inset-top, 0px); }',
		'/style.css',
	)
	assert.equal(warnings.length, 1)
	assert.match(warnings[0], /owning window.*Mason containers.*not yet device-qualified/)
	assert.doesNotMatch(warnings[0], /unsupported on native/)
})

test('engines without the resolver keep the unresolved-value warning', () => {
	const warnings = []
	pxToDip({ masonSafeAreaEnvironment: false }).transform.call(
		{ warn: (message) => warnings.push(message) },
		'.chrome { padding-top: env(safe-area-inset-top, 0px); }',
		'/style.css',
	)
	assert.equal(warnings.length, 1)
	assert.match(warnings[0], /unsupported on native/)
})
