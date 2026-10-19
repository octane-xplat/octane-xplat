import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	readFileSync,
	readdirSync,
	existsSync,
	mkdtempSync,
	realpathSync,
	mkdirSync,
	writeFileSync,
	rmSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { build } from 'vite'
import { xplatBamboo } from '../src/vite.ts'
import { xplatCss } from '@octane-xplat/cli/vite'

const configSource = fileURLToPath(new URL('../src/config.ts', import.meta.url))
const codegen = fileURLToPath(new URL('../node_modules/@bamboocss/dev/bin.js', import.meta.url))

test('generated Bamboo platform conditions compile through the shared CSS pipeline', async () => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-bamboo-platform-')))
	try {
		mkdirSync(join(root, 'src'))
		writeFileSync(
			join(root, 'bamboo.config.ts'),
			`import { xplatBambooConfig } from ${JSON.stringify(configSource)};
export default { ...xplatBambooConfig, include: ['src/**/*.ts'], outdir: 'src/styled-system' }`,
		)

		writeFileSync(
			join(root, 'src/main.ts'),
			`import 'virtual:bamboo.css';
import { css } from './styled-system/css';
export const card = css({ padding: '4', _web: { color: 'primary' }, _ios: { color: 'danger' }, _mobile: { borderRadius: 'lg' } });`,
		)

		const generated = spawnSync(process.execPath, [codegen, 'codegen'], {
			cwd: root,
			encoding: 'utf8',
		})

		assert.equal(generated.status, 0, generated.stdout + generated.stderr)
		for (const target of ['web', 'ios', 'android']) {
			let nativeCss = undefined
			const outputs = await build({
				configFile: false,
				root,
				logLevel: 'silent',
				plugins: [
					xplatCss(target),
					xplatBamboo({
						native: target !== 'web',
						cwd: root,
						configPath: join(root, 'bamboo.config.ts'),
					}),
					...(target !== 'web'
						? [
								{
									name: 'test-native-consumer',
									generateBundle(_options, bundle) {
										nativeCss = Object.values(bundle)
											.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
											.map((file) => file.source)
											.join('\n')
									},
								},
							]
						: []),
				],
				build: {
					write: false,
					cssCodeSplit: target !== 'web',
					minify: false,
					lib: { entry: join(root, 'src/main.ts'), formats: ['es'], cssFileName: 'styles' },
				},
			})

			const files = (Array.isArray(outputs) ? outputs : [outputs]).flatMap(
				(output) => output.output,
			)

			const css = files
				.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
				.map((file) => file.source)
				.join('\n')

			assert.doesNotMatch(css, /@platform/)
			if (target !== 'web') {
				assert.equal(
					nativeCss.replace(/\/\*\$vite\$:\d+\*\//g, ''),
					css,
					'native consumer sees final filtered CSS',
				)
			}

			assert.equal(css.includes('color: var(--colors-primary)'), target === 'web', css)
			assert.equal(css.includes('color: var(--colors-danger)'), target === 'ios', css)
			assert.equal(css.includes('border-radius:'), target !== 'web', css)
			assert.match(css, /padding:/)
		}

		writeFileSync(join(root, 'index.html'), '<script type="module" src="/src/main.ts"></script>')
		const main = join(root, 'src/main.ts')
		writeFileSync(main, readFileSync(main, 'utf8') + '\nglobalThis.card = card;')
		const written = await build({
			configFile: false,
			root,
			logLevel: 'silent',
			plugins: [
				xplatCss('web'),
				xplatBamboo({ cwd: root, configPath: join(root, 'bamboo.config.ts') }),
			],
			build: { outDir: 'dist', minify: false, sourcemap: true, manifest: true },
		})

		const files = written.output
		const sheets = files.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
		assert.equal(sheets.length, 1)
		assert.match(sheets[0].fileName, /platform-[a-f0-9]+\.css$/)
		assert.doesNotMatch(readFileSync(join(root, 'dist', sheets[0].fileName), 'utf8'), /@platform/)
		const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
		assert.ok(html.includes(sheets[0].fileName), html)
		const manifest = readFileSync(join(root, 'dist/.vite/manifest.json'), 'utf8')
		assert.ok(manifest.includes(sheets[0].fileName), manifest)
		for (const file of files.filter((file) => file.fileName.endsWith('.map'))) {
			assert.ok(existsSync(join(root, 'dist', file.fileName)))
			assert.equal(JSON.parse(readFileSync(join(root, 'dist', file.fileName), 'utf8')).version, 3)
		}

		await assert.rejects(
			build({
				configFile: false,
				root,
				logLevel: 'silent',
				plugins: [xplatBamboo({ cwd: root, configPath: join(root, 'bamboo.config.ts') })],
				build: { write: false, lib: { entry: main, formats: ['es'], cssFileName: 'styles' } },
			}),
			/platform conditions require xplatCss/,
		)

		await assert.rejects(
			build({
				configFile: false,
				root,
				logLevel: 'silent',
				plugins: [
					xplatCss('web'),
					xplatBamboo({ cwd: root, configPath: join(root, 'bamboo.config.ts') }),
				],
				build: { write: false, ssr: main },
			}),
			/SSR generation is not supported/,
		)

		let latestCss = ''
		const watcher = await build({
			configFile: false,
			root,
			logLevel: 'silent',
			plugins: [
				xplatCss('web'),
				xplatBamboo({ cwd: root, configPath: join(root, 'bamboo.config.ts') }),
				{
					name: 'test-written-css',
					writeBundle(_options, bundle) {
						latestCss = Object.values(bundle)
							.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
							.map((file) => file.source)
							.join('\n')
					},
				},
			],
			build: {
				watch: {},
				outDir: 'watch-dist',
				minify: false,
				lib: { entry: main, formats: ['es'], cssFileName: 'styles' },
			},
		})

		const nextBuild = () =>
			new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					watcher.off('event', onEvent)
					reject(new Error('Bamboo watch build timed out'))
				}, 10000)
				function onEvent(event) {
					if (event.code !== 'END' && event.code !== 'ERROR') {
						return
					}
					clearTimeout(timeout)
					watcher.off('event', onEvent)
					if (event.code === 'ERROR') {
						reject(event.error)
					} else {
						resolve(latestCss)
					}
				}
				watcher.on('event', onEvent)
			})

		try {
			assert.match(await nextBuild(), /color: var\(--colors-primary\)/)
			const rebuilt = nextBuild()
			writeFileSync(
				main,
				readFileSync(main, 'utf8').replace(
					"_web: { color: 'primary' }",
					"_web: { color: 'danger' }",
				),
			)

			const css = await rebuilt
			assert.match(css, /color: var\(--colors-danger\)/)
			assert.doesNotMatch(css, /@platform|color: var\(--colors-primary\)/)
		} finally {
			await watcher.close()
		}
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
