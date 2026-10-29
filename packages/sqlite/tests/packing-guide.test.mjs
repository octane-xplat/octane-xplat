import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import ts from 'typescript'

function load(path, dependencies) {
	const exports = {}
	const code = ts.transpile(readFileSync(new URL(path, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})
	new Function('require', 'exports', code)((id) => {
		assert.ok(id in dependencies, id)
		return dependencies[id]
	}, exports)
	return exports
}
const { isolateDatabase } = load('../src/operation-queue.ts', {})
function backend(path, persistent = true) {
	const sql = new DatabaseSync(path)
	let open = true
	const params = (values) => (values == null ? [] : Array.isArray(values) ? values : [values])
	const db = {
		get isOpen() {
			return open
		},
		persistent,
		execute: async (query, values) => {
			sql.prepare(query).run(...params(values))
		},
		select: async (query, values) =>
			sql
				.prepare(query)
				.all(...params(values))
				.map((row) => ({ ...row })),
		getUserVersion: async () => sql.prepare('PRAGMA user_version').get().user_version,
		setUserVersion: async (version) => {
			sql.exec(`PRAGMA user_version=${version}`)
		},
		transaction: async (action) => {
			sql.exec('BEGIN')
			try {
				const result = await action(db)
				sql.exec('COMMIT')
				return result
			} catch (error) {
				sql.exec('ROLLBACK')
				throw error
			}
		},
		close: async () => {
			sql.close()
			open = false
		},
	}
	return isolateDatabase(db)
}
function guide(openDatabase, supported = true) {
	return load('../examples/packing-list.ts', {
		'@octane-xplat/sqlite': { openDatabase, supported },
	})
}

test('packing list: real file CRUD survives close/reopen and parameterized labels', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'packing-guide-'))
	const api = guide((name) => Promise.resolve(backend(join(dir, name))))
	let list
	try {
		list = await api.openPackingList()
		await list.add("Passport'); DROP TABLE packing_items;--")
		const [item] = await list.list()
		await list.rename(item.id, 'Charger')
		await list.setPacked(item.id, true)
		await list.close()
		list = await api.openPackingList()
		assert.deepEqual(await list.list(), [{ id: item.id, label: 'Charger', packed: 1 }])
		await list.remove(item.id)
		assert.deepEqual(await list.list(), [])
		await assert.rejects(async () => list.add('   '), /Enter an item name/)
	} finally {
		if (list) {
			await list.close()
		}
		rmSync(dir, { recursive: true, force: true })
	}
})
test('packing migration upgrades a v1 file while retaining existing records', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'packing-migration-'))
	const path = join(dir, 'packing.db')
	const sql = new DatabaseSync(path)
	sql.exec(
		"CREATE TABLE packing_items (id INTEGER PRIMARY KEY, label TEXT NOT NULL); INSERT INTO packing_items(label) VALUES ('Passport'); PRAGMA user_version=1",
	)
	sql.close()
	const list = await guide(() => Promise.resolve(backend(path))).openPackingList()
	try {
		assert.deepEqual(await list.list(), [{ id: 1, label: 'Passport', packed: 0 }])
	} finally {
		await list.close()
		rmSync(dir, { recursive: true, force: true })
	}
})
test('failed migration rolls back both schema and version', async () => {
	const db = backend(':memory:')
	await db.execute(
		'CREATE TABLE packing_items (id INTEGER PRIMARY KEY, label TEXT NOT NULL, packed INTEGER)',
	)
	await db.setUserVersion(1)
	try {
		await assert.rejects(guide().migratePackingList(db), /duplicate column/)
		assert.equal(await db.getUserVersion(), 1)
		await db.execute("INSERT INTO packing_items(label) VALUES ('Still usable')")
	} finally {
		await db.close()
	}
})
test('future schema is rejected without deleting data', async () => {
	const db = backend(':memory:')
	await db.setUserVersion(3)
	try {
		await assert.rejects(guide().migratePackingList(db), /newer app/)
		assert.equal(await db.getUserVersion(), 3)
	} finally {
		await db.close()
	}
})
test('transient storage is refused and closed; explicit preview can opt in', async () => {
	const db = backend(':memory:', false)
	await assert.rejects(guide(() => Promise.resolve(db)).openPackingList(), /Durable storage/)
	assert.equal(db.isOpen, false)
	const list = await guide(() => Promise.resolve(backend(':memory:', false))).openPackingList(
		'preview.db',
		true,
	)
	try {
		assert.equal(list.persistent, false)
		await list.add('Session only')
		assert.equal((await list.list()).length, 1)
	} finally {
		await list.close()
	}
})
test('unsupported target rejects before attempting a database open', async () => {
	await assert.rejects(
		guide(() => {
			throw new Error('must not open')
		}, false).openPackingList(),
		/unavailable on this target/,
	)
})
