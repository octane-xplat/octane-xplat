// Actual Windows ACLs, retained NTFS identities and lifetime locks.
import { test, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync,
 readdirSync, statSync, linkSync, unlinkSync, symlinkSync, renameSync, openSync, closeSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { assertCurrentNativeBuild, storageProbeInputs } from './native-inputs.mjs'
import { assertPortabilityArtifact } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
const windows = process.platform === 'win32'
const host = { skip: !windows }
const portable = existsSync(join(root, 'portability-source.json'))
const work = portable ? resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability')) : join(root, 'research/nim-cli')
const binary = join(work, portable ? 'bin/storage-probe.exe' : 'native/storage-probe.exe')
const evidence = [], probes = new Set()
let scratch
if (windows) {
 mkdirSync(join(work, 'storage-fixtures'), { recursive: true })
 scratch = mkdtempSync(join(work, 'storage-fixtures/windows-'))
 const bytes = readFileSync(binary)
 if (portable) {assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'storage-build-result.json'))), bytes, 'tools/cli-nim/storage_probe.nim')}
 else {assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/storage-build.json'))), bytes, storageProbeInputs)}
}
function probe() {
 const child = spawn(binary, [], { env: { ...process.env, PATH: '', NODE_PATH: '', NODE_OPTIONS: '' }, stdio: ['pipe','pipe','pipe'] })
 const lines = createInterface({ input: child.stdout })
 let errors = ''
 child.stderr.setEncoding('utf8'); child.stderr.on('data', text => {errors += text})
 const closed = once(child, 'close')
 const value = {
  child,
  async send(request) {
   const line = once(lines, 'line')
   const timer = setTimeout(() => child.kill('SIGKILL'), 10000)
   child.stdin.write(JSON.stringify(request)+'\n')
   try {
    const result = await Promise.race([line.then(([text]) => JSON.parse(text)), closed.then(() => {throw Error(`Storage probe ended: ${errors}`)})])
    evidence.push({ request, result }); return result
   } finally {clearTimeout(timer)}
  },
  async close(kill = false) {
   if (!probes.delete(value)) {return}
   if (kill) {child.kill('SIGKILL')} else {child.stdin.end()}
   const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
   try {
    const [code] = await closed
    if (!kill) {assert.equal(code, 0, errors); assert.equal(errors, '')}
   } finally {clearTimeout(timer); lines.close()}
  },
 }
 probes.add(value); return value
}
afterEach(async () => {for (const value of [...probes]) {await value.close()}})
after(() => {
 if (windows) {
  writeFileSync(join(work, 'storage-windows-evidence.json'), JSON.stringify(evidence, null, 2)+'\n')
  rmSync(scratch, { recursive: true, force: true })
 }
})
const quote = text => "'"+text.replaceAll("'", "''")+"'"
function powershell(code) {
 const run = spawnSync('powershell.exe', ['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from("$ErrorActionPreference='Stop'; "+code,'utf16le').toString('base64')], { encoding: 'utf8', timeout: 10000 })
 assert.equal(run.status, 0, run.stderr)
 return run.stdout.trim()
}
function acl(path) {
 return JSON.parse(powershell(`$acl=Get-Acl -LiteralPath ${quote(path)};
 $user=[Security.Principal.WindowsIdentity]::GetCurrent().User;
 $rules=$acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]);
 @{currentOwner=($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -eq $user.Value);
 protected=$acl.AreAccessRulesProtected; rules=$rules.Count;
 onlyCurrentUser=(@($rules | Where-Object {$_.IdentityReference.Value -ne $user.Value}).Count -eq 0)} | ConvertTo-Json -Compress`))
}
function broaden(path) {
 powershell(`$path=${quote(path)}; $acl=Get-Acl -LiteralPath $path;
 $sid=[Security.Principal.SecurityIdentifier]::new('S-1-1-0');
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,[Security.AccessControl.FileSystemRights]::Read,[Security.AccessControl.AccessControlType]::Allow));
 Set-Acl -LiteralPath $path -AclObject $acl`)
}
async function directory(client, name) {
 const path = join(scratch, name)
 assert.deepEqual(await client.send({ operation: 'directory', path }), { ok: true, private: true })
 return path
}
async function publish(client, path, bytes) {
 const value = await client.send({ operation: 'publish', path, base64: Buffer.from(bytes).toString('base64') })
 assert.equal(value.ok, true, JSON.stringify(value)); return value
}
function rejected(value) {assert.equal(value.ok, false, JSON.stringify(value))}

test('private directory creation is atomic, recursive, current-user only and Unicode-safe', host, async () => {
 const client = probe()
 const path = await directory(client, 'nested/space π😀/private')
 assert.deepEqual(acl(path), { currentOwner: true, protected: true, rules: 1, onlyCurrentUser: true })
 const before = statSync(path, { bigint: true }).ino
 await client.send({ operation: 'directory', path })
 assert.equal(statSync(path, { bigint: true }).ino, before)
 assert.deepEqual(await client.send({ operation: 'existing', path: join(path, 'absent') }), { ok: true, private: false })
})
test('binary publication, exact read bounds and identity-bound removal preserve replacement files', host, async () => {
 const client = probe(), parent = await directory(client, 'bytes')
 const path = join(parent, 'data.json'), bytes = Buffer.from([0,255,128,1,10,195,169])
 const old = await publish(client, path, bytes)
 assert.deepEqual(readFileSync(path), bytes)
 assert.deepEqual(acl(path), { currentOwner: true, protected: true, rules: 1, onlyCurrentUser: true })
 assert.equal((await client.send({ operation: 'read', path, maximum: bytes.length })).base64, bytes.toString('base64'))
 rejected(await client.send({ operation: 'read', path, maximum: bytes.length-1 }))
 const current = await publish(client, path, 'replacement π😀')
 assert.notEqual(current.file, old.file)
 await client.send({ operation: 'remove', path, ...old })
 assert.equal(readFileSync(path, 'utf8'), 'replacement π😀')
 await client.send({ operation: 'remove', path, ...current })
 assert.equal(existsSync(path), false)
 assert.equal((await client.send({ operation: 'read', path })).absent, true)
 await publish(client, path, '')
 assert.equal((await client.send({ operation: 'read', path, maximum: 0 })).base64, '')
 assert.deepEqual(readdirSync(parent), ['data.json'])
})
test('unsafe directories and existing broad ACLs are rejected without repair or content changes', host, async () => {
 const client = probe(), parent = await directory(client, 'broad')
 const path = join(parent, 'private.txt'); await publish(client, path, 'preserved')
 broaden(path)
 const fileAcl = acl(path)
 rejected(await client.send({ operation: 'read', path }))
 rejected(await client.send({ operation: 'lock', path }))
 rejected(await client.send({ operation: 'publish', path, base64: '' }))
 assert.deepEqual(acl(path), fileAcl); assert.equal(readFileSync(path, 'utf8'), 'preserved')
 const other = await directory(client, 'broad-directory'); broaden(other)
 const directoryAcl = acl(other)
 rejected(await client.send({ operation: 'directory', path: other }))
 rejected(await client.send({ operation: 'publish', path: join(other, 'never-created'), base64: '' }))
 assert.deepEqual(acl(other), directoryAcl); assert.deepEqual(readdirSync(other), [])
 rejected(await client.send({ operation: 'directory', path }))
})
test('project writers preserve native-created sidecar ownership; default foreign owners remain rejected', host, async () => {
 const client = probe(), parent = await directory(client, 'worker-file')
 const path = join(parent, 'response.json')
 writeFileSync(path, '{"worker":true}')
 const security = acl(path)
 const result = await client.send({ operation: 'read', path })
 evidence.push({ operation: 'project-file-owner', security })
 // A process token's default owner can be a group even inside a user-owned
 // directory. Preserve strict owner checks; native precreation is the contract.
 if (security.currentOwner) {assert.equal(result.ok, true)}
 else {rejected(result); assert.equal(result.code, 5)}
 const prepared = join(parent, 'prepared-response.json')
 await publish(client, prepared, '')
 writeFileSync(prepared, '{"worker":true}')
 assert.deepEqual(acl(prepared), { currentOwner: true, protected: true, rules: 1, onlyCurrentUser: true })
 const valid = await client.send({ operation: 'read', path: prepared })
 assert.equal(valid.ok, true, JSON.stringify(valid))
 assert.equal(Buffer.from(valid.base64, 'base64').toString(), '{"worker":true}')
})
test('hardlinks and junctions cannot redirect private reads, creation, removal or locks', host, async () => {
 const client = probe(), parent = await directory(client, 'links'), target = await directory(client, 'target')
 const path = join(parent, 'source.txt'), linked = join(parent, 'hardlink.txt')
 const owned = await publish(client, path, 'untouched')
 linkSync(path, linked)
 rejected(await client.send({ operation: 'read', path }))
 rejected(await client.send({ operation: 'lock', path }))
 rejected(await client.send({ operation: 'publish', path, base64: '' }))
 await client.send({ operation: 'remove', path, ...owned })
 assert.equal(readFileSync(linked, 'utf8'), 'untouched'); assert.equal(existsSync(path), true)
 unlinkSync(linked)
 assert.equal((await client.send({ operation: 'read', path })).ok, true)
 const junction = join(parent, 'junction'); symlinkSync(target, junction, 'junction')
 rejected(await client.send({ operation: 'directory', path: junction }))
 rejected(await client.send({ operation: 'directory', path: join(junction, 'never-created', 'nested') }))
 rejected(await client.send({ operation: 'publish', path: join(junction, 'file'), base64: '' }))
 rejected(await client.send({ operation: 'read', path: join(junction, 'file') }))
 assert.deepEqual(readdirSync(target), [])
})
test('NUL, ADS, device aliases and ambiguous path components fail before storage writes', host, async () => {
 const client = probe(), parent = await directory(client, 'invalid'), path = join(parent, 'file.txt')
 await publish(client, path, 'safe')
 for (const invalid of [path+'\0suffix',path+':stream',path+'.',path+' ',join(parent,'NUL.txt'),join(parent,'COM1'),join(parent,'..','invalid')+'\\.\\other', 'relative-native-file']) {
  rejected(await client.send({ operation: 'publish', path: invalid, base64: Buffer.from('bad').toString('base64') }))
 }
 assert.equal(readFileSync(path, 'utf8'), 'safe')
 assert.deepEqual(readdirSync(parent), ['file.txt'])
})
test('lifetime locks contend without blocking and pin file plus ancestor identities until release', host, async () => {
 const owner = probe(), other = probe(), parent = await directory(owner, 'lock'), path = join(parent, 'host.lock')
 await publish(owner, path, 'keep-lock-bytes')
 const identity = statSync(path, { bigint: true }).ino
 assert.equal((await owner.send({ operation: 'lock', path })).acquired, true)
 const at = performance.now()
 assert.equal((await other.send({ operation: 'lock', path })).acquired, false)
 assert.ok(performance.now()-at < 2000)
 rejected(await other.send({ operation: 'publish', path, base64: Buffer.from('replace locked identity').toString('base64') }))
 assert.throws(() => renameSync(path, path+'.moved'))
 assert.throws(() => renameSync(parent, parent+'.moved'))
 await owner.send({ operation: 'unlock' })
 assert.equal((await other.send({ operation: 'lock', path })).acquired, true)
 await other.send({ operation: 'unlock' })
 assert.equal(statSync(path, { bigint: true }).ino, identity)
 assert.equal(readFileSync(path, 'utf8'), 'keep-lock-bytes')
 assert.deepEqual(readdirSync(parent), ['host.lock'])
})
test('abrupt owner death releases lifetime locks without deleting or changing the lock file', host, async () => {
 const owner = probe(), other = probe(), parent = await directory(owner, 'owner-death'), path = join(parent, 'host.lock')
 assert.equal((await owner.send({ operation: 'lock', path })).acquired, true)
 const identity = statSync(path, { bigint: true }).ino
 await owner.close(true)
 assert.equal((await other.send({ operation: 'lock', path })).acquired, true)
 await other.send({ operation: 'unlock' })
 assert.equal(statSync(path, { bigint: true }).ino, identity)
 renameSync(parent, parent+'.moved'); renameSync(parent+'.moved', parent)
})
test('an open reader retains the previous bytes while new opens see the atomic replacement', host, async () => {
 const client = probe(), parent = await directory(client, 'open-reader'), path = join(parent, 'host.json')
 await publish(client, path, 'previous π😀')
 const reader = openSync(path, 'r')
 try {
  await publish(client, path, 'replacement π😀')
  assert.equal(readFileSync(reader, 'utf8'), 'previous π😀')
  assert.equal(readFileSync(path, 'utf8'), 'replacement π😀')
 } finally {closeSync(reader)}
})
test('concurrent readers see complete atomic publications and no leaked temporary files', host, async () => {
 const client = probe(), parent = await directory(client, 'atomic'), path = join(parent, 'host.json')
 await publish(client, path, JSON.stringify({ revision: 0, text: 'π😀'.repeat(2048) }))
 let reads = 0, readerError
 const timer = setInterval(() => {
  try {const value = JSON.parse(readFileSync(path, 'utf8')); assert.equal(value.text, 'π😀'.repeat(2048)); reads++}
  catch (error) {readerError ??= error}
 }, 1)
 try {
  for (let revision = 1; revision <= 30; revision++) {await publish(client, path, JSON.stringify({ revision, text: 'π😀'.repeat(2048) }))}
 } finally {clearInterval(timer)}
 if (readerError) {throw readerError}
 assert.ok(reads > 0); assert.equal(JSON.parse(readFileSync(path, 'utf8')).revision, 30)
 assert.deepEqual(readdirSync(parent), ['host.json'])
})
