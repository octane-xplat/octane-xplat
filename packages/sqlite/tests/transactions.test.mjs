import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import ts from 'typescript'
import initSqlite from '@sqlite.org/sqlite-wasm'

function load(file, dependencies = {}, globals = {}) {
	const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
	const code = ts.transpile(source.replaceAll('import.meta.url', JSON.stringify(import.meta.url)), {
		module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
	})
	const exports = {}
	new Function('require', 'exports', ...Object.keys(globals), code)((id) => {
		assert.ok(id in dependencies, `Unmapped dependency ${id}`)
		return dependencies[id]
	}, exports, ...Object.values(globals))
	return exports
}
const ownership = load('operation-queue.ts')
const sqlite3 = await initSqlite()
class WorkerHarness {
	constructor() {
		const self = { postMessage: (data) => queueMicrotask(() => this.onmessage({ data: structuredClone(data) })) }
		load('worker.web.ts', {
			'@sqlite.org/sqlite-wasm': { default: () => Promise.resolve(sqlite3) },
			'@sqlite.org/sqlite-wasm/sqlite3.wasm?url': { default: 'unused' },
		}, { self, navigator: { storage: { getDirectory: async () => { throw new Error('no OPFS') } } } })
		this.self = self
	}
	postMessage(data) { queueMicrotask(() => this.self.onmessage({ data: structuredClone(data) })) }
	terminate() {}
}
const web = load('db.web.ts', { './operation-queue': ownership }, { Worker: WorkerHarness })

// Real SQL behind the mobile plugin interface; this exercises the production
// adapter and shared ownership boundary, not a NativeScript runtime.
function nativeBackend() {
	const db = new DatabaseSync(':memory:')
	const params = (p) => p == null ? [] : Array.isArray(p) ? p : [p]
	const api = {
		isOpen: true,
		execute: async (sql, p) => { db.prepare(sql).run(...params(p)) },
		select: async (sql, p) => db.prepare(sql).all(...params(p)).map((r) => ({ ...r })),
		selectArray: async (sql, p) => db.prepare(sql).all(...params(p)).map(Object.values),
		transaction: async (action) => {
			db.exec('BEGIN')
			try { const result = await action(); db.exec('COMMIT'); return result }
			catch (error) { db.exec('ROLLBACK'); throw error }
		},
		each: async (sql, p, row, done) => {
			const rows = await api.select(sql, p)
			for (const value of rows) {row(null, value)}
			done(null, rows.length)
			return rows.length
		},
		getVersion: () => db.prepare('PRAGMA user_version').get().user_version,
		setVersion: (version) => db.exec(`PRAGMA user_version = ${version}`),
		close: () => { api.isOpen = false; db.close() },
	}
	return api
}
const native = load('db.ts', {
	'./operation-queue': ownership,
	'@nativescript/core': { knownFolders: { documents: () => ({ getFile: (name) => ({ path: name }) }) } },
	'@nativescript-community/sqlite': { openOrCreate: nativeBackend },
})

// AppKit's C bridge is modeled with node:sqlite. This checks adapter wiring;
// actual C interop and device behavior remain separate platform qualification.
const host = {
	interop: { Reference: class {}, Pointer: class {}, stringFromCString: (value) => value },
	dlopen() {},
	sqlite3_open: (_, out) => { out.value = new DatabaseSync(':memory:'); return 0 },
	sqlite3_busy_timeout() {},
	sqlite3_prepare_v2(db, sql, _n, out) {
		try { out.value = { stmt: db.prepare(sql), params: [] }; return 0 } catch { return 1 }
	},
	sqlite3_bind_null: (s, i) => { s.params[i - 1] = null },
	sqlite3_bind_text: (s, i, v) => { s.params[i - 1] = v },
	sqlite3_bind_int64: (s, i, v) => { s.params[i - 1] = v },
	sqlite3_bind_double: (s, i, v) => { s.params[i - 1] = v },
	sqlite3_column_count: (s) => s.stmt.columns().length,
	sqlite3_step(s) {
		if (!s.stmt.columns().length) { s.stmt.run(...s.params); return 101 }
		s.iterator ??= s.stmt.iterate(...s.params)
		const next = s.iterator.next()
		s.row = next.value
		return next.done ? 101 : 100
	},
	sqlite3_column_name: (s, i) => s.stmt.columns()[i].name,
	sqlite3_column_type: (s, i) => {
		const v = Object.values(s.row)[i]
		return v == null ? 5 : typeof v === 'string' ? 3 : Number.isInteger(v) ? 1 : 2
	},
	sqlite3_column_int64: (s, i) => Object.values(s.row)[i],
	sqlite3_column_double: (s, i) => Object.values(s.row)[i],
	sqlite3_column_text: (s, i) => Object.values(s.row)[i],
	sqlite3_finalize: (s) => s.iterator?.return(),
	sqlite3_errmsg: () => 'SQL failure',
	sqlite3_close_v2: (db) => db.close(),
}
const macos = load('db.macos.ts', { './operation-queue': ownership }, { globalThis: host })
const deferred = () => {
	let resolve
	const promise = new Promise((res) => { resolve = res })
	return { promise, resolve }
}

