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
// Bare `octane` must never reach native dist (see header). `@octanejs/lexical`
// is the DOM-rendered composer port and `@lexical/headless` pulls happy-dom —
// both are web-side package boundaries, never valid inside a native bundle.
const FORBIDDEN = [
	{ re: /(?:\bfrom|\bimport|\bexport)\s*\(?\s*['"]octane['"]/g, label: 'octane' },
	{
		re: /(?:\bfrom|\bimport|\bexport)\s*\(?\s*['"]@octanejs\/lexical['"]/g,
		label: '@octanejs/lexical',
	},
	{
		re: /(?:\bfrom|\bimport|\bexport)\s*\(?\s*['"]@lexical\/headless['"]/g,
		label: '@lexical/headless',
	},
]

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
	const lines = text.split('\n')
	for (const { re, label } of FORBIDDEN) {
		for (const hit of text.matchAll(re)) {
			failures++
			const line = lines.findIndex((l) => l.includes(hit[0]))
			console.error(
				`${relative('.', file)}:${line + 1}: forbidden "${label}" specifier — ${hit[0].trim()}`,
			)
		}
	}
}

if (failures) {
	console.error(
		`check-native-dist: ${failures} forbidden specifier(s) — bare "octane" must rewrite to octane/universal/native (see packages/ui/vite.config.ts); @octanejs/lexical and @lexical/headless are DOM-bound and web-only`,
	)

	process.exit(1)
}

console.log('check-native-dist: dist/native is clean')
