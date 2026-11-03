// Runs inside the disposable portability source snapshot, through Turbo.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { getToolchain, nimVersion } from 'nim-toolchain'
import { prepareDependencies } from './dependencies.mjs'
import { verifyPortabilitySource, sha256 } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
const source = verifyPortabilitySource(root)
const manifest = source.manifest
const selected = process.argv[2] ?? 'cli'
const entries = { cli: ['packages/cli/nim/main.nim', 'xplat'], http: ['tools/cli-nim/http_probe.nim', 'http-probe'], process: ['tools/cli-nim/process_probe.nim', 'process-probe'] }
assert.ok(Object.hasOwn(entries, selected), 'Choose cli, http or process')
const [entry, name] = entries[selected]
assert.equal(nimVersion, '2.2.12')
const cache = resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability'))
mkdirSync(cache, { recursive: true })
const recordPath = join(cache, selected === 'cli' ? 'build-result.json' : `${selected}-build-result.json`)
const record = { version: 1, entry, sourceCommit: manifest.sourceCommit, sourceManifestSha256: source.sha256,
 platform: process.platform, arch: process.arch, node: process.version, nim: nimVersion, compiled: false, runtime: 'not-run' }
function run(command, args, options = {}) {
 const result = spawnSync(command, args, { cwd: root, env: process.env, timeout: 900000, stdio: 'inherit', ...options })
 assert.equal(result.status, 0, `${command} failed (${result.status ?? result.signal}): ${result.error?.message ?? ''}`)
 return result
}
try {
 if (process.platform === 'win32' && process.env.XPLAT_NIM_CC === 'vcc') {
  assert.ok(process.env.INCLUDE && process.env.LIB, 'Configure the Visual C++ environment and forward INCLUDE/LIB through Turbo')
 }
 const compiler = await getToolchain({ cacheDir: join(cache, 'toolchain') })
 assert.equal(compiler.version, nimVersion)
 const paths = prepareDependencies(cache, compiler)
 const binary = join(cache, 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`)
 mkdirSync(dirname(binary), { recursive: true })
 const flags = ['c', '-d:release', '--opt:size', '--mm:orc',
  ...(process.platform === 'win32' ? ['--parallelBuild:4'] : []),
  ...(process.env.XPLAT_NIM_CC ? [`--cc:${process.env.XPLAT_NIM_CC}`] : []),
  ...(process.platform === 'win32' && process.env.XPLAT_NIM_CC === 'vcc' ?
   ['--vcc.exe:cl.exe', '--vcc.cpp.exe:cl.exe', '--vcc.linkerexe:cl.exe', '--vcc.cpp.linkerexe:cl.exe'] : []),
  ...(process.platform === 'linux' ? ['--passL:-Wl,--gc-sections'] : []),
  `-d:xplatNimDependencyRoot:${join(cache, 'dependencies')}`,
  ...paths.map(path => `--path:${path}`), `--nimcache:${join(cache, selected === 'cli' ? 'nimcache' : `nimcache-${selected}`)}`, `-o:${binary}`,
  join(root, entry)]
 record.flags = flags
 run(compiler.nim, flags, { env: compiler.env })
 record.compiled = true
 record.stripped = false
 if (process.platform !== 'win32') {run('strip', [binary]); record.stripped = true}
 verifyPortabilitySource(root)
 const bytes = readFileSync(binary)
 record.artifact = { bytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 6 }).length, sha256: sha256(bytes) }
 if (process.platform === 'linux') {assert.equal(bytes.subarray(0, 4).toString('hex'), '7f454c46')}
 if (process.platform === 'win32') {assert.equal(bytes.subarray(0, 2).toString(), 'MZ')}
 if (selected === 'cli') {
  const standaloneEnv = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH')), PATH: '' }
  const help = run(binary, ['--help'], { encoding: 'utf8', stdio: 'pipe', timeout: 10000, env: standaloneEnv })
  assert.match(help.stdout, /experimental Nim CLI/)
  const catalog = run(binary, ['catalog', '--json'], { encoding: 'utf8', stdio: 'pipe', timeout: 10000, env: standaloneEnv })
  const result = JSON.parse(catalog.stdout)
  assert.equal(result.contractVersion, 1)
  assert.equal(result.ok, true)
  record.runtime = 'help-and-catalog-only'
  record.runtimePath = ''
  record.cliVersion = result.data.cli.version
  record.qualification = 'No HTTP/TLS, RPC, worker, cancellation or descendant cleanup qualified by this smoke'
 }
 console.log(JSON.stringify(record, null, 2))
} catch (error) {
 record.error = error.message
 throw error
} finally {writeFileSync(recordPath, JSON.stringify(record, null, 2)+'\n')}
