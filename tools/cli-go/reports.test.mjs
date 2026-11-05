import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { discoverNativeReports } from '../../packages/cli/dist/native-reports.js'
import { scratchRun } from '../cli-nim/scratch.mjs'

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
