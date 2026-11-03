// Actual project-installed worker + production native owner. Run through Turbo.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { join, resolve, dirname, relative, sep } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, realpathSync, statSync, rmSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertPortabilityArtifact, verifyPortabilitySource, sha256 } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
assert.ok(['darwin', 'linux', 'win32'].includes(process.platform))
const source = verifyPortabilitySource(root)
assert.ok(existsSync(join(root, 'project-packages.json')), 'Create the snapshot with snapshot:nim-portability-worker')
const fixture = JSON.parse(readFileSync(join(root, 'project-packages.json')))
assert.equal(fixture.version, 1)
assert.match(fixture.vite, /^\d+\.\d+\.\d+$/)
const work = resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability'))
const binary = join(work, 'bin', `xplat${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(join(work, 'build-result.json')))
assertPortabilityArtifact(root, build, readFileSync(binary), 'packages/cli/nim/main.nim')
const scratch = scratchRun(root, 'project-workflow')
const project = join(scratch, 'project with spaces'), temporary = join(scratch, 'tmp')
mkdirSync(project); mkdirSync(temporary, { mode: 0o700 })
const selected = realpathSync(project)
const environment = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', TMPDIR: temporary, TEMP: temporary, TMP: temporary,
 XPLAT_PORTABILITY_SENTINEL: 'selected project π😀', BUN_INSTALL_CACHE_DIR: join(work, 'project-package-cache') }
const nativeEnvironment = { ...environment, NODE_PATH: join(scratch, 'forbidden-global-modules'), NODE_OPTIONS: '--xplat-forbidden-preload', XPLAT_AGENT_HOST_IDLE_MS: '30000' }
const key = sha256(selected).slice(0, 32)
const hostDirectory = join(homedir(), '.cache/octane-xplat/nim-hosts', key)
const descriptorFile = join(hostDirectory, 'host.json')
const record = { version: 1, platform: process.platform, arch: process.arch, node: process.version,
 sourceCommit: source.manifest.sourceCommit, sourceManifestSha256: source.sha256, artifact: build.artifact,
 scope: 'Production native owner and selected-project worker; HTTP/TLS has its separate Turbo predecessor gate.',
 passed: false, steps: [] }
let descriptor
let ownersStopped = 0, attemptedOwnerStart = false
const observedChildren = new Set()

function write(path, value) {
 const destination = join(project, path)
 mkdirSync(dirname(destination), { recursive: true })
 writeFileSync(destination, typeof value === 'string' ? value : JSON.stringify(value))
}
function run(command, args, options = {}) {
 const result = spawnSync(command, args, { cwd: project, env: environment, encoding: 'utf8', timeout: 120000, maxBuffer: 16*1024*1024, ...options })
 assert.equal(result.status, 0, `${command} failed (${result.status ?? result.signal}): ${result.error?.message ?? ''}\n${result.stdout}\n${result.stderr}`)
 return result
}
function cli(args, emptyPath = false) {
 const result = run(binary, [...args, '--project', project, '--json'], { timeout: 12000,
  env: { ...nativeEnvironment, ...(emptyPath ? { PATH: '' } : {}) } })
 assert.equal(result.stderr, '')
 const value = JSON.parse(result.stdout)
 assert.equal(value.ok, true, JSON.stringify(value.error))
 return value.data
}
async function until(predicate, message, timeout = 30000) {
 const deadline = Date.now()+timeout
 while (Date.now() < deadline) {
  const value = await predicate()
  if (value) {return value}
  await delay(25)
 }
 assert.fail(message)
}
function alive(pid) {
 try {process.kill(pid, 0); return true}
 catch (error) {if (error.code === 'ESRCH') {return false}; throw error}
}
function assertGone(pid) {
 assert.equal(alive(pid), false, `Owned process ${pid} survived operation completion`)
 observedChildren.delete(pid)
}
function readMarker(path) {
 try {return JSON.parse(readFileSync(join(project, path)))}
 catch (error) {if (error instanceof SyntaxError || error.code === 'ENOENT') {return false}; throw error}
}
async function waitJob(id) {
 return await until(() => {
  const job = cli(['job', 'status', id]).job
  return ['succeeded', 'failed', 'cancelled'].includes(job.state) ? job : false
 }, 'Native project job did not settle')
}
function rpc(current, method, token = current.token) {
 return new Promise((resolve, reject) => {
  const socket = createConnection(current.socketPath)
  let output = ''
  const timer = setTimeout(() => {socket.destroy(); reject(Error('Native owner RPC timed out'))}, 5000)
  socket.once('error', reject)
  socket.once('close', () => clearTimeout(timer))
  socket.once('connect', () => socket.write(JSON.stringify({ token, method, params: {} })+'\n'))
  socket.on('data', bytes => {
   output += bytes
   if (output.includes('\n')) {
    socket.destroy()
    try {resolve(JSON.parse(output.split('\n')[0]))} catch (error) {reject(error)}
   }
  })
 })
}
async function shutdown() {
 if (!descriptor) {return}
 const current = descriptor
 const ping = await rpc(current, 'host.ping')
 assert.equal(ping.result.pid, current.pid)
 assert.equal(ping.result.startedAt, current.startedAt)
 assert.equal((await rpc(current, 'host.shutdown')).ok, true)
 await until(() => !alive(current.pid), 'Production native owner did not exit')
 assert.equal(existsSync(descriptorFile), false)
 assert.equal(existsSync(current.socketPath), false)
 descriptor = undefined
 ownersStopped++
}
function assertWindowsPrivate(path) {
 const literal = "'"+path.replaceAll("'", "''")+"'"
 const code = `$ErrorActionPreference='Stop'; $acl=Get-Acl -LiteralPath ${literal};
$user=[Security.Principal.WindowsIdentity]::GetCurrent().User;
$rules=$acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]);
@{currentOwner=($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -eq $user.Value);
protected=$acl.AreAccessRulesProtected;rules=$rules.Count;
onlyCurrentUser=(@($rules | Where-Object {$_.IdentityReference.Value -ne $user.Value}).Count -eq 0)} | ConvertTo-Json -Compress`
 const result = run('powershell.exe', ['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(code,'utf16le').toString('base64')])
 const security = JSON.parse(result.stdout)
 assert.deepEqual(security, { currentOwner: true, protected: true, rules: 1, onlyCurrentUser: true })
 return security
}
function workerTemps() {return readdirSync(temporary).filter(name => name.startsWith('xplat-worker-'))}
function generated(files) {
 return Object.fromEntries(files.map(path => [relative(project, path), sha256(readFileSync(path))]))
}
const loader = `import { writeFileSync } from 'node:fs';
export const loader = () => {
 const value = { answer: 42, cwd: process.cwd(), nodePath: process.env.NODE_PATH, nodeOptions: process.env.NODE_OPTIONS, sentinel: process.env.XPLAT_PORTABILITY_SENTINEL };
 writeFileSync('loader.json', JSON.stringify({ ...value, pid: process.pid, requestFile: process.argv[2] }));
 console.log('route stdout π😀'); console.error('route stderr β');
 return value;
};\n`

try {
 assert.equal(run('bun', ['--version']).stdout.trim(), '1.4.4')
 assert.match(run(binary, ['--help'], { env: { ...nativeEnvironment, PATH: '' } }).stdout, /experimental Nim CLI/)
 const catalog = JSON.parse(run(binary, ['catalog', '--json'], { env: { ...nativeEnvironment, PATH: '' } }).stdout)
 assert.equal(catalog.ok, true); assert.equal(catalog.data.cli.version, build.cliVersion)
 const packages = Object.fromEntries(fixture.packages.map(item => {
  assert.ok(['@octane-xplat/cli', '@octane-xplat/lib'].includes(item.name))
  const bytes = readFileSync(join(root, item.file))
  assert.equal(bytes.length, item.bytes); assert.equal(sha256(bytes), item.sha256)
  return [item.name, `file:${join(root, item.file).replaceAll('\\', '/')}`]
 }))
 assert.equal(Object.keys(packages).length, 2)
 write('package.json', { name: 'native-portability-project', private: true, type: 'module', packageManager: 'bun@1.4.4',
  xplat: { targets: { web: {} } }, devDependencies: { ...packages, vite: fixture.vite }, overrides: { '@octane-xplat/lib': packages['@octane-xplat/lib'] } })
 const installed = run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'])
 const manifest = JSON.parse(readFileSync(join(project, 'node_modules/@octane-xplat/cli/package.json')))
 assert.equal(manifest.dependencies['@octane-xplat/cli'], undefined)
 assert.equal(existsSync(join(project, 'node_modules/@octane-xplat/build')), false)
 assert.equal(existsSync(join(project, 'node_modules/@octane-xplat/cli/bin')), false, 'Project export fixture must not contain a CLI runtime')
 record.projectExecutables = readdirSync(join(project, 'node_modules/.bin')).sort()
 record.packages = fixture
 record.lockSha256 = sha256(readFileSync(join(project, 'bun.lock')))
 record.steps.push({ operation: 'install-project-tools', passed: true, summary: installed.stdout.trim().slice(-1000) })
 write('index.html', '<!doctype html><html><body><script type="module" src="/main.js"></script></body></html>')
 write('main.js', "import './theme.web.css'; document.body.textContent = 'native project workflow';\n")
 write('theme.web.css', '@platform web { .built-web { color: rgb(11,22,33) } } @platform mobile { .must-not-ship { color: red } }')
 write('app/index.tsx', 'throw Error("screen source must not execute"); export const dataMode = "baked"; export default () => null;\n')
 write('app/index.loader.ts', loader)
 write('vite.config.mjs', `import { xplatCss } from '@octane-xplat/cli/vite';
