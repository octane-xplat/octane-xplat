import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createDevLogCapture, listRetainedSessions, readDevLogs } from '../dist/dev-logs.js'
import { runTagged, spawnTagged } from '../dist/procs.js'

const cache = fileURLToPath(new URL('../node_modules/.cache/', import.meta.url))
function app(t) {
	mkdirSync(cache, { recursive: true })
	const root = mkdtempSync(join(cache, 'dev-logs-test-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

test('failed launches end their capture and completion commands reject instead of hanging', async (t) => {
	const root = app(t)
	const missing = join(root, 'missing-executable')
	const child = spawnTagged('ios', missing, [], root, {
		capture: { platform: 'ios', targetId: 'fixture' },
	})
	await new Promise((resolve) => child.once('close', resolve))
	const run = listRetainedSessions(root)[0]
	assert.equal(run.historical, true)
	assert.ok(
		readDevLogs(root, run.sessionId).records.some((r) => r.line.includes('Process launch failed')),
	)
	await assert.rejects(
		runTagged('build-fixture', missing, [], root),
		(error) => error.code === 'ENOENT',
	)
})

test('a later reader retrieves output after its capture process exits, on every target path', (t) => {
	const root = app(t)
	// Real subprocess/pipe/disk exercise. The names qualify shared capture
	// plumbing, not an actual iOS/Android/macOS runtime or device.
	for (const platform of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
		const script = `
import { spawnTagged } from ${JSON.stringify(new URL('../dist/procs.js', import.meta.url).href)};
spawnTagged(${JSON.stringify(platform)}, process.execPath, ['-e', ${JSON.stringify("process.stdout.write('before attach\\n'); process.stderr.write('failure without final newline')")}], ${JSON.stringify(root)}, { capture: { platform: ${JSON.stringify(platform)}, targetId: 'fixture-device' } });
`

		execFileSync(process.execPath, ['--input-type=module', '-e', script], { stdio: 'pipe' })
		const runs = listRetainedSessions(root, platform)
		assert.equal(runs.length, 1)
		assert.equal(runs[0].historical, true)
		assert.ok(runs[0].endedAt)
		const page = readDevLogs(root, runs[0].sessionId)
		assert.ok(page.records.some((r) => r.stream === 'stdout' && r.line === 'before attach'))
		assert.ok(
			page.records.some((r) => r.stream === 'stderr' && r.line === 'failure without final newline'),
		)

		assert.equal(page.session.targetId, 'fixture-device')
		assert.equal(page.historical, true)
		assert.ok(page.capturedFrom)
	}
})

test('rotation bounds disk use, reports lost history, and filtered cursors progress', (t) => {
	const root = app(t)
	const capture = createDevLogCapture(
		root,
		{ platform: 'ios', targetId: 'fixture' },
		{ segmentBytes: 1024 },
	)
	for (let n = 0; n < 60; n++) {
		capture.append({ stream: n % 2 ? 'stderr' : 'stdout', line: `${n}: ${'x'.repeat(180)}` })
	}
	capture.close()
	const page = readDevLogs(root, capture.sessionId, { cursor: 0, limit: 2, stream: 'stderr' })
	assert.equal(page.truncated, true)
	assert.ok(page.dropped > 0)
	const tail = readDevLogs(root, capture.sessionId)
	assert.equal(tail.truncated, true)
	assert.equal(tail.dropped, tail.oldestSeq - 1)
	assert.equal(page.records.length, 2)
	assert.ok(page.records.every((r) => r.stream === 'stderr'))
	const last = readDevLogs(root, capture.sessionId, {
		cursor: page.newestSeq - 1,
		stream: 'stdout',
	})
	assert.equal(last.records.length, 0)
	assert.equal(last.nextCursor, page.newestSeq)
	const dir = join(root, 'node_modules/.cache/xplat/sessions', capture.sessionId)
	const bytes = readdirSync(dir)
		.filter((f) => f.endsWith('.jsonl'))
		.reduce((n, f) => n + statSync(join(dir, f)).size, 0)
	assert.ok(bytes <= 2048)
	assert.throws(
		() => readDevLogs(root, capture.sessionId, { cursor: 999999 }),
		(error) => error.code === 'invalid_selection',
	)
})

test('run identity isolates apps and pruning preserves active captures', (t) => {
	const root = app(t)
	const other = app(t)
	const active = createDevLogCapture(
		root,
		{ platform: 'android', targetId: 'active' },
		{ retainedRuns: 1 },
	)
	for (let i = 0; i < 4; i++) {
		createDevLogCapture(
			root,
			{ platform: 'macos', targetId: `finished-${i}` },
			{ retainedRuns: 1 },
		).close()
	}
	const runs = listRetainedSessions(root)
	assert.equal(runs.length, 2)
	assert.ok(runs.some((r) => r.sessionId === active.sessionId && !r.historical))
	assert.throws(
		() => readDevLogs(other, active.sessionId),
		(error) => error.code === 'not_found',
	)
	assert.throws(
		() => readDevLogs(root, '../session.json'),
		(error) => error.code === 'invalid_selection',
	)
	active.close()
})

test('long/partial output and split UTF-8 are bounded without losing subsequent records', (t) => {
	const root = app(t)
	const body =
		"process.stdout.write(Buffer.from([0xf0, 0x9f])); setTimeout(() => {process.stdout.write(Buffer.from([0x98, 0x80, 10])); process.stdout.write('x'.repeat(30000) + '\\nnext\\n')}, 10)"
	const script = `import {spawnTagged} from ${JSON.stringify(new URL('../dist/procs.js', import.meta.url).href)}; spawnTagged('web',process.execPath,['-e',${JSON.stringify(body)}],${JSON.stringify(root)},{capture:{platform:'web',targetId:'web'}})`
	execFileSync(process.execPath, ['--input-type=module', '-e', script], { stdio: 'pipe' })
	const run = listRetainedSessions(root)[0]
	const page = readDevLogs(root, run.sessionId)
	assert.ok(page.records.some((r) => r.line === '😀'))
	assert.ok(page.records.some((r) => r.lineTruncated && r.line.length === 8192))
	assert.ok(page.records.some((r) => r.line === 'next'))
	appendFileSync(
		join(root, 'node_modules/.cache/xplat/sessions', run.sessionId, 'current.jsonl'),
		'{"seq":',
	)
	const incomplete = readDevLogs(root, run.sessionId)
	assert.equal(incomplete.incompleteTail, true)
	assert.equal(incomplete.nextCursor, page.nextCursor)
})
