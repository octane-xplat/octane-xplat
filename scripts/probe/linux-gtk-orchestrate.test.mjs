import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import test from 'node:test'

const script = new URL('./linux-gtk-orchestrate.sh', import.meta.url)

async function runFixture(mode, timeout = '600') {
	const work = await mkdtemp(join(tmpdir(), 'gtk-orchestrator-'))
	const executable = join(work, 'fake-runtime.mjs')
	const source = `#!/usr/bin/env node\n` +
		`import { writeFileSync } from 'node:fs'\n` +
		`const work = process.env.PROOF_WORK\n` +
		`writeFileSync(work + '/proof-log.jsonl', '')\n` +
		`writeFileSync(work + '/child.pid', String(process.pid))\n` +
		(mode === 'hang' ? `process.on('SIGTERM', () => {})\nsetInterval(() => {}, 1000)\n` :
			`process.exit(${mode === 'error' ? '7' : '0'})\n`)
	await writeFile(executable, source, { mode: 0o755 })
	const result = await new Promise((resolve, reject) => {
		const child = spawn('bash', [script.pathname], {
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, PROOF_WORK: work, PROOF_EXECUTABLE: executable,
				PROOF_TIMEOUT_SECONDS: timeout },
		})
		let stdout = ''
		let stderr = ''
		child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
		child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
		child.once('error', reject)
		child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr }))
	})
	const pid = Number(await readFile(join(work, 'child.pid'), 'utf8'))
	const log = await readFile(join(work, 'orchestrator.jsonl'), 'utf8')
	await rm(work, { recursive: true, force: true })
	return { ...result, pid, log }
}

function processIsGone(pid) {
	try {
		process.kill(pid, 0)
		return false
	} catch (error) {
		if (error.code === 'ESRCH') {return true}
		throw error
	}
}

test('clean child completion preserves success and reaps the owned child', async () => {
	const result = await runFixture('clean')
	assert.equal(result.code, 0, result.stderr)
	assert.equal(processIsGone(result.pid), true)
	assert.match(result.log, /"kind":"app-exited","data":\{"code":0\}/)
})

test('child error exit propagates after owned-child cleanup', async () => {
	const result = await runFixture('error')
	assert.equal(result.code, 7, result.stderr)
	assert.equal(processIsGone(result.pid), true)
	assert.match(result.log, /"kind":"app-exited","data":\{"code":7\}/)
})

test('timeout terminates then kills a TERM-ignoring child within the fixed bound', async () => {
	const started = Date.now()
	const result = await runFixture('hang', '1')
	assert.equal(result.code, 124, result.stderr)
	assert.equal(processIsGone(result.pid), true)
	assert.match(result.log, /"kind":"timeout"/)
	assert.match(result.log, /"kind":"app-exited","data":\{"code":124\}/)
	assert.ok(Date.now() - started < 10000, `shutdown took ${Date.now() - started}ms`)
})