export default { plugins: [xplatCss('web'), { name: 'portable-engine', buildStart() { console.log('engine stdout π😀'); console.error('engine stderr β'); } }] };\n`)
 assert.deepEqual(cli(['session', 'list'], true), { sessions: [] })
 assert.equal(existsSync(descriptorFile), false)
 attemptedOwnerStart = true
 const started = cli(['runtime', 'build', '--platform', 'web', '--request-key', 'portable-success'])
 descriptor = JSON.parse(readFileSync(descriptorFile))
 assert.equal(descriptor.identity.name, '@octane-xplat/cli', 'The production CLI must own this workflow')
 if (process.platform !== 'win32') {
  assert.equal(statSync(hostDirectory).mode & 0o777, 0o700)
  assert.equal(statSync(descriptorFile).mode & 0o777, 0o600)
 }
 const firstOwner = (await rpc(descriptor, 'host.ping')).result
 assert.equal((await rpc(descriptor, 'host.ping', 'wrong')).error.code, 'permission_denied')
 const completed = await waitJob(started.job.jobId)
 assert.equal(completed.state, 'succeeded', JSON.stringify(completed.error))
 assert.equal(completed.result.summary, 'vite build succeeded')
 const observation = JSON.parse(readFileSync(join(project, 'loader.json')))
 observedChildren.add(observation.pid)
 assert.equal(observation.cwd, selected)
 assert.equal(observation.nodePath, ''); assert.equal(observation.nodeOptions, '')
 assert.equal(observation.sentinel, environment.XPLAT_PORTABILITY_SENTINEL)
 assert.ok(observation.requestFile.startsWith(temporary+sep))
 assertGone(observation.pid)
 assert.deepEqual(workerTemps(), [])
 const logs = cli(['diagnostics', '--job', completed.jobId, '--limit', '5000']).logs.records
 for (const [stream, line] of [['stdout', 'engine stdout π😀'], ['stderr', 'engine stderr β'], ['stderr', 'route stdout π😀'], ['stderr', 'route stderr β']]) {
  assert.ok(logs.some(record => record.stream === stream && record.line.includes(line)), `Missing ${stream}: ${line}`)
 }
 const css = readdirSync(join(project, 'dist/assets')).filter(file => file.endsWith('.css')).map(file => readFileSync(join(project, 'dist/assets', file), 'utf8')).join('\n')
 assert.match(css, /\.built-web/); assert.doesNotMatch(css, /must-not-ship/)
 const worker = join(project, 'node_modules/@octane-xplat/cli', manifest.exports['./worker'])
 write('reference-request.json', { protocol: 'octane-build-worker', version: 1, id: 'independent-plan', operation: 'route-plan', project: selected, bake: true })
 run(process.execPath, [worker, join(project, 'reference-request.json'), join(project, 'reference-result.json')])
 const reference = JSON.parse(readFileSync(join(project, 'reference-result.json')))
 assert.equal(reference.ok, true, JSON.stringify(reference.error)); assert.equal(reference.data.count, 1)
 assert.equal(reference.data.outputs.length, 18)
 for (const output of reference.data.outputs) {assert.equal(readFileSync(output.file, 'utf8'), output.source, output.file)}
 const outputFiles = reference.data.outputs.map(output => output.file), lastGood = generated(outputFiles)
 record.steps.push({ operation: 'production-web-build', passed: true, job: completed, worker: observation, outputHashes: lastGood,
  diagnostics: logs.filter(item => /(?:route|engine) (?:stdout|stderr)/.test(item.line)), cssFiltered: true })
 write('app/index.loader.ts', `import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs';
