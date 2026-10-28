import { copyFileSync } from 'node:fs'
// Keep the curated public declarations and make the GI subset available to
// consumers without requiring a repository tsconfig or an @girs installation.
for (const name of ['index.d.ts', 'host.d.ts', 'gi.d.ts', 'host-globals.d.ts']) {
	copyFileSync(new URL(`src/${name}`, import.meta.url), new URL(`dist/${name}`, import.meta.url))
}
