# Save settings and structured data locally

> Keep a packing list after the app closes, migrate its records safely, and show when storage cannot save them.

Start with a running app from [Getting started](../start/toolchain.md#create-and-run).
You will add an item, mark it packed, close the app, and find it again. The
example stores data on one device; remote synchronization, account isolation,
backups and conflict handling are separate app responsibilities.

## Choose the owner of the data

| Data | Use | Reason |
| --- | --- | --- |
| A selected bag or welcome flag | `storage` in `@octane-xplat/platform` | A few nonsecret strings |
| An app session credential | `@octane-xplat/secure-storage` | Secrets need the target's protected store |
| Packing items you edit and query | `@octane-xplat/sqlite` | Tables, parameterized queries and schema migrations |

Save ordinary settings in an action handler. The setters can throw (for example,
when browser storage is denied); `flush()` can return false on native. Only
show a successful durable save after both steps succeed:

```ts
import { storage } from '@octane-xplat/platform'

export function saveBag(name: string): string {
	try {
		storage.setString('selected-bag', name)
		if (!storage.flush()) return 'Could not confirm the save. Please retry.'
		return 'Bag saved on this device.'
	} catch {
		return 'Storage is unavailable. The bag was not confirmed saved.'
	}
}
export function readBag(): string {
	try { return storage.getString('selected-bag') ?? 'Carry-on' }
	catch { return 'Carry-on' }
}
```

A failed flush can leave the new value in memory; reading it immediately does
not prove it survived termination. Display the returned message in your screen.
Do not store tokens here. Follow [secure credential setup](../platform/platform-services.md#store-a-session-token)
and [session restoration and sign-out](authentication.md) for that separate
lifecycle; ordinary preferences are never a fallback for secrets.

## Open a saved packing list

Install the database package in your app:

```sh
pnpm add @octane-xplat/sqlite
```

Create `src/packing-list.ts` below. A **table** holds rows; each row has a stable
numeric `id`, a label, and a `packed` value (0 or 1). A **migration** updates the
stored shape when a newer app needs it. This example upgrades version 1 records
by adding `packed` with a default, preserving their labels.

The version check and changes run in one transaction: either they all commit
or a failure rolls them back. Use the callback's `tx` handle and await every
operation there; awaiting the outer `db` from inside the callback would wait
on itself. The callback handle expires when it returns. Parameter placeholders
(`?`) keep item text separate from SQL instructions.

```ts
import { openDatabase, supported, type SqliteDb } from '@octane-xplat/sqlite'

export type PackingItem = { id: number; label: string; packed: number }

/** App-owned schema; a failed migration leaves the old schema/version intact. */
export async function migratePackingList(db: SqliteDb) {
	await db.transaction(async (tx) => {
		let version = await tx.getUserVersion()
		if (version > 2) throw new Error('This database needs a newer app version.')
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
	if (!supported) throw new Error('Local database storage is unavailable on this target.')
	const db = await openDatabase(name)
	try {
		if (!db.persistent && !allowTransient) {
			throw new Error('Durable storage is unavailable. Changes would be lost when this session ends.')
		}
		await migratePackingList(db)
	} catch (error) {
		await db.close()
		throw error
	}
	function label(value: string) {
		const result = value.trim()
		if (!result) throw new Error('Enter an item name.')
		return result
	}
	return {
		persistent: db.persistent,
		list: () => db.select<PackingItem>('SELECT id, label, packed FROM packing_items ORDER BY id'),
		add: (value: string) => db.execute('INSERT INTO packing_items(label) VALUES (?)', [label(value)]),
		rename: (id: number, value: string) =>
			db.execute('UPDATE packing_items SET label = ? WHERE id = ?', [label(value), id]),
		setPacked: (id: number, packed: boolean) =>
			db.execute('UPDATE packing_items SET packed = ? WHERE id = ?', [packed ? 1 : 0, id]),
		remove: (id: number) => db.execute('DELETE FROM packing_items WHERE id = ?', [id]),
		close: () => db.close(),
	}
}

export type PackingList = Awaited<ReturnType<typeof openPackingList>>
```

The maintained [database example](../../packages/sqlite/examples/packing-list.ts)
is the source for this file. It refuses transient storage by default, closes a
failed opening, and rejects a database from a newer app rather than deleting it.
An SQL/type parameter describes the expected rows; it does not validate arbitrary
external data or encrypt the database. Keep credentials out of these tables.

## Show and change the records

Create `src/PackingScreen.tsx` below and render `<PackingScreen />` in the same
place you rendered your starter screen. The database does not send UI updates.
After each completed write, this screen reads the current rows and updates its
store. `useStore` subscribes this reader, including on native. Disable actions
while an operation is pending so repeated taps cannot submit the same edit.

```tsx
import { useEffect, useMemo, useState } from 'octane'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'
import {
	openPackingList,
	type PackingItem,
	type PackingList,
} from './packing-list'

export function PackingScreen() {
	const store = useMemo(
		() => createStore({ items: [] as PackingItem[], message: 'Opening packing list…', busy: true }),
		[],
	)
	const state = useStore(store)
	const owner = useMemo(() => ({ list: null as PackingList | null, active: true }), [])
	const [draft, setDraft] = useState('Passport')
	useEffect(() => {
		owner.active = true
		void (async () => {
			try {
				const list = await openPackingList()
				if (!owner.active) {
					await list.close()
					return
				}
				owner.list = list
				const items = await list.list()
				if (owner.active) {
					store.set({ items, busy: false, message: 'Packing list loaded.' })
				}
			} catch {
				if (owner.active) {
					store.update((s) => ({
						...s,
						busy: false,
						message: 'Could not open the saved list. Close and reopen this screen to retry.',
					}))
				}
			}
		})()
		return () => {
			owner.active = false
			const list = owner.list
			owner.list = null
			if (list) {
				void list.close().catch(() => console.error('Packing database close failed.'))
			}
		}
	}, [])
	async function change(action: (list: PackingList) => Promise<void>) {
		if (store.getSnapshot().busy || !owner.list) {
			return
		}
		store.update((s) => ({ ...s, busy: true }))
		try {
			await action(owner.list)
			const items = await owner.list.list()
			if (owner.active) {
				store.set({ items, busy: false, message: 'Saved on this device.' })
			}
		} catch {
			if (owner.active) {
				store.update((s) => ({
					...s,
					busy: false,
					message:
						'Save or reload failed. Reopen the list before retrying; the write may have completed.',
				}))
			}
		}
	}
	return (
		<VStack>
			<Text>Packing list</Text>
			<TextInput label="Item name" value={draft} onChange={setDraft} />
			<Button
				label="Add item"
				isDisabled={state.busy || !owner.list}
				clickAction={() => change((list) => list.add(draft))}
			/>
			<Text>{state.message}</Text>
			{state.items.map((item) => (
				<VStack>
					<Text>
						{item.label}: {item.packed ? 'packed' : 'not packed'}
					</Text>
					<Button
						label={item.packed ? 'Mark not packed' : 'Mark packed'}
						isDisabled={state.busy}
						clickAction={() => change((list) => list.setPacked(item.id, !item.packed))}
					/>
					<Button
						label="Rename using item name"
						isDisabled={state.busy}
						clickAction={() => change((list) => list.rename(item.id, draft))}
					/>
					<Button
						label="Remove item"
						isDisabled={state.busy}
						clickAction={() => change((list) => list.remove(item.id))}
					/>
				</VStack>
			))}
		</VStack>
	)
}
```

Try **Add item**, **Mark packed**, and **Rename using item name** after changing
the text field. **Remove item** deletes only that row. The screen reports success
after the write and read finish. If the read fails after a successful write,
it reports an uncertain outcome: reopen before retrying an add, which could
otherwise duplicate it. The maintained [screen](../../packages/demos/src/storage-guide/PackingScreen.tsx)
uses the same flow.

The screen owns its connection: leaving it closes the connection after queued
operations and prevents late results from updating the retired screen. Closing
is normal cleanup; deleting the database is not. For a large app, put one
connection owner above the screens that share it and close it when that owner
retires. Do not reuse a closed handle or share an account's connection into the
next account.

## Confirm that the data survives reopening

First test without the UI, from an app-owned async action. Close the first
connection before reopening the same name. This disposable check changes only
its own `packing-check.db`:

```ts
import { openPackingList } from './packing-list'

export async function checkReopen(): Promise<string> {
	const first = await openPackingList('packing-check.db')
	try { await first.add('Reopen check') }
	finally { await first.close() }
	const second = await openPackingList('packing-check.db')
	try {
		const found = (await second.list()).some((item) => item.label === 'Reopen check')
		if (!found) throw new Error('The saved item was not found after reopening.')
		return 'Item found after closing and reopening the database.'
	} finally { await second.close() }
}
```

Then add and pack an item in the screen, terminate the app or reload the page,
and reopen the screen. Confirm the label and packed value, not just a successful
open. Test a version 1 database with existing rows when shipping the version 2
migration, and test an intentional migration failure: its old version and data
must remain usable. The maintained Node tests exercise real SQLite files,
CRUD/reopen, a preserved version 1 row, rollback, future-version rejection,
transient refusal and unsupported targets. They do not qualify phone storage.

## Other query shapes

Use `select` for object rows and `selectArray` for positional rows; `get` and
`getArray` return only the first row or null. The generic type is your expected
row shape. `each` invokes callbacks for rows and completion; the web adapter
currently collects rows before invoking them, so do not assume streaming memory
usage. This fragment assumes an open `db` from the same package:

```ts
import type { SqliteDb } from '@octane-xplat/sqlite'
import type { PackingItem } from './packing-list'

export async function inspectPackingList(db: SqliteDb) {
	const first = await db.get<PackingItem>('SELECT id, label, packed FROM packing_items ORDER BY id LIMIT 1')
	const firstArray = await db.getArray('SELECT id, label FROM packing_items ORDER BY id LIMIT 1')
	const arrays = await db.selectArray('SELECT id, label FROM packing_items ORDER BY id')
	const labels: string[] = []
	const count = await db.each('SELECT label FROM packing_items ORDER BY id', [],
		(error, row) => { if (error) throw error; labels.push(String(row.label)) },
		(error) => { if (error) throw error })
	return { first, firstArray, arrays, labels, count }
}
```

## Browser storage and other targets

On web, a Worker loads SQLite and its WebAssembly asset. Durable data uses the
origin-private file system (**OPFS**, browser-managed files for this site's
origin). The preferred sync-access-handle pool works without cross-origin
isolation; an older fallback can require it. Denied OPFS can instead open an
in-memory database. Always inspect `persistent`, rather than inferring durability
from a successful query. Clearing site data or changing origin can remove or
hide this data; persistence is not a backup guarantee.

An explicit disposable preview may opt into that fallback. Give it a different
name and keep a session-only notice visible; do not feed it into the saved-list
screen, whose success message promises device persistence:

```ts
import { openPackingList } from './packing-list'

const preview = await openPackingList('preview.db', true)
try {
	const notice = preview.persistent ? 'Saved locally.' : 'Session only: closing this page loses changes.'
	await preview.add('Preview item')
	console.log(notice, await preview.list())
} finally { await preview.close() }
```

On iOS/Android the adapter uses the NativeScript SQLite plugin; on experimental
AppKit it uses system SQLite and requires the matching host metadata. Windows
reports `supported: false`; opening rejects. Native GTK service coverage remains
[incomplete](../platform/linux-gtk.md). Android's default worker-thread transaction
path still needs actual-device qualification; existing historical source findings
are not proof of a defect in the currently installed plugin. See
[SQLite evidence and the Android gate](../../.agents/docs/notes/sqlite-notes.md#android-transaction-threading-gate-2026-10-22).
This guide's new checks ran on the Node host, not a native device or browser.

## Delete deliberately and recover from errors

For a user-confirmed **Erase local packing data** action, close every connection
owner first, then delete the known database. Inspect the result; `false` does not
confirm that a persisted file was removed. Never delete on startup merely to
avoid a migration error:

```ts
import { deleteDatabase } from '@octane-xplat/sqlite'

export async function eraseClosedPackingList(): Promise<string> {
	try {
		const removed = await deleteDatabase('packing.db')
		return removed ? 'Local packing data removed.' : 'No persisted file removal was confirmed.'
	} catch { return 'Could not remove local packing data. Retry after closing its screens.' }
}
```

If opening fails, check target support, Worker/Wasm delivery in the browser
network log, and storage access. If a write fails, preserve the visible draft,
report the failure, and retry after reopening. If migration fails, preserve the
old database and fix the migration; if the database version is newer, install
the matching app. Use a new test database to investigate without erasing user
data. Account-specific filenames and an explicit deletion policy belong to your
app; server data belongs in the [shared query cache](data.md#the-shared-query-cache)
when you need loading and refresh, with synchronization designed separately.
