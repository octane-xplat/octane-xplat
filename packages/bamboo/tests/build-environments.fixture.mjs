import {
	mkdtempSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	readdirSync,
	rmSync,
	realpathSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBuilder } from 'vite'
import { xplatBamboo } from '../src/vite.ts'

const mode = process.argv[2]
const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-bamboo-environments-')))
try {
	mkdirSync(join(root, 'src'))
	const configSource = fileURLToPath(new URL('../src/config.ts', import.meta.url))
	writeFileSync(
		join(root, 'bamboo.config.ts'),
		`import { xplatBambooConfig } from ${JSON.stringify(configSource)};
export default { ...xplatBambooConfig, include: ['src/*.ts'], outdir: 'src/styled-system' };`,
	)

	writeFileSync(join(root, 'index.html'), '<script type="module" src="/src/client.ts"></script>')
	for (const [name, padding] of [
		['client', '13px'],
		['ssr', '17px'],
		['unused', '19px'],
	]) {
		writeFileSync(
			join(root, `src/${name}.ts`),
			`import 'virtual:bamboo.css';
import { css } from './styled-system/css';
globalThis.${name} = css({ color: 'red', padding: '${padding}' });`,
		)
	}

	writeFileSync(
		join(root, 'src/worker.ts'),
		'export default { fetch() { return new Response("ok") } }',
	)

	const schedule =
		mode === 'ssr-first'
			? ['ssr', 'client']
			: mode === 'ssr-last' || mode === 'excluded'
				? ['client', 'ssr']
				: ['worker', 'client']

	const names =
		mode === 'baseline'
			? undefined
			: mode === 'incomplete'
				? ['worker', 'client', 'ssr']
				: mode === 'unknown'
					? ['client', 'missing']
					: mode === 'excluded'
						? ['client']
						: schedule

	const builder = await createBuilder({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatBamboo({ cwd: root, buildEnvironments: names })],
		builder: {
			sharedPlugins: true,
			async buildApp(builder) {
				// The full registry must remain available to the framework.
				if (!builder.environments.ssr) {
					throw new Error('SSR registry was mutated')
				}
				for (const name of schedule) {
					await builder.build(builder.environments[name])
				}
			},
		},
		environments: {
			client: { build: { outDir: 'dist/client' } },
			worker: { consumer: 'server', build: { outDir: 'dist/worker', ssr: 'src/worker.ts' } },
			ssr: { consumer: 'server', build: { outDir: 'dist/ssr', ssr: 'src/ssr.ts' } },
		},
		build: { minify: false, cssMinify: false, cssCodeSplit: false, manifest: true },
	})

	await builder.buildApp()
	const assets = join(root, 'dist/client/assets')
	const sheets = readdirSync(assets).filter((name) => name.endsWith('.css'))
	const css = sheets.map((name) => readFileSync(join(assets, name), 'utf8')).join('\n')
	const html = readFileSync(join(root, 'dist/client/index.html'), 'utf8')
	const manifest = readFileSync(join(root, 'dist/client/.vite/manifest.json'), 'utf8')
	console.log(
		'RESULT ' +
			JSON.stringify({
				client: css.includes('padding: 13px'),
				server: css.includes('padding: 17px'),
				unused: css.includes('padding: 19px'),
				color: css.includes('color: red'),
				references:
					sheets.length > 0 &&
					sheets.every((name) => html.includes(name) && manifest.includes(name)),
			}),
	)
} catch (error) {
	console.error(error)
	process.exitCode = 1
} finally {
	rmSync(root, { recursive: true, force: true })
}
