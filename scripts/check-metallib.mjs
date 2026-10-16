#!/usr/bin/env node
// Freshness audit for packages/effects' committed Metal shader libraries:
// every `[[ stitchable ]]` function declared in
// packages/effects/metal/*.metal must be present in each committed
// .metallib under packages/effects/platforms/ios/Resources. The libraries
// ship precompiled (the CLI puts plugin-dir .metal sources in Resources,
// not Sources), so a shader added to the source without re-running
// packages/effects/scripts/build-metal.sh silently ships stale GPU code —
// the factory lookup then misses at runtime.
//
// This is a symbol audit, not a byte diff: metallib output varies across
// Xcode/SDK versions, so rebuilding and comparing bytes fails on
// toolchain drift even when the artifact is current. Function names are
// embedded verbatim in the bitcode, so a missing name is a reliable
// stale-artifact signal.
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgRoot = 'packages/effects'
const resources = join(pkgRoot, 'platforms/ios/Resources')

// Each `[[ stitchable ]] ret name(` declaration — the function name is the
// identifier immediately before the first '(' following the attribute.
const declared = new Map()
for (const file of globSync(join(pkgRoot, 'metal/*.metal'))) {
	const source = readFileSync(file, 'utf8')
	for (const match of source.matchAll(/\[\[\s*stitchable\s*\]\]/g)) {
		const rest = source.slice(match.index)
		const name = rest.slice(0, rest.indexOf('(')).match(/([A-Za-z_]\w*)\s*$/)?.[1]

		if (name) {
			declared.set(name, file)
		}
	}
}

const libraries = globSync(join(resources, '*.metallib'))
let errors = 0
const fail = (message) => {
	errors += 1
	console.error(`check-metallib: ${message}`)
}

if (declared.size === 0) {
	fail(`no [[ stitchable ]] functions found under ${pkgRoot}/metal`)
}

if (libraries.length === 0) {
	fail(`no committed .metallib under ${resources}`)
}

for (const lib of libraries) {
	// Pull printable ASCII runs from the bitcode blob — enough to recover
	// embedded function names without parsing the format.
	const strings = new Set(readFileSync(lib, 'latin1').match(/[\x20-\x7e]{4,}/g) ?? [])

	for (const [name, file] of declared) {
		if (!strings.has(name)) {
			fail(
				`${lib} is missing '${name}' declared in ${file} — ` +
					`rebuild with packages/effects/scripts/build-metal.sh`,
			)
		}
	}
}

if (errors === 0) {
	console.log(
		`check-metallib: ${declared.size} stitchable shader(s) present in ${libraries.length} committed .metallib`,
	)
}

process.exit(errors === 0 ? 0 : 1)
