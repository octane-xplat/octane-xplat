import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { performance } from 'node:perf_hooks'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/sqlite-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function fixture() { const path = mkdtempSync(join(tmpdir(), 'xplat-nim-sqlite-')); fixtures.push(path); return path }
function native(cases) {
 const result = spawnSync(binary, [], { input: cases.map(value => JSON.stringify(value)).join('\n') + '\n',
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 10000, env: { ...process.env, PATH: '' } })
 assert.equal(result.status, 0, result.stderr || result.error?.message || 'native probe failed')
 assert.equal(result.stderr, '')
 const values = result.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(values.length, cases.length)
 return values
}
function reference(request) {
 let db
 try {
  db = new DatabaseSync(request.path ?? ':memory:')
  const statements = new Map(), values = []
  for (const action of request.actions) {
   try {
    let value = null
    const parameters = action.parameters ?? []
    switch (action.operation) {
    case 'version': value = db.prepare('SELECT sqlite_version() AS version').get().version; break
    case 'exec': db.exec(action.sql); break
    case 'query': value = db.prepare(action.sql).all(...parameters); break
    case 'prepare': statements.set(action.name, db.prepare(action.sql)); break
    case 'all': value = statements.get(action.name).all(...parameters); break
    case 'first': value = statements.get(action.name).get(...parameters) ?? null; break
    case 'run': statements.get(action.name).run(...parameters); break
    default: throw Error(action.operation)
    }
    values.push({ ok: true, value })
   } catch (error) { values.push({ ok: false, message: error.message }) }
  }
  return { ok: true, value: values }
 } catch (error) { return { ok: false, message: error.message } }
 finally { db?.close() }
}
function compare(cases, label) {
 const actual = native(cases)
 for (const [at, request] of cases.entries()) assert.deepEqual(actual[at], JSON.parse(JSON.stringify(reference(request))), `${label} ${at}`)
 return actual
}
const macOnly = { skip: process.platform === 'darwin' ? false : 'system SQLite delivery is qualified only on macOS' }

test('SQLite parameters and columns preserve text bytes, NULs, lone units, null and Number storage', macOnly, () => {
 const values = ['', 'ascii', 'quotes " \\ /', 'a\0b', '\0', '😀 café 中', 'e\u0301', '\ud800', '\udc00',
  '\ud800\udc00', '\ufeffweb', 0, -0, 1, -1, 1.5, 2147483648, -2147483649, 9007199254740991, -9007199254740991,
  1e308, 1e-300, null]
 const [diagnostic] = native([{ actions: [{ operation: 'version' }] }])
 assert.equal(diagnostic.ok, true)
 assert.match(diagnostic.value[0].value, /^\d+\.\d+\.\d+$/)
 const node = new DatabaseSync(':memory:')
 const nodeVersion = node.prepare('SELECT sqlite_version() AS version').get().version
 node.close()
 console.log(`Actual SQLite engines: system ${diagnostic.value[0].value}; Node ${nodeVersion}; Node metadata ${process.versions.sqlite}`)
 const request = { actions: [
  ...values.map(value => ({ operation: 'query', sql: 'SELECT ? AS value, hex(?) AS bytes, typeof(?) AS type', parameters: [value, value, value] })),
  ...['FF80', 'EDA080', 'E180'].map(bytes => ({ operation: 'query', sql: `SELECT CAST(X'${bytes}' AS TEXT) AS value` })),
  { operation: 'query', sql: 'SELECT 9007199254740992 AS n' },
  { operation: 'query', sql: 'SELECT -9007199254740992 AS n' },
  { operation: 'query', sql: 'SELECT 9223372036854775807 AS n' },
 ] }
 const [actual] = compare([request], 'parameters')
 assert.ok(actual.value.slice(0, values.length).every(result => result.ok))
 assert.equal(actual.value[values.indexOf('a\0b')].value[0].bytes, '610062')
 assert.ok(actual.value.slice(-3).every(result => !result.ok && result.message.includes('too large')))
})

test('reusable statements reset bindings, preserve SQL errors and recover after rollback', macOnly, () => {
 const [actual] = compare([{ actions: [
  { operation: 'exec', sql: 'CREATE TABLE items (id TEXT PRIMARY KEY, value TEXT)' },
  { operation: 'prepare', name: 'insert', sql: 'INSERT INTO items VALUES (?,?)' },
  { operation: 'run', name: 'insert', parameters: ['a', 'first'] },
  { operation: 'run', name: 'insert', parameters: ['a', 'duplicate'] },
  { operation: 'exec', sql: 'BEGIN IMMEDIATE' },
  { operation: 'run', name: 'insert', parameters: ['b', 'rolled back'] },
  { operation: 'exec', sql: 'ROLLBACK' },
  { operation: 'run', name: 'insert', parameters: ['c', 'committed'] },
  { operation: 'prepare', name: 'read', sql: 'SELECT * FROM items WHERE id=?' },
  { operation: 'first', name: 'read', parameters: ['missing'] },
  { operation: 'first', name: 'read', parameters: ['a'] },
  { operation: 'first', name: 'read', parameters: ['c'] },
  { operation: 'query', sql: 'SELECT * FROM items ORDER BY id' },
  { operation: 'prepare', name: 'bindings', sql: 'SELECT ? AS a, ? AS b' },
  { operation: 'all', name: 'bindings', parameters: ['one', 'two'] },
  { operation: 'all', name: 'bindings', parameters: ['fresh'] },
  { operation: 'all', name: 'bindings', parameters: [] },
  { operation: 'exec', sql: 'SELECT missing FROM no_table' },
 ] }], 'statements')
 assert.equal(actual.value[3].ok, false)
 assert.deepEqual(actual.value[12].value, [{ id: 'a', value: 'first' }, { id: 'c', value: 'committed' }])
})

