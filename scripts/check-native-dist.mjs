#!/usr/bin/env node
// Post-build gate: dist/native must never import the bare `octane` specifier.
// The DOM entry bundled on-device means a second octane runtime in the
// deps-bundle — hooks run against an empty CURRENT_SCOPE and the app crashes
// on first render ("Cannot read properties of null (reading 'hooks')").
// The native build rewrites `octane` → `octane/universal/native` at emit time
// (vite.config output.paths); this check is the regression tripwire.
// Run from a package dir after `vite build --mode native`.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const distDir = join(process.cwd(), 'dist', 'native')
const OCTANE_SPEC = /(?:\bfrom|\bimport|\bexport)\s*\(?\s*['"]octane['"]/g

function* jsFiles(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name)
		if (statSync(p).isDirectory()) {
			yield* jsFiles(p)
		} else if (name.endsWith('.js')) {
			yield p
		}
	}
}

let stat
try {
	stat = statSync(distDir)
} catch {
	console.error(
		`check-native-dist: ${relative('.', distDir)} does not exist — run the native build first`,
	)

	process.exit(1)
}

if (!stat.isDirectory()) {
	console.error(`check-native-dist: ${relative('.', distDir)} is not a directory`)
	process.exit(1)
}

let failures = 0
for (const file of jsFiles(distDir)) {
	const text = readFileSync(file, 'utf8')
	const hits = [...text.matchAll(OCTANE_SPEC)]
	if (!hits.length) {
		continue
	}

	failures++
	const lines = text.split('\n')
	for (const hit of hits) {
		const line = lines.findIndex((l) => l.includes(hit[0]))
		console.error(`${relative('.', file)}:${line + 1}: bare "octane" specifier — ${hit[0].trim()}`)
	}
}

if (failures) {
	console.error(
		`check-native-dist: ${failures} file(s) import the DOM runtime — rewrite to octane/universal/native (see packages/ui/vite.config.ts)`,
	)

	process.exit(1)
}

console.log('check-native-dist: dist/native is clean')
