import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { discoverNativeReports } from '../../packages/cli/dist/native-reports.js'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `go-tests-${target}${process.platform === 'win32' ? '.exe' : ''}`)
const record = JSON.parse(readFileSync(binary + '.json'))
assert.equal(createHash('sha256').update(readFileSync(binary)).digest('hex'), record.sha256)
for (const [file, hash] of Object.entries(record.inputs)) {
	assert.equal(
		createHash('sha256')
			.update(readFileSync(join(root, file)))
			.digest('hex'),
		hash,
		file,
	)
}

test('native Apple report parsing agrees with the actual Node engine on accepted and rejected evidence', async () => {
	const base = mkdtempSync(join(scratchRun(root, 'go-report-reference'), 'case-'))
	try {
		const now = new Date().toISOString(),
			run = {
				sessionId: 'sess_00000000-0000-0000-0000-000000000001',
				platform: 'macos',
				targetId: 'macos',
				startedAt: now,
				endedAt: now,
				nativeIdentity: {
					appId: 'org.octane.reference',
					processes: [{ pid: 321, observedAt: now }],
				},
			}

		const cases = []
		for (const [name, bodyChanges, headerChanges, rewrite] of [
			['confirmed', {}, {}],
			['candidate', { pid: 999 }, {}],
			['foreign', {}, { bundleID: 'org.other.app' }],
			['stale', { captureTime: '2000-01-01T00:00:00Z' }, {}],
			['no-bundle-owned', {}, { bundleID: null }],
			['no-bundle-foreign', { pid: 999 }, { bundleID: null }],
			[
				'integral-json-numbers',
				{},
				{},
				(text) =>
					text.replaceAll('"platform":1', '"platform":1.0').replace('"pid":321', '"pid":321.0'),
			],
			['platform-string', { platform: '1' }, {}],
			['pid-string', { pid: '321' }, {}],
			['empty-capture-time', { captureTime: '' }, {}],
			['null-capture-time', { captureTime: null }, {}],
			[
				'empty-header-bundle',
				{ pid: 999, bundleInfo: { CFBundleIdentifier: run.nativeIdentity.appId } },
				{ bundleID: '' },
			],
			['platform-fallback', { platform: null }, {}],
		]) {
			const home = join(base, name, 'home'),
				directory = join(home, 'Library/Logs/DiagnosticReports')

			mkdirSync(directory, { recursive: true })
			let content =
				JSON.stringify({
					bug_type: '309',
					bundleID: run.nativeIdentity.appId,
					platform: 1,
					timestamp: now,
					...headerChanges,
				}) +
				'\n' +
				JSON.stringify({
					pid: 321,
					platform: 1,
					captureTime: now,
					procLaunch: now,
					exception: { type: 'EXC_CRASH', signal: 'SIGABRT' },
					...bodyChanges,
				})

			if (rewrite) {
				content = rewrite(content)
			}

			writeFileSync(join(directory, 'fixture.ips'), content)
			const expected = await discoverNativeReports(join(base, name), run, { host: 'darwin', home })
			assert.ok(expected.reports.length <= 1)
			cases.push({ name, run, content, now, expected: expected.reports[0] ?? null })
		}

		const path = join(base, 'corpus.json')
		writeFileSync(path, JSON.stringify(cases))
		const result = spawnSync(
			binary,
			['-test.run=^TestNativeAppleReportsReferenceCorpus$', '-test.v'],
			{ env: { ...process.env, XPLAT_GO_REPORT_CORPUS: path }, encoding: 'utf8', timeout: 20000 },
		)

		assert.equal(result.status, 0, result.stdout + result.stderr)
		writeFileSync(
			join(work, `report-reference-${target}.json`),
			JSON.stringify(
				{
					target,
					binarySha256: record.sha256,
					cases: cases.map(({ name, expected }) => ({
						name,
						association: expected?.association ?? null,
					})),
					passed: true,
				},
				null,
				2,
			),
		)
	} finally {
		rmSync(base, { recursive: true, force: true })
	}
})

test('native Android exit history agrees with Node for record kinds, scope, CRLF and unavailable formats', async () => {
	const base = mkdtempSync(join(scratchRun(root, 'go-android-report-reference'), 'case-'))
	try {
		const now = new Date().toISOString(),
			run = {
				sessionId: 'sess_00000000-0000-0000-0000-000000000001',
				platform: 'android',
				targetId: 'emulator-5588',
				startedAt: now,
				endedAt: now,
				nativeIdentity: { appId: 'org.octane.reference', processes: [] },
			}

		const timestamp = now.replace('T', ' ').replace('Z', '')
		const prefix =
			'ACTIVITY MANAGER PROCESS EXIT INFO (dumpsys activity exit-info)\n  package: org.octane.reference\n'

		const block = `        ApplicationExitInfo #0:\n          timestamp=${timestamp} pid=42 realUid=123\n          process=org.octane.reference reason=5 (CRASH NATIVE) subreason=0 status=11\n          importance=100 trace=/data/tombstones/private\n`
		const cases = []
		for (const [name, output, zone] of [
			['native-crash', prefix + block, '+0000'],
			[
				'java-crash',
				prefix + block.replace('reason=5 (CRASH NATIVE)', 'reason=4 (CRASH)'),
				'+0000',
			],
			[
				'anr-crlf',
				(prefix + block.replace('reason=5 (CRASH NATIVE)', 'reason=6 (ANR)')).replaceAll(
					'\n',
					'\r\n',
				),
				'+0000',
			],
			[
				'child-process',
				prefix +
					block.replace('process=org.octane.reference', 'process=org.octane.reference:child'),
				'+0000',
			],
			[
				'foreign-package',
				prefix +
					block.replace('process=org.octane.reference', 'process=org.octane.reference.other'),
				'+0000',
			],
			['stale', prefix + block.replace(timestamp, '2000-01-01 00:00:00.000'), '+0000'],
			['malformed', 'ACTIVITY MANAGER PROCESS EXIT INFO\nApplicationExitInfo unknown', '+0000'],
			['unsupported', 'unknown output', '+0000'],
			['invalid-zone', prefix + block, 'unavailable'],
		]) {
			const expected = await discoverNativeReports(join(base, name), run, {
				exec: async (_tool, args) => (args.includes('date') ? zone : output),
			})

			cases.push({
				Name: name,
				Run: run,
				Output: output,
				Zone: zone,
				Now: now,
				Expected: expected.reports,
				Status: expected.coverage.status,
			})
		}

		const path = join(base, 'corpus.json')
		writeFileSync(path, JSON.stringify(cases))
		const result = spawnSync(
			binary,
			['-test.run=^TestAndroidNativeReportReferenceCorpus$', '-test.v'],
			{
				env: { ...process.env, XPLAT_GO_ANDROID_REPORT_CORPUS: path },
				encoding: 'utf8',
				timeout: 20000,
			},
		)

		assert.equal(result.status, 0, result.stdout + result.stderr)
		writeFileSync(
			join(work, `android-report-reference-${target}.json`),
			JSON.stringify(
				{
					target,
					binarySha256: record.sha256,
					cases: cases.map(({ Name, Status, Expected }) => ({
						name: Name,
						status: Status,
						kind: Expected[0]?.kind ?? null,
					})),
					passed: true,
				},
				null,
				2,
			),
		)
	} finally {
		rmSync(base, { recursive: true, force: true })
	}
})
