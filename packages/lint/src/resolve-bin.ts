import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// `xplat-lint` is normally reached through the app's `node_modules/.bin`, which
// pnpm leaves unpopulated for `link:`-resolved deps whose target was missing at
// resolution time (GH#16). Consumers then invoke the bin via `node` directly,
// where `spawnSync('oxlint')` fails because `.bin` is not on PATH. Resolve the
// binary from the app's dependency tree (anchor at cwd) or this package's own
// instead. Returns undefined when unresolvable — callers fall back to PATH.
export const resolveBin = (name, anchors = [join(process.cwd(), 'noop.js'), import.meta.url]) => {
	for (const anchor of anchors) {
		try {
			const require = createRequire(anchor)
			const manifestPath = require.resolve(`${name}/package.json`)
			const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'))
			const entry = typeof bin === 'string' ? bin : bin?.[name]
			if (entry) {
				return join(dirname(manifestPath), entry)
			}
		} catch {}
	}
}
