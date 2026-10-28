import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createDevLogCapture, readRetainedSession } from '../dist/dev-logs.js'
import { retainedDiagnostics } from '../dist/diagnostics.js'
import { discoverNativeReports, readNativeReport } from '../dist/native-reports.js'

function fixture(t, platform = 'macos') {
	const root = mkdtempSync(join(tmpdir(), 'xplat-native-reports-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({
			xplat: {
				targets: {
					macos: { runtime: 'appkit-node-api', package: { bundleIdentifier: 'org.example.test' } },
				},
			},
		}),
	)
	const capture = createDevLogCapture(root, {
		platform,
		targetId: platform === 'ios' ? '12345678-1234-1234-1234-123456789abc' : 'device-123',
	})
	if (platform !== 'macos') {
		capture.observeNativeOutput('Successfully synced application org.example.test on device test.')
	}
	if (platform === 'macos') {
		capture.observeNativeOutput('[macos-native] host started pid=321; 0 leaf libraries')
	}
	const run = readRetainedSession(root, capture.sessionId)
	const home = join(root, 'home')
	const directory = join(home, 'Library/Logs/DiagnosticReports')
	mkdirSync(directory, { recursive: true })
	const ips = (name, changes = {}, headerChanges = {}) => {
		const content =
			JSON.stringify({
				bug_type: '309',
				bundleID: 'org.example.test',
				platform: platform === 'ios' ? 7 : 1,
				timestamp: run.startedAt,
				...headerChanges,
			}) +
			'\n' +
			JSON.stringify({
				pid: 321,
				procLaunch: run.startedAt,
				captureTime: run.startedAt,
				platform: platform === 'ios' ? 7 : 1,
				exception: { type: 'EXC_CRASH', signal: 'SIGABRT' },
				...changes,
			})
		writeFileSync(join(directory, name + '.ips'), content)
		return content
	}
	return { root, run, capture, home, directory, ips }
}

test('Apple crash originals survive source deletion and log rotation, with exact association', async (t) => {
	const f = fixture(t)
	const original = f.ips('owned')
	f.ips('foreign', {}, { bundleID: 'org.other.app' })
	f.ips('stale', { captureTime: '2000-01-01T00:00:00Z' })
	const result = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(result.coverage.status, 'available')
	assert.equal(result.reports.length, 1)
	assert.equal(result.reports[0].association, 'confirmed')
	assert.match(result.reports[0].summary, /SIGABRT/)
	const id = result.reports[0].id
	for (let i = 0; i < 150; i++) {
		f.capture.append({ stream: 'stdout', line: 'x'.repeat(8192) })
	}
	rmSync(join(f.directory, 'owned.ips'))
	assert.equal(readNativeReport(f.root, f.run, id).content, original)
	const later = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(later.reports[0].id, id)
	assert.throws(
		() => readNativeReport(f.root, f.run, '../session.json'),
		(e) => e.code === 'invalid_selection',
	)
	const other = fixture(t)
	assert.throws(
		() => readNativeReport(other.root, other.run, id),
		(e) => e.code === 'not_found',
	)
	const raw = join(
		f.root,
		'node_modules/.cache/xplat/sessions',
		f.run.sessionId,
		'reports',
		id + '.txt',
	)
	writeFileSync(raw, 'tampered')
	assert.throws(
		() => readNativeReport(f.root, f.run, id),
		(e) => e.code === 'execution_failure',
	)
})

test('Apple lookup distinguishes empty, inaccessible, malformed and uncertain evidence', async (t) => {
	const f = fixture(t, 'ios')
	assert.equal(
		(await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })).coverage.status,
		'none-found',
	)
	assert.equal(
		(await discoverNativeReports(f.root, f.run, { host: 'linux', home: f.home })).coverage.status,
		'unavailable',
	)
	assert.equal(
		(await discoverNativeReports(f.root, f.run, { host: 'darwin', home: join(f.home, 'missing') }))
			.coverage.status,
		'unavailable',
	)
	f.ips('candidate', { pid: 999, procPath: '/redacted/App' })
	f.ips('foreign-device', {
		procPath: '/CoreSimulator/Devices/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/App',
	})
	f.ips('wrong-platform', { platform: 1 })
	writeFileSync(join(f.directory, 'malformed.ips'), 'not json')
	symlinkSync(join(f.directory, 'candidate.ips'), join(f.directory, 'link.ips'))
	const result = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(result.coverage.status, 'partial')
	assert.equal(result.reports.length, 1)
	assert.equal(result.reports[0].association, 'candidate')
	assert.equal(
		(
			await discoverNativeReports(
				f.root,
				{ ...f.run, targetId: 'physical-device' },
				{ host: 'darwin' },
			)
		).coverage.status,
		'unsupported',
	)
})

