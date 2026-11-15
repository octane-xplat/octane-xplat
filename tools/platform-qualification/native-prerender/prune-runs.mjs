#!/usr/bin/env node
// Prunes accumulated run-* directories under the native-prerender scratch and
// report roots. Each build/run writes a fresh run-* directory and nothing
// removed them, so the directories grow without bound (the iOS scratch alone
// reached 14G).
//
// Scratch builds are grouped by control signature and only the newest build
// per group is kept, because --run always selects the newest match. Report
// suites keep the newest --keep-reports directories. Directories missing
// build.json (abandoned builds) are deleted once older than --min-age.
//
// Usage:
//   node prune-runs.mjs [--dry-run] [--keep-builds N] [--keep-reports N]
//                       [--min-age MINUTES]

import { createHash } from 'node:crypto'
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))

let dryRun = false
let keepBuilds = Number(process.env.XPLAT_PRERENDER_KEEP_BUILDS || 1)
let keepReports = Number(process.env.XPLAT_PRERENDER_KEEP_REPORTS || 5)
let minAgeMs = 60 * 60 * 1000
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') dryRun = true
  else if (args[i] === '--keep-builds') keepBuilds = Number(args[++i])
  else if (args[i] === '--keep-reports') keepReports = Number(args[++i])
  else if (args[i] === '--min-age') minAgeMs = Number(args[++i]) * 60 * 1000
  else {
    console.error(`unknown argument: ${args[i]}`)
    process.exit(2)
  }
}

const scratch = join(homedir(), 'agent-scratch/octane-xplat')
const reports = join(homedir(), 'dev/reports/octane-xplat')

const runDirs = (parent) => {
  if (!existsSync(parent)) return []
  return readdirSync(parent)
    .filter((name) => name.startsWith('run-'))
    .map((name) => {
      const path = join(parent, name)
      return { name, path, mtimeMs: statSync(path).mtimeMs }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

const hash = (value) => createHash('sha1').update(value).digest('hex').slice(0, 12)

// Files outside the repository identify the caller-supplied inputs (the
// custom screen directory, an overridden Mason dist) that distinguish one
// build of a control from another.
const outsideKeys = (build) =>
  Object.keys(build.sourceHashes || {})
    .filter((key) => !key.startsWith(REPO + '/'))
    .sort()
    .join('\n')

const IOS_CONTROLS = ['startupFixture', 'startupMode']
const ANDROID_CONTROLS = [
  'adopt',
  'artifactAdopt',
  'customAdopt',
  'parity',
  'recreate',
  'input',
  'application',
  'entry',
  'restore',
  'staleRootInsets',
  'startup',
  'fallback',
  'lifetime',
]

const signature = (build, fields) =>
  hash(
    fields.map((field) => `${field}=${JSON.stringify(build[field])}`).join('|') +
      '|' +
      outsideKeys(build),
  )

// Prune run-* directories under parent, keeping keepFor(dir) directories.
// Groups directories by signatureOf(build.json) and keeps the newest
// per group. Directories without build.json are removed once old enough.
const prune = (parent, { signatureOf, keep, label }) => {
  const dirs = runDirs(parent)
  if (dirs.length === 0) return
  const groups = new Map()
  const stale = []
  const now = Date.now()
  for (const dir of dirs) {
    const buildPath = join(dir.path, 'build.json')
    if (!existsSync(buildPath)) {
      if (now - dir.mtimeMs > minAgeMs) stale.push(dir)
      continue
    }
    let key = 'unparseable'
    try {
      key = signatureOf(JSON.parse(readFileSync(buildPath, 'utf8')))
    } catch {
      // An unparseable build.json still occupies a group slot by name so a
      // corrupt newest directory does not silently protect older ones.
      key = `unparseable:${dir.name}`
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(dir)
  }
  const remove = [...stale]
  for (const group of groups.values()) {
    // Newest first: keep the first `keep` entries per signature.
    for (const dir of group.slice(keep)) remove.push(dir)
  }
  for (const dir of remove) {
    console.log(`${dryRun ? 'would remove' : 'removed'} ${label}/${dir.name}`)
    if (!dryRun) rmSync(dir.path, { recursive: true, force: true })
  }
  if (remove.length === 0) console.log(`${label}: nothing to prune`)
}

prune(join(scratch, 'native-prerender-sdk-startup-ios'), {
  label: 'ios-builds',
  keep: keepBuilds,
  signatureOf: (build) => signature(build, IOS_CONTROLS),
})

prune(join(scratch, 'native-prerender-android'), {
  label: 'android-builds',
  keep: keepBuilds,
  signatureOf: (build) => signature(build.home || {}, ANDROID_CONTROLS),
})

// Producer output is consumed by the next build step and never reused by
// --run, so only the newest directory is worth keeping.
prune(join(scratch, 'native-prerender-home-producer'), {
  label: 'producer',
  keep: keepBuilds,
  signatureOf: () => 'all',
})

// Report suites: newest N run-* directories regardless of control.
for (const [suite, label] of [
  ['native-prerender-sdk-startup-ios', 'ios-reports'],
  ['native-prerender-android-bootstrap', 'android-reports'],
  ['native-prerender-mount-android', 'android-mount-reports'],
]) {
  prune(join(reports, suite), {
    label,
    keep: keepReports,
    signatureOf: () => 'all',
  })
}
