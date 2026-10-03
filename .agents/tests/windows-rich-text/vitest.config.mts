import { defineConfig } from 'vitest/config'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const req = createRequire(new URL('../../../apps/windows/package.json', import.meta.url))
const { octane } = await import(pathToFileURL(req.resolve('octane/compiler/vite')).href)
const { nativeScriptRenderer } = await import(
	pathToFileURL(req.resolve('@nativescript-community/octane/config')).href
)

const octaneRoot = dirname(dirname(dirname(req.resolve('octane/universal/native'))))
const octanePackage = JSON.parse(readFileSync(join(octaneRoot, 'package.json'), 'utf8'))
const esm = (id: string) => {
	const entry = octanePackage.exports['./' + id.slice('octane/'.length)]
	const target = typeof entry.node === 'string' ? entry.node : entry.node.import
	return join(octaneRoot, target)
}

const driver = resolve(
	process.env.RICH_TEXT_DRIVER ??
		join(dirname(req.resolve('@nativescript-community/octane')), 'driver.js'),
)

export default defineConfig({
	plugins: [
		{
			name: 'rich-text-octane-deps',
			resolveId(id) {
				if (id.startsWith('octane/')) {
					return esm(id)
				}
			},
		},
		octane({
			ssr: false,
			renderers: {
				registry: { nativescript: nativeScriptRenderer },
				rules: [{ include: '**/*.tsrx', renderer: 'nativescript' }],
			},
		}),
	],
	resolve: {
		alias: [
			{ find: /^@rich-text\/driver$/, replacement: driver },
			{ find: /^@rich-text\/elements$/, replacement: join(dirname(driver), 'elements.js') },
			{ find: /^octane$/, replacement: req.resolve('octane/universal/native') },
			{ find: /^octane\/universal\/native$/, replacement: req.resolve('octane/universal/native') },
			{ find: /^octane\/signals$/, replacement: esm('octane/signals/client') },
			{ find: /^octane\/signals\/client$/, replacement: esm('octane/signals/client') },
			{ find: /^@nativescript\/core$/, replacement: req.resolve('@nativescript/core') },
			{
				find: /^@nativescript\/core\/ui\/core\/properties$/,
				replacement: req.resolve('@nativescript/core/ui/core/properties'),
			},
			{
				find: /^@nativescript-community\/octane$/,
				replacement: new URL('./renderer.ts', import.meta.url).pathname,
			},
		],
	},
	test: {
		server: { deps: { inline: [/@nativescript-community\/octane/] } },
		include: ['.agents/tests/windows-rich-text/*.test.{ts,tsrx}'],
		environment: 'node',
	},
})
