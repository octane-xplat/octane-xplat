// Execute a pinned native Go unit binary; the target needs no Go compiler.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `go-tests-${target}`)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(build.kind, 'test-executable')
assert.equal(typeof build.binaries, 'object')
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale unit source: ${file}`)
}
const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
const scratch = mkdtempSync(join(base, 'unit-host-'))
let output = ''
let code = 0
try {
	for (const [file, info] of Object.entries(build.binaries)) {
		assert.equal(
			sha(readFileSync(join(binary, file))),
			info.sha256,
			`Test binary changed after build: ${file}`,
		)
		const result = spawnSync(join(binary, file), ['-test.v', '-test.timeout=90s'], {
			cwd: join(root, 'packages/cli/go', info.directory),
			encoding: 'utf8',
			timeout: 105000,
			maxBuffer: 4 << 20,
			env: { ...process.env, TEMP: scratch, TMP: scratch, TMPDIR: scratch },
		})
		output += `=== ${file} (${info.directory}) ===\n` + (result.stdout ?? '') + (result.stderr ?? '')
		if (result.status !== 0) {
			code = result.status ?? 1
			break
		}
	}
	const record = {
		target,
		build,
		exitCode: code,
		stdout: output,
		passed: code === 0,
		scope:
			'Actual-host native core/kernel-cache/process-leader unit contracts; not a public CLI or installer qualification.',
	}
	writeFileSync(
		join(work, `unit-qualification-${target}.json`),
		JSON.stringify(record, null, 2) + '\n',
	)
	assert.equal(code, 0, output)
	console.log(JSON.stringify({ target, passed: true, binaries: Object.keys(build.binaries) }))
} finally {
	rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
