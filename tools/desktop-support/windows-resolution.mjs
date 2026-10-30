import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const root = process.cwd()
const req = createRequire(resolve(root, 'apps/windows/package.json'))
const { createServer } = await import(req.resolve('vite'))
process.chdir(resolve(root, 'apps/windows'))
process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'windows' })
const { xplatNative } = await import(pathToFileURL(resolve(root, 'packages/cli/src/vite.ts')))
const config = await xplatNative('production')
const server = await createServer({
	configFile: false,
	root: process.cwd(),
	resolve: config.resolve,
	plugins: config.plugins
		.flat(Infinity)
		.filter((p) =>
			[
				'ns-package-platform-resolver',
				'nativescript-package-resolver',
				'xplat-native-relative-resolution',
				'xplat-native-extension-order',
			].includes(p?.name),
		),
	server: { middlewareMode: true, watch: null },
	optimizeDeps: { noDiscovery: true, include: [] },
	logLevel: 'silent',
})

try {
	const results = []
	for (const [s, i] of [
		['@octane-xplat/ui', 'apps/windows/src/index.ts'],
		['@octane-xplat/gif', 'apps/windows/src/index.ts'],
		['./AnimatedImage.tsrx', 'packages/gif/src/index.ts'],
		['@octane-xplat/maps', 'apps/windows/src/index.ts'],
		['./MapView.tsrx', 'packages/maps/src/index.ts'],
		['@octane-xplat/sentry', 'apps/windows/src/index.ts'],
		['@octane-xplat/platform/environment', 'apps/windows/src/index.ts'],
		['./index.shared', 'packages/ui/src/index.mobile.ts'],
	]) {
		try {
			results.push({
				specifier: s,
				importer: i,
				resolved:
					(await server.pluginContainer.resolveId(s, resolve(root, i)))?.id?.replace(
						root + '/',
						'',
					) ?? null,
			})
		} catch (e) {
			results.push({ specifier: s, importer: i, error: e.message })
		}
	}

	console.log(
		JSON.stringify(
			{
				conditions: server.config.resolve.conditions,
				extensions: server.config.resolve.extensions,
				results,
			},
			null,
			2,
		),
	)

	writeFileSync(
		resolve(root, 'research/desktop-audit/windows-resolution.json'),
		JSON.stringify(results, null, 2) + '\n',
	)
} finally {
	await server.close()
}
