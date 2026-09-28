import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const [appRoot, configFile] = process.argv.slice(2)
const require = createRequire(join(appRoot, 'package.json'))
let vitePath
try {vitePath = require.resolve('vite')} catch {
	throw new Error('Cannot resolve Vite from the macOS app. Declare vite in devDependencies and run pnpm install.')
}
const { loadConfigFromFile } = await import(pathToFileURL(vitePath).href)
const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, configFile, appRoot, 'silent')
if (!loaded) {throw new Error(`Could not load macOS Vite config: ${configFile}`)}
const external = loaded.config.build?.rollupOptions?.external
const externalizes = (specifier) => {
	if (typeof external === 'function') {return !!external(specifier, undefined, false)}
	const entries = Array.isArray(external) ? external : [external]
	return entries.some((entry) => entry === specifier || entry instanceof RegExp && entry.test(specifier))
}
const required = ['@nativescript/macos-node-api', 'node:crypto', 'node:fs', 'node:os', 'node:path']
const missing = required.filter((specifier) => !externalizes(specifier))
if (missing.length) {
	throw new Error(`macOS Vite config must externalize these host imports: ${missing.join(', ')}. Set build.rollupOptions.external to ['@nativescript/macos-node-api', /^node:/].`)
}