for (const [name, api] of [['web worker / WASM', web], ['native adapter / node SQL', native], ['AppKit adapter / modeled bridge', macos]]) {
	let sequence = 0
	async function fixture(body) {
		const db = await api.openDatabase(`transaction-test-${++sequence}.db`)
		try { await db.execute('CREATE TABLE records(name TEXT)'); await body(db) }
		finally { await db.close() }
	}
	test(`${name}: rollback preserves unrelated queued writes`, () => fixture(async (db) => {
		const entered = deferred(), finish = deferred()
		const transaction = db.transaction(async (tx) => {
			await tx.execute('INSERT INTO records VALUES (?)', ['rolled-back'])
			entered.resolve()
			await finish.promise
			throw new Error('intended rollback')
		})
		const rejected = assert.rejects(transaction, /intended rollback/)
		await entered.promise
		let outsideFinished = false
		const outside = db.execute('INSERT INTO records VALUES (?)', ['outside']).then(() => { outsideFinished = true })
		await Promise.resolve()
		assert.equal(outsideFinished, false)
		finish.resolve()
		await rejected
		await outside
		assert.deepEqual(await db.select('SELECT * FROM records'), [{ name: 'outside' }])
	}))

	test(`${name}: overlapping transactions serialize and release ownership after failures`, () => fixture(async (db) => {
		const entered = deferred(), finish = deferred()
		const first = db.transaction(async (tx) => {
			await tx.execute('INSERT INTO records VALUES (?)', ['first'])
			entered.resolve()
			await finish.promise
			return 'committed'
		})
		await entered.promise
		let secondStarted = false
		const second = db.transaction(async (tx) => { secondStarted = true; await tx.execute('INSERT INTO records VALUES (?)', ['second']) })
		await Promise.resolve()
		assert.equal(secondStarted, false)
		finish.resolve()
		assert.equal(await first, 'committed')
		await second
		await assert.rejects(db.transaction(async (tx) => tx.execute('INVALID SQL')))
		await db.execute('INSERT INTO records VALUES (?)', ['after-error'])
		assert.deepEqual(await db.selectArray('SELECT name FROM records'), [['first'], ['second'], ['after-error']])
	}))

	test(`${name}: scoped handles expose all reads and migrations, reject nesting and expire`, () => fixture(async (db) => {
		let escaped
		await db.transaction(async (tx) => {
			escaped = tx
			assert.equal(tx.isOpen, true)
			await tx.execute('INSERT INTO records VALUES (?)', ['inside'])
			await tx.setUserVersion(7)
			assert.equal(await tx.getUserVersion(), 7)
			assert.deepEqual(await tx.get('SELECT * FROM records'), { name: 'inside' })
			assert.deepEqual(await tx.getArray('SELECT * FROM records'), ['inside'])
			const seen = []
			assert.equal(await tx.each('SELECT * FROM records', [], (_error, row) => seen.push(row.name), (_error, count) => assert.equal(count, 1)), 1)
			assert.deepEqual(seen, ['inside'])
			await assert.rejects(tx.transaction(async () => {}), /nested/)
			await assert.rejects(tx.close(), /transaction handle/)
		})
		assert.equal(escaped.isOpen, false)
		await assert.rejects(escaped.execute('INSERT INTO records VALUES (?)', ['late']), /expired/)
		assert.deepEqual(await db.selectArray('SELECT name FROM records'), [['inside']])
	}))

	test(`${name}: close waits outside the transaction`, async () => {
		const db = await api.openDatabase(':memory:')
		const entered = deferred(), finish = deferred()
		const transaction = db.transaction(async () => { entered.resolve(); await finish.promise })
		await entered.promise
		const closing = db.close()
		assert.equal(db.isOpen, true)
		finish.resolve()
		await transaction
		await closing
		assert.equal(db.isOpen, false)
	})
}
