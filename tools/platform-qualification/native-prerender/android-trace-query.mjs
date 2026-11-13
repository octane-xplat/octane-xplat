import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

function check(value, reason) {
  if (!value) throw new Error(reason)
}
export function createTraceQuery(report, processor, trace) {
  return function query(name, sql) {
    writeFileSync(join(report, name + '.sql'), sql)
    const result = spawnSync(
      processor,
      ['query', '--full-sort', '--quiet', '--format', 'csv', trace, sql],
      {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      },
    )
    writeFileSync(join(report, name + '.log'), result.stderr ?? '')
    check(
      !result.error && result.status === 0,
      'Trace query failed: ' + name + ': ' + String(result.error ?? result.stderr),
    )
    const rows = result.stdout.trim().split(/\r?\n/)
    check(
      rows.length === 2 && rows[0] === '"evidence_hex"' && /^"[0-9A-F]+"$/.test(rows[1]),
      'Unexpected trace query encoding',
    )
    return JSON.parse(Buffer.from(rows[1].slice(1, -1), 'hex').toString('utf8'))
  }
}
