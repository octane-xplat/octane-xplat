# `@octane-xplat/sqlite`

Store structured records in a local SQLite database. Use it when settings
strings are no longer enough: you need queries, transactions or schema
migrations. Mobile uses the NativeScript SQLite plugin; browsers use a
SQLite Wasm Worker with OPFS persistence where available. AppKit has an
experimental system-SQLite adapter; Windows is unsupported.

```sh
pnpm add @octane-xplat/sqlite
```

In an app-owned async action, open a connection, check its durability, then close
it when its owner is finished:

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

if (supported) {
	const db = await openDatabase('trips.db')
	try {
		if (!db.persistent) throw new Error('Durable storage is unavailable.')
		await db.execute('CREATE TABLE IF NOT EXISTS items(name TEXT)')
		await db.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
		const rows = await db.select<{ name: string }>('SELECT name FROM items')
		console.log(rows.length)
	} finally { await db.close() }
}
```

Follow [Save settings and structured data](../../docs/app/local-storage.md) for
the maintained packing list, reactive screen, migrations, rollback, close/reopen,
intentional deletion and failure recovery, including transaction ownership.
Browser transient storage is not a durable record of truth. Android's worker
transaction path still needs device qualification; see the
[SQLite evidence record](../../.agents/docs/notes/sqlite-notes.md#android-transaction-threading-gate-2026-10-22).
Persistence alone provides neither remote synchronization nor encryption.
