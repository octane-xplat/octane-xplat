import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const cache = fileURLToPath(new URL('../node_modules/.cache/', import.meta.url))
const procs = new URL('../dist/procs.js', import.meta.url).href
function root(t) {
	mkdirSync(cache, { recursive: true })
	const dir = mkdtempSync(join(cache, 'procs-test-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	return dir
}

// spawnTagged prefixes each child line with [tag] for the terminal. A line
// longer than a pipe chunk must still arrive whole — automation (the macOS
// parity sweep) emits a single ~64KB JSON line that readers parse verbatim.
test('long single-line child output is forwarded intact on one prefixed line', (t) => {
	const dir = root(t)
	const payload = 'x'.repeat(200_000)
	const script = join(dir, 'run.mjs')
	writeFileSync(join(dir, 'payload.txt'), payload)
	writeFileSync(
		script,
		`import { spawnTagged } from ${JSON.stringify(procs)};
const child = spawnTagged('fixture', process.execPath, ['-e', ${JSON.stringify(
			`process.stdout.write(require('node:fs').readFileSync('payload.txt', 'utf8') + String.fromCharCode(10) + 'ok' + String.fromCharCode(10))`,
		)}], ${JSON.stringify(dir)});
child.once('close', () => process.exit(0));
`,
	)
	const out = execFileSync(process.execPath, [script], { encoding: 'utf8' })
	const lines = out.split('\n').filter((line) => line.startsWith('[fixture]'))
	assert.equal(lines.length, 2)
	assert.equal(lines[0], `[fixture] ${payload}`)
	assert.equal(lines[1], '[fixture] ok')
})
