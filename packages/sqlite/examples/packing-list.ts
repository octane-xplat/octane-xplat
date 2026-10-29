import { openDatabase, supported, type SqliteDb } from '@octane-xplat/sqlite'

export type PackingItem = { id: number; label: string; packed: number }

/** App-owned schema; a failed migration leaves the old schema/version intact. */
export async function migratePackingList(db: SqliteDb) {
	await db.transaction(async (tx) => {
		let version = await tx.getUserVersion()
		if (version > 2) {
			throw new Error('This database needs a newer app version.')
		}
		if (version < 1) {
			await tx.execute('CREATE TABLE packing_items (id INTEGER PRIMARY KEY, label TEXT NOT NULL)')
			await tx.setUserVersion(1)
			version = 1
		}
		if (version < 2) {
			await tx.execute('ALTER TABLE packing_items ADD COLUMN packed INTEGER NOT NULL DEFAULT 0')
			await tx.setUserVersion(2)
		}
	})
}

export async function openPackingList(name = 'packing.db', allowTransient = false) {
	if (!supported) {
		throw new Error('Local database storage is unavailable on this target.')
	}
	const db = await openDatabase(name)
	try {
		if (!db.persistent && !allowTransient) {
			throw new Error(
				'Durable storage is unavailable. Changes would be lost when this session ends.',
			)
		}
		await migratePackingList(db)
	} catch (error) {
		await db.close()
		throw error
	}
	function label(value: string) {
		const result = value.trim()
		if (!result) {
			throw new Error('Enter an item name.')
		}
		return result
	}
	return {
		persistent: db.persistent,
		list: () => db.select<PackingItem>('SELECT id, label, packed FROM packing_items ORDER BY id'),
		add: (value: string) =>
			db.execute('INSERT INTO packing_items(label) VALUES (?)', [label(value)]),
		rename: (id: number, value: string) =>
			db.execute('UPDATE packing_items SET label = ? WHERE id = ?', [label(value), id]),
		setPacked: (id: number, packed: boolean) =>
			db.execute('UPDATE packing_items SET packed = ? WHERE id = ?', [packed ? 1 : 0, id]),
		remove: (id: number) => db.execute('DELETE FROM packing_items WHERE id = ?', [id]),
		close: () => db.close(),
	}
}

export type PackingList = Awaited<ReturnType<typeof openPackingList>>
