// Test helpers: build throwaway workspaces on disk.

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function makeWorkspace(name = 'xplat-mcp-test-') {
	return mkdtempSync(join(tmpdir(), name))
}

export function writeJson(root, rel, value) {
	const path = join(root, rel)
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, JSON.stringify(value, null, 2))
}

export function writeFile(root, rel, content) {
	const path = join(root, rel)
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, content)
}

/** A minimal consumer app: manifest + vite config → web platform. */
export function makeConsumerApp(root, rel, options = {}) {
	writeJson(root, `${rel}/package.json`, {
		name: options.name ?? rel.replaceAll('/', '-'),
		version: '1.0.0',
		private: true,
		dependencies: { '@octane-xplat/ui': options.uiVersion ?? '0.14.0', octane: '0.14.0' },
		...options.extraManifest,
	})

	if (options.web !== false) {
		writeFile(root, `${rel}/vite.config.ts`, 'export default {}\n')
	}

	if (options.native) {
		writeFile(root, `${rel}/nativescript.config.ts`, 'export default {}\n')
	}

	if (options.installed) {
		for (const [pkg, version] of Object.entries(options.installed)) {
			writeJson(root, `${rel}/node_modules/${pkg}/package.json`, {
				name: pkg,
				version,
			})
		}
	}

	return rel
}
