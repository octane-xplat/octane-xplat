// Resolve the selected project's explicit engine, never the old CLI host API.
import { createRequire } from 'node:module'
import { lstatSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadMacOSDevEngine(project: string) {
	const require = createRequire(join(project, 'package.json'))
	for (let at = project; ; at = dirname(at)) {
		const candidate = join(at, 'node_modules/@octane-xplat/macos-build')
		let found = false
		try {
			lstatSync(candidate)
			found = true
		} catch (error) {
			if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
				throw error
			}
		}
		if (found) {
			const root = realpathSync(candidate)
			let entry: string
			try {
				entry = realpathSync(require.resolve('@octane-xplat/macos-build/dev-engine'))
			} catch (error) {
				throw new Error(
					`Update or reinstall @octane-xplat/macos-build in the selected project: development engine export unavailable; ${String(error)}`,
					{ cause: error },
				)
			}
			if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
				throw new Error(
					'Reinstall @octane-xplat/macos-build: its development engine must stay inside the selected package',
				)
			}
			const api = await import(pathToFileURL(entry).href)
			if (typeof api.runMacOSDev !== 'function') {
				throw new Error(
					'Update @octane-xplat/macos-build in the selected project: development engine API is missing',
				)
			}
			return { runMacOSDev: api.runMacOSDev }
		}
		if (dirname(at) === at) {
			break
		}
	}
	throw new Error(
		'Install the macOS project engine before starting this workshop: bun add -D @octane-xplat/macos-build',
	)
}