export const loader = async () => {
 process.on('SIGTERM', () => {}); setTimeout(() => process.exit(9), 30000);
 const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM",()=>{}); console.log("armed"); setTimeout(()=>process.exit(9),30000)'], { stdio: ['ignore','pipe','ignore'] });
 await new Promise(resolve => child.stdout.once('data', resolve)); child.stdout.resume();
 writeFileSync('armed.json', JSON.stringify({ pid: process.pid, child: child.pid, cwd: process.cwd(), requestFile: process.argv[2] }));
 console.error('project-worker-armed'); await new Promise(() => {});
};\n`)
 const pending = cli(['runtime', 'build', '--platform', 'web', '--request-key', 'portable-cancel'])
 const armed = await until(() => readMarker('armed.json'), 'The actual selected-project worker did not become armed')
 observedChildren.add(armed.pid); observedChildren.add(armed.child)
 assert.equal(armed.cwd, selected)
 assert.ok(armed.requestFile.startsWith(temporary+sep))
 if (process.platform !== 'win32') {assert.equal(statSync(dirname(armed.requestFile)).mode & 0o777, 0o700)}
 else {
  record.workerPrivacy = Object.fromEntries([dirname(armed.requestFile), armed.requestFile, join(dirname(armed.requestFile), 'result.json')].map(path => [path, assertWindowsPrivate(path)]))
 }
 const repeated = cli(['runtime', 'build', '--platform', 'web', '--request-key', 'portable-cancel'])
 assert.equal(repeated.deduplicated, true); assert.equal(repeated.job.jobId, pending.job.jobId)
 const cancelledAt = Date.now()
 cli(['job', 'cancel', pending.job.jobId])
 const cancelled = await waitJob(pending.job.jobId)
 assert.equal(cancelled.state, 'cancelled')
 assert.ok(Date.now()-cancelledAt < 6000, 'Cancellation must finish before fixture self-expiry')
 assertGone(armed.pid); assertGone(armed.child)
 assert.deepEqual(workerTemps(), [])
 assert.deepEqual(generated(outputFiles), lastGood, 'Cancellation must preserve last-good route artifacts')
 assert.equal((await rpc(descriptor, 'host.ping')).result.ownerId, firstOwner.ownerId)
 record.steps.push({ operation: 'cancel-canonical-worker', passed: true, job: cancelled, armed, cleanupMs: Date.now()-cancelledAt, lastGoodPreserved: true })
 const previous = descriptor
 await shutdown()
 write('app/index.loader.ts', loader)
 const restarted = cli(['runtime', 'build', '--platform', 'web', '--request-key', 'portable-restart'])
 descriptor = JSON.parse(readFileSync(descriptorFile))
 const nextOwner = (await rpc(descriptor, 'host.ping')).result
 assert.notEqual(nextOwner.ownerId, firstOwner.ownerId)
 assert.equal((await rpc(descriptor, 'host.ping', previous.token)).error.code, 'permission_denied')
 assert.equal((await waitJob(restarted.job.jobId)).state, 'succeeded')
 await shutdown()
 record.steps.push({ operation: 'owner-shutdown-and-restart', passed: true })
 record.passed = true
} catch (error) {
 record.error = error.message
 throw error
} finally {
 let cleanupFailure
 try {
  if (!descriptor && existsSync(descriptorFile)) {
   const current = JSON.parse(readFileSync(descriptorFile))
   assert.equal(current.workspaceRoot, selected)
   assert.equal(current.identity.name, '@octane-xplat/cli')
   descriptor = current
  }
  await shutdown()
  await until(() => [...observedChildren].every(pid => !alive(pid)), 'Owned fixture processes must finish before removing scratch', 35000)
 } catch (error) {cleanupFailure = error; record.cleanupError = error.message}
 const confirmed = !cleanupFailure && !descriptor && !existsSync(descriptorFile) && (ownersStopped > 0 || !attemptedOwnerStart)
 record.cleanupConfirmed = confirmed
 record.passed &&= confirmed
 if (confirmed) {rmSync(hostDirectory, { recursive: true, force: true }); rmSync(scratch, { recursive: true, force: true })}
 else if (!record.cleanupError) {record.cleanupError = 'Owner release is unconfirmed; preserved task scratch and host records'}
 writeFileSync(join(work, 'workflow-result.json'), JSON.stringify(record, null, 2)+'\n')
 if (!record.error && !confirmed) {
  throw cleanupFailure ?? Error(record.cleanupError)
 }
}
console.log(JSON.stringify({ platform: process.platform, arch: process.arch, passed: record.passed,
 steps: record.steps.map(step => step.operation), artifact: record.artifact }, null, 2))
