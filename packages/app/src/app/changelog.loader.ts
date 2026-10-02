import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** changelog.loader — build-time data for a `dataMode: 'baked'` route.
 *  Runs under vite ssrLoadModule during `xplat routes`/dev/build (Node —
 *  fs/process are legal here). The serialized result ships in
 *  routes.gen.data.ts; this module never enters a runtime bundle, so its
 *  imports (node:fs et al.) stay out of every target. */
export function loader() {
	const pkg = JSON.parse(
		readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'),
	)

	return {
		version: pkg.version ?? 'dev',
		entries: [
			{ version: pkg.version ?? 'dev', note: 'Baked loader output — computed at codegen' },
			{ version: '…', note: 'Earlier entries would come from a markdown/content dir' },
		],
	}
}
