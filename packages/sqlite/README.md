# `@octane-xplat/sqlite`

```sh
pnpm add @octane-xplat/sqlite
```

Cross-target SQLite persistence for Octane xplat apps:
`@nativescript-community/sqlite` on iOS/Android, a `sqlite-wasm` worker
with OPFS persistence on web, system `libsqlite3` via C-function interop
on the macOS AppKit host, and an explicit `supported: false` on Windows.

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

const db = await openDatabase('trips.db') // { threading?: boolean } option, native only
await db.execute('CREATE TABLE IF NOT EXISTS items(name TEXT)')
await db.execute('INSERT INTO items VALUES (?)', ['Passport'])
const rows = await db.selectArray('SELECT name FROM items')
await db.close()
```

The `SqliteDb` surface: `execute`, `selectArray`, `getArray`, `each`
(row callback), `getUserVersion`/`setUserVersion` for migrations, `close`.
Params are `null | number | bigint | string | ArrayBuffer | Uint8Array`.
`db.isOpen` reports liveness; `db.persistent` reports whether storage
survives reloads — web only persists through OPFS, which needs a Worker
and on some browsers cross-origin isolation, so check the flag before
treating web data as durable. `deleteDatabase` removes a named database.
Branch on `supported` where a target has no backend.

```ts
import { deleteDatabase } from '@octane-xplat/sqlite'

if (supported) {
	const database = await openDatabase('preview.db')
	try {
		console.log(database.isOpen, database.persistent)
		await database.execute('CREATE TABLE IF NOT EXISTS items(name TEXT)')
		const first = await database.getArray('SELECT name FROM items LIMIT 1')
		await database.each(
			'SELECT name FROM items',
			[],
			(error, row) => {
				if (!error) console.log(row.name)
			},
			(error, count) => {
				if (!error) console.log(count)
			},
		)
		if ((await database.getUserVersion()) === 0) await database.setUserVersion(1)
	} finally {
		await database.close()
	}
	await deleteDatabase('preview.db') // This example database is disposable.
}
```

Design notes: [`docs/notes/sqlite-notes.md`](../../docs/notes/sqlite-notes.md);
limits: [known limits](../../docs/verify/known-limits.md). Exercised by the
harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