test('report retention is bounded, deduplicated and discloses omitted originals', async (t) => {
	const f = fixture(t)
	for (let i = 0; i < 12; i++) {
		f.ips('crash-' + i, { pid: i })
	}
	const result = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(result.reports.length, 10)
	assert.equal(result.coverage.status, 'partial')
	assert.equal(
		(await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })).reports.length,
		10,
	)
})

test('Android uses recorded device/package, retains exit records and discloses trace limits', async (t) => {
	const f = fixture(t, 'android')
	const timestamp = f.run.startedAt.replace('T', ' ').replace('Z', '')
	const record = `        ApplicationExitInfo #0:\n          timestamp=${timestamp} pid=42 realUid=123\n          process=org.example.test reason=5 (CRASH NATIVE) subreason=0 status=11\n          importance=100 trace=/data/tombstones/private\n`
	const output =
		'ACTIVITY MANAGER PROCESS EXIT INFO (dumpsys activity exit-info)\n  package: org.example.test\n' +
		record +
		record.replace('org.example.test', 'org.foreign.app')
	const calls = []
	const exec = async (command, args) => {
		calls.push([command, ...args])
		return args.includes('date') ? '+0000' : output
	}
	const result = await discoverNativeReports(f.root, f.run, { exec })
	assert.equal(result.coverage.status, 'partial')
	assert.match(result.coverage.detail, /not full ANR/)
	assert.equal(result.reports.length, 1)
	assert.equal(result.reports[0].kind, 'native-crash')
	assert.equal(result.reports[0].association, 'candidate')
	assert.equal(readNativeReport(f.root, f.run, result.reports[0].id).content, record)
	assert.deepEqual(calls[1], [
		'adb',
		'-s',
		'device-123',
		'shell',
		'dumpsys',
		'activity',
		'exit-info',
		'org.example.test',
	])
	assert.equal(
		(
			await discoverNativeReports(f.root, f.run, {
				exec: async () => {
					throw Object.assign(Error(), { code: 'ENOENT' })
				},
			})
		).coverage.status,
		'unavailable',
	)
	assert.equal(
		(await discoverNativeReports(f.root, f.run, { exec: async () => '+0000' })).coverage.status,
		'unavailable',
	)
	assert.equal(
		(await discoverNativeReports(f.root, { ...f.run, nativeIdentity: undefined }, { exec }))
			.coverage.status,
		'unavailable',
	)
})

test('missing Apple bundle ids require an observed PID and matching launch time', async (t) => {
	const f = fixture(t)
	f.ips('owned-no-bundle', {}, { bundleID: undefined })
	f.ips('unowned-no-bundle', { pid: 999 }, { bundleID: undefined })
	f.ips('reused-pid-no-bundle', { procLaunch: '2000-01-01T00:00:00Z' }, { bundleID: undefined })
	f.ips('wrong-bundle-even-with-pid', {}, { bundleID: 'org.foreign.app' })
	const result = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(result.reports.length, 1)
	assert.equal(result.reports[0].association, 'confirmed')
})

test('report byte budgets omit complete oversized/excess originals without truncating retained content', async (t) => {
	const f = fixture(t)
	f.ips('oversized', { padding: 'x'.repeat(4 * 1024 * 1024) })
	for (let i = 0; i < 6; i++) {
		f.ips('large-' + i, { pid: i, padding: 'x'.repeat(3 * 1024 * 1024) })
	}
	const result = await discoverNativeReports(f.root, f.run, { host: 'darwin', home: f.home })
	assert.equal(result.coverage.status, 'partial')
	assert.equal(result.reports.length, 5)
	assert.ok(result.reports.reduce((sum, r) => sum + r.bytes, 0) <= 16 * 1024 * 1024)
	for (const report of result.reports) {
		assert.equal(
			Buffer.byteLength(readNativeReport(f.root, f.run, report.id).content),
			report.bytes,
		)
	}
})

test('native cache failures leave captured logs readable with explicit unavailability', async (t) => {
	const f = fixture(t)
	f.capture.append({ stream: 'stderr', line: 'still readable' })
	writeFileSync(
		join(f.root, 'node_modules/.cache/xplat/sessions', f.run.sessionId, 'reports'),
		'invalid directory',
	)
	const result = await retainedDiagnostics(f.root, { sessionId: f.run.sessionId, cursor: 0 })
	assert.ok(result.logs.records.some((record) => record.line === 'still readable'))
	assert.equal(result.coverage.nativeReports.status, 'unavailable')
	assert.match(result.coverage.nativeReports.detail, /retention failed/)
})
