import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binaries = join(work, `go-tests-${target}`)
const record = JSON.parse(readFileSync(binaries + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

assert.equal(record.kind, 'test-executable')
for (const [file, hash] of Object.entries(record.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const history = Object.entries(record.binaries).find(
  ([, info]) => info.directory === 'internal/history',
)
assert.ok(history, 'go-tests build lacks the internal/history test binary')
const [historyFile, historyInfo] = history
const binary = join(binaries, historyFile)
assert.equal(sha(readFileSync(binary)), historyInfo.sha256)

// The pinned expectations below are the reference semantics the Go engine
// replaced: it is the sole implementation now, so the corpus carries literal
// expected reports instead of a second engine's output.
function expectedAppleReport(content, now, association) {
  return association === null
    ? null
    : {
        id: 'report_' + sha(content),
        kind: 'native-crash',
        source: 'apple-ips',
        timestamp: now,
        summary: 'EXC_CRASH (SIGABRT)',
        association,
        associationReason:
          association === 'confirmed'
            ? 'Observed host PID, launch time and report time match this run; bundle id also matches when present.'
            : 'Bundle id and report time match; exact process ownership is not established.',
        bytes: Buffer.byteLength(content),
      }
}

test('native Apple report parsing matches the pinned semantic corpus', async () => {
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

    for (const [name, bodyChanges, headerChanges, association, rewrite] of [
      ['confirmed', {}, {}, 'confirmed'],
      ['candidate', { pid: 999 }, {}, 'candidate'],
      ['foreign', {}, { bundleID: 'org.other.app' }, null],
      ['stale', { captureTime: '2000-01-01T00:00:00Z' }, {}, null],
      ['no-bundle-owned', {}, { bundleID: null }, 'confirmed'],
      ['no-bundle-foreign', { pid: 999 }, { bundleID: null }, null],
      [
        'integral-json-numbers',
        {},
        {},
        'confirmed',
        (text) =>
          text.replaceAll('"platform":1', '"platform":1.0').replace('"pid":321', '"pid":321.0'),
      ],
      ['platform-string', { platform: '1' }, {}, 'confirmed'],
      ['pid-string', { pid: '321' }, {}, 'candidate'],
      ['empty-capture-time', { captureTime: '' }, {}, null],
      ['null-capture-time', { captureTime: null }, {}, 'confirmed'],
      [
        'empty-header-bundle',
        { pid: 999, bundleInfo: { CFBundleIdentifier: run.nativeIdentity.appId } },
        { bundleID: '' },
        null,
      ],
      ['platform-fallback', { platform: null }, {}, 'confirmed'],
    ]) {
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

      cases.push({ name, run, content, now, expected: expectedAppleReport(content, now, association) })
    }

    const path = join(base, 'corpus.json')

    writeFileSync(path, JSON.stringify(cases))

    const result = spawnSync(
      binary,
      ['-test.run=^TestNativeAppleReportsReferenceCorpus$', '-test.v'],
      { env: { ...process.env, XPLAT_GO_REPORT_CORPUS: path }, encoding: 'utf8', timeout: 20000 },
    )

    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.equal(
      result.stdout.match(/--- PASS: TestNativeAppleReportsReferenceCorpus\//g)?.length,
      cases.length,
      result.stdout,
    )
    writeFileSync(
      join(work, `report-reference-${target}.json`),
      JSON.stringify(
        {
          target,
          binarySha256: historyInfo.sha256,
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

test('native Android exit history matches the pinned semantic corpus', async () => {
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

    const expectedAndroidReport = (data, kind, reason) => ({
      id: 'report_' + sha(data),
      kind,
      source: 'android-exit-info',
      timestamp: now,
      summary: `${reason}; status=11`,
      association: 'candidate',
      associationReason:
        'Recorded device/package and exit time match; timestamp uses the device’s current time zone and does not establish exact process ownership.',
      bytes: Buffer.byteLength(data),
    })

    const cases = []

    for (const [name, output, zone, kind, reason, status] of [
      ['native-crash', prefix + block, '+0000', 'native-crash', 'CRASH NATIVE', 'partial'],
      [
        'java-crash',
        prefix + block.replace('reason=5 (CRASH NATIVE)', 'reason=4 (CRASH)'),
        '+0000',
        'crash',
        'CRASH',
        'partial',
      ],
      [
        'anr-crlf',
        (prefix + block.replace('reason=5 (CRASH NATIVE)', 'reason=6 (ANR)')).replaceAll(
          '\n',
          '\r\n',
        ),
        '+0000',
        'anr',
        'ANR',
        'partial',
      ],
      [
        'child-process',
        prefix +
          block.replace('process=org.octane.reference', 'process=org.octane.reference:child'),
        '+0000',
        'native-crash',
        'CRASH NATIVE',
        'partial',
      ],
      [
        'foreign-package',
        prefix +
          block.replace('process=org.octane.reference', 'process=org.octane.reference.other'),
        '+0000',
        null,
        null,
        'partial',
      ],
      ['stale', prefix + block.replace(timestamp, '2000-01-01 00:00:00.000'), '+0000', null, null, 'partial'],
      [
        'malformed',
        'ACTIVITY MANAGER PROCESS EXIT INFO\nApplicationExitInfo unknown',
        '+0000',
        null,
        null,
        'unavailable',
      ],
      ['unsupported', 'unknown output', '+0000', null, null, 'unavailable'],
      ['invalid-zone', prefix + block, 'unavailable', null, null, 'unavailable'],
    ]) {
      const data = kind === null ? null : output.slice(output.indexOf('        ApplicationExitInfo'))

      cases.push({
        Name: name,
        Run: run,
        Output: output,
        Zone: zone,
        Now: now,
        Expected: data === null ? [] : [expectedAndroidReport(data, kind, reason)],
        Status: status,
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
    assert.equal(
      result.stdout.match(/--- PASS: TestAndroidNativeReportReferenceCorpus\//g)?.length,
      cases.length,
      result.stdout,
    )
    writeFileSync(
      join(work, `android-report-reference-${target}.json`),
      JSON.stringify(
        {
          target,
          binarySha256: historyInfo.sha256,
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
