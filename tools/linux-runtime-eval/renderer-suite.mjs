import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, isAbsolute, join, resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '../..')
const testRoot = resolve(repoRoot, 'packages/linux-gtk-renderer/test')
const args = process.argv.slice(2)
const requestedEngine = ['native', 'gjs'].includes(args[0]) ? args.shift() : undefined
const engine = requestedEngine ?? process.env.LINUX_RUNTIME_EVAL_ENGINE
if (!['native', 'gjs'].includes(engine)) {
  throw Error('Pass native or gjs, or set LINUX_RUNTIME_EVAL_ENGINE')
}

const allFiles = readdirSync(testRoot)
  .filter((name) => /\.test\.m(?:js|ts)$/.test(name))
  .filter((name) => name !== 'shared-gestures.test.mts')
  .sort()
const unrouted = allFiles.filter((name) => !readFixtureTest(join(testRoot, name)))
if (unrouted.length > 0) {
  throw Error(`GTK test files missing an evaluation runner: ${unrouted.join(', ')}`)
}
const requested = args
const unknown = requested.filter((stem) => !allFiles.some((name) => name === `${stem}.test.mjs` || name === `${stem}.test.mts`))
if (unknown.length > 0) throw Error(`Unknown GTK fixture test(s): ${unknown.join(', ')}`)
const selected =
  requested.length > 0 ? new Set(allFiles.filter((name) => requested.some((stem) => name === `${stem}.test.mjs` || name === `${stem}.test.mts`))) : undefined
const files = allFiles
  .filter((name) => !selected || selected.has(name))
  .map((name) => join(testRoot, name))
if (files.length === 0) throw Error(`No GTK fixture tests found in ${testRoot}`)

function readFixtureTest(path) {
  if (['prebuilt-engine.test.mjs', 'style-css.test.mts', 'window-service.test.mts'].includes(basename(path))) return true
  const source = readFileSync(path, 'utf8')
  return source.includes('runGtkUiFixture(') || source.includes('runGtkEvalFixture(')
}

const logBaseInput =
  process.env.LINUX_RUNTIME_EVAL_LOG_DIR ?? join(tmpdir(), 'octane-linux-runtime-eval')
const logBase = isAbsolute(logBaseInput) ? logBaseInput : resolve(repoRoot, logBaseInput)
mkdirSync(logBase, { recursive: true })
const logDir = mkdtempSync(join(logBase, `${engine}-`))
console.log(`Running ${files.length} GTK fixtures with ${engine}; logs: ${logDir}`)

const child = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
  cwd: repoRoot,
  env: {
    ...process.env,
    LINUX_RUNTIME_EVAL_ENGINE: engine,
    LINUX_RUNTIME_EVAL_LOG_DIR: logDir,
  },
  stdio: 'inherit',
})
if (child.error) throw child.error
process.exitCode = child.status ?? 1