const schema = `PRAGMA busy_timeout=10000;
CREATE TABLE snapshots (id TEXT PRIMARY KEY);
CREATE TABLE chunks (snapshot TEXT, key TEXT, data TEXT, PRIMARY KEY(snapshot,key));
CREATE VIRTUAL TABLE fulltext USING fts5(snapshot UNINDEXED, key UNINDEXED, text);
CREATE TABLE embeddings (model TEXT, hash TEXT, vector TEXT, PRIMARY KEY(model,hash));`
const documents = [
 ['snapshot-a', 'a', 'CameraView camera capture on macos; photograph scene'],
 ['snapshot-a', 'b', 'Camera capture web; CameraView CameraView'],
 ['snapshot-a', 'c', 'navigation RouteOutlet маршруты 中文 café'],
 ['snapshot-b', 'd', 'CameraView camera capture on ios'],
 ['snapshot-a', 'e', 'camera camera camera camera'],
]
test('FTS5 rankings, snapshot isolation, phrases and errors match node:sqlite', macOnly, () => {
 const queries = ['"CameraView"', '"camera" OR "capture"', '"camera capture"', '"café"', '"中文"', '"маршруты"', 'absent', '"unterminated']
 const [actual] = compare([{ actions: [
  { operation: 'exec', sql: schema },
  { operation: 'prepare', name: 'insert', sql: 'INSERT INTO fulltext VALUES (?,?,?)' },
  ...documents.map(parameters => ({ operation: 'run', name: 'insert', parameters })),
  ...queries.map(query => ({ operation: 'query', sql: 'SELECT key, bm25(fulltext) AS score FROM fulltext WHERE fulltext MATCH ? AND snapshot=? ORDER BY bm25(fulltext) LIMIT ?', parameters: [query, 'snapshot-a', 50] })),
 ] }], 'fts5')
 assert.ok(actual.value[2 + documents.length].value.length > 0)
 assert.ok(!actual.value[2 + documents.length].value.some(row => row.key === 'd'))
 assert.equal(actual.value.at(-1).ok, false)
})

test('native and Node connections exchange the same on-disk cache schema and committed rows', macOnly, () => {
 const path = join(fixture(), 'shared.sqlite')
 const node = new DatabaseSync(path)
 node.exec(schema)
 const insert = node.prepare('INSERT INTO fulltext VALUES (?,?,?)')
 for (const row of documents) insert.run(...row)
 node.prepare('INSERT INTO embeddings VALUES (?,?,?)').run('fixture-model', 'hash', '[0.6,0.8]')
 node.close()
 const actions = [
  { operation: 'query', sql: 'SELECT key FROM fulltext WHERE fulltext MATCH ? AND snapshot=? ORDER BY bm25(fulltext)', parameters: ['"camera"', 'snapshot-a'] },
  { operation: 'query', sql: 'SELECT * FROM embeddings' },
  { operation: 'exec', sql: 'BEGIN IMMEDIATE' },
  { operation: 'query', sql: 'SELECT count(*) AS count FROM fulltext' },
  { operation: 'exec', sql: "INSERT INTO snapshots VALUES ('native')" },
  { operation: 'exec', sql: 'COMMIT' },
 ]
 const expected = reference({ path, actions: actions.slice(0, 4) })
 const [actual] = native([{ path, actions }])
 assert.deepEqual(actual.value.slice(0, 4), JSON.parse(JSON.stringify(expected.value)))
 assert.ok(actual.value.every(result => result.ok))
 const read = new DatabaseSync(path)
 assert.deepEqual({ ...read.prepare('SELECT * FROM snapshots').get() }, { id: 'native' })
 read.close()
})

test('write contention honors a bounded busy timeout and releases the lock after close', macOnly, () => {
 const path = join(fixture(), 'locked.sqlite')
 const owner = new DatabaseSync(path)
 owner.exec('CREATE TABLE items (value TEXT); BEGIN IMMEDIATE')
 const contender = new DatabaseSync(path)
 contender.exec('PRAGMA busy_timeout=35')
 let expected
 try { contender.exec("INSERT INTO items VALUES ('native')") } catch (error) { expected = error.message }
 contender.close()
 const actions = [{ operation: 'exec', sql: 'PRAGMA busy_timeout=35' }, { operation: 'exec', sql: "INSERT INTO items VALUES ('native')" }]
 const started = performance.now()
 const [blocked] = native([{ path, actions }])
 const elapsed = performance.now() - started
 assert.equal(blocked.value[1].ok, false)
 assert.equal(blocked.value[1].message, expected)
 assert.ok(elapsed >= 20 && elapsed < 2000, String(elapsed))
 owner.exec('ROLLBACK'); owner.close()
 const [released] = native([{ path, actions }])
 assert.ok(released.value.every(result => result.ok))
})

test('an outstanding statement keeps its library and connection valid until finalized', macOnly, () => {
 const [actual] = native([{ actions: [
  { operation: 'prepare', name: 'active', sql: 'SELECT 1 AS n' }, { operation: 'close' },
  { operation: 'all', name: 'active' }, { operation: 'finalize', name: 'active' }, { operation: 'close' },
 ] }])
 assert.equal(actual.value[1].ok, false)
 assert.deepEqual(actual.value[2], { ok: true, value: [{ n: 1 }] })
 assert.equal(actual.value[4].ok, true)
})
