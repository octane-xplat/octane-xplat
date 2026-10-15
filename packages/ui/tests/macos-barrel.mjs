import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatMacOS } from '../../cli/src/macos/vite.mjs'

export async function buildMacOSBarrel(
	root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/macos'),
	specifier = '@octane-xplat/ui',
) {
	const entry = resolve(root, 'ui-macos-barrel-fixture.ts')
	const config = await xplatMacOS('production', { root, packaged: false, entry })
	const result = await build({
		...config,
		configFile: false,
		plugins: [
			...config.plugins,
			{
				name: 'ui-macos-barrel-fixture',
				resolveId(id) {
					if (id === entry) {
						return entry
					}
				},
				load(id) {
					if (id === entry) {
						return `export * from '${specifier}'`
					}
				},
			},
		],
		build: { ...config.build, write: false, minify: false },
	})

	const chunk = (Array.isArray(result) ? result[0] : result).output.find(
		(output) => output.type === 'chunk' && output.isEntry,
	)

	assert.ok(chunk, `${specifier} emits an AppKit fixture`)
	return chunk.exports
}

export async function checkMacOSBarrels(root) {
	const rootExports = await buildMacOSBarrel(root, '@octane-xplat/ui')
	for (const name of [
		'useLayer',
		'openWindow',
		'applyThemeClasses',
	]) {
		assert.ok(rootExports.includes(name), `root barrel retains the public ${name} API`)
	}

	for (const name of ['useBackInterceptor', 'manifestToJson', 'cachedQuery$', 'Markdown', 'ChatComposer']) {
		assert.ok(
			!rootExports.includes(name),
			`${name} moved to its purpose entrypoint — the macOS root must not keep it`,
		)
	}

	const routing = await buildMacOSBarrel(root, '@octane-xplat/ui/routing')
	for (const name of [
		'pushRoute',
		'useBackInterceptor',
		'deriveRouteManifest',
		'defineRoutes',
		'manifestToJson',
		'RouteBoundary',
	]) {
		assert.ok(routing.includes(name), `routing barrel retains the public ${name} API`)
	}

	const data = await buildMacOSBarrel(root, '@octane-xplat/ui/data')
	for (const name of [
		'createStore',
		'useStore',
		'useListData',
		'useAsyncList',
		'cachedQuery$',
		'invalidateQueries',
		'clearQueryCache',
		'createMemoryQueryStorage',
		'platformQueryStorage',
	]) {
		assert.ok(data.includes(name), `data barrel retains the public ${name} API`)
	}

	const markdown = await buildMacOSBarrel(root, '@octane-xplat/ui/markdown')
	for (const name of ['Markdown', 'MarkdownScreen', 'parseMdDoc', 'tokenize', 'useOutlineFromMarkdown']) {
		assert.ok(markdown.includes(name), `markdown barrel retains the public ${name} API`)
	}

	const chat = await buildMacOSBarrel(root, '@octane-xplat/ui/chat')
	for (const name of ['ChatComposer', 'ChatLayout', 'ChatMessage', 'useChatDictation', 'useSpeechRecognition']) {
		assert.ok(chat.includes(name), `chat barrel retains the public ${name} API`)
	}

	return rootExports
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await checkMacOSBarrels()
	console.log('AppKit UI barrels build with the production platform boundary guard')
}
