import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist/native/', import.meta.url))

function* jsFiles(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name)
		if (statSync(path).isDirectory()) {
			yield* jsFiles(path)
		} else if (name.endsWith('.js')) {
			yield path
		}
	}
}

let found = false
for (const path of jsFiles(root)) {
	found = true
	const code = readFileSync(path, 'utf8')
	assert.doesNotMatch(code, /(?:from\s*|import\s*|import\s*\()(['"])octane\1/)
}

assert.ok(found, 'native build did not emit JavaScript files')
