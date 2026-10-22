import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

// NativeScript's embedded V8 (iOS and Android) is built without ICU: any `\p{…}`
// regex escape — even a literal in a never-called function — is a parse-time
// SyntaxError that fails the whole module. `shaders@4.0.0` ships such escapes in
// its bundled TypeGPU chunk; the repo carries a pnpm patch to remove them, but
// `allowUnusedPatches` means a `shaders` bump silently drops it. Guard the
// `shaders/js` entry point's static import graph here.
const entry = fileURLToPath(import.meta.resolve('shaders/js'))

const importRe =
	/(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g

const propertyEscapeRe = /(?<!\\)\\[pP]\{[A-Za-z=]/

const visited = new Set()
const queue = [entry]
while (queue.length > 0) {
	const file = queue.shift()
	if (visited.has(file) || !existsSync(file)) {
		continue
	}

	visited.add(file)
	const source = readFileSync(file, 'utf8')
	for (const match of source.matchAll(importRe)) {
		const specifier = match[1] ?? match[2]
		if (!specifier) {
			continue
		}

		const target = join(dirname(file), specifier)
		queue.push(existsSync(target) ? target : `${target}.js`)
	}
}

test('shaders/js import graph contains no Unicode property escapes', () => {
	assert.ok(visited.size > 1, `expected a reachable import graph under ${entry}`)
	for (const file of visited) {
		const source = readFileSync(file, 'utf8')
		assert.ok(
			!propertyEscapeRe.test(source),
			`${file} contains a \\p{…}/\\P{…} regex escape — fails at parse time on ICU-less V8`,
		)
	}
})
