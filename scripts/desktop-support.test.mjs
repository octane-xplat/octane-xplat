import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { localOutputFile } from '../tools/desktop-support/local-output.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const render = join(root, 'tools/desktop-support/render.mjs')

function temporary(t, parent = tmpdir()) {
	mkdirSync(parent, { recursive: true })
	const directory = mkdtempSync(join(parent, 'desktop-audit-'))
	t.after(() => rmSync(directory, { recursive: true, force: true }))
	return directory
}

test('desktop audit refuses output in tracked source locations', () => {
	assert.throws(
		() => localOutputFile('tools/desktop-support/render.mjs', root),
		/Operational output must be Git-ignored or outside/,
	)
})

test('desktop audit accepts ignored and external local output', (t) => {
	for (const directory of [temporary(t, join(root, 'research')), temporary(t)]) {
		const output = join(directory, 'nested', 'inventory.json')
		assert.equal(localOutputFile(output, root), output)
		assert.ok(existsSync(join(directory, 'nested')))
	}
})

test('desktop audit rendering uses explicit findings and writes beside the local inventory', (t) => {
	const directory = temporary(t)
	const inventory = join(directory, 'inventory.json')
	const findings = join(directory, 'findings.json')
	writeFileSync(
		inventory,
		JSON.stringify({
			revision: 'fixture',
			packages: [],
			excluded: [],
			conditions: {},
			parseErrors: [],
			parserFallbacks: [],
			files: {},
			rows: [],
			dependencyGraphs: {},
		}),
	)
	writeFileSync(findings, '[]')
	execFileSync(process.execPath, [render, inventory, findings], { cwd: root })
	for (const name of [
		'windows.tsv',
		'macos.tsv',
		'gtk.tsv',
		'dependency-candidates.json',
		'snapshot.json',
	]) {
		assert.ok(existsSync(join(directory, name)), name)
	}
	assert.equal(
		JSON.parse(readFileSync(join(directory, 'snapshot.json'), 'utf8')).revision,
		'fixture',
	)

	const missing = spawnSync(process.execPath, [render, inventory], { cwd: root, encoding: 'utf8' })
	assert.notEqual(missing.status, 0)
	assert.match(missing.stderr, /Usage:.*INVENTORY FINDINGS/)

	const rejected = spawnSync(
		process.execPath,
		[render, inventory, findings, join(root, 'packages')],
		{
			cwd: root,
			encoding: 'utf8',
		},
	)
	assert.notEqual(rejected.status, 0)
	assert.match(rejected.stderr, /Operational output must be Git-ignored or outside/)
})
