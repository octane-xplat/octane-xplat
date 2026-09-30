# Persist structured data in a local database

ID: local-database
Targets: web, ios, android, macos
Related APIs: @octane-xplat/sqlite, openDatabase, deleteDatabase, select, selectArray, get, getArray, execute, transaction, each, getUserVersion, setUserVersion, persistent, supported

## Starting point

A working scaffolded app and shared state that outgrows the `storage` key-value
service — records the app queries by more than one field, or a schema that
must migrate as versions ship. The reader knows the platform services pattern.
ORM layers (e.g. Drizzle over the seam) are outside this recipe's scope.

## Requirements

- Open and migrate a named database from shared code with identical imports
  on every target.
- Read and write rows with parameters, inside and outside transactions, with
  rollback on failure.
- Tell the user when the database could not persist (web without OPFS, or an
  unsupported target) instead of silently losing it.

## Acceptance criteria

- AC1: `openDatabase(name)` resolves to a `SqliteDb` on web, iOS, Android, and
  macOS from one shared import; `supported` reports false on Windows and
  `openDatabase` rejects there rather than crashing at import.
- AC2: `execute`, `select`, `selectArray`, `get`, `getArray`, `each`, and
  `transaction` behave the same on every supported target; a throwing
  transaction rolls back its writes.
- AC3: `getUserVersion`/`setUserVersion` round-trips `PRAGMA user_version`
  and supports a shared migration routine.
- AC4: `db.persistent` is true on native and on web under OPFS access, and
  the reader knows that without OPFS the web database is transient and must
  be treated as a cache, not a record of truth.

- AC5: `deleteDatabase(name)` removes the persisted file on native and the
  OPFS entry on web.

## Documentation

- AC1: [Local database](../docs/platform-services.md#local-database) —
  `supported`/`openDatabase` behavior per target.
- AC2: [Local database](../docs/platform-services.md#local-database) —
  method surface and transaction semantics.
- AC3: [Local database](../docs/platform-services.md#local-database) —
  `getUserVersion`/`setUserVersion` as the migration hook.
- AC4: [Local database](../docs/platform-services.md#local-database) —
  `persistent` flag semantics; [known limits](../docs/known-limits.md) —
  transient-fallback conditions.
- AC5: [Local database](../docs/platform-services.md#local-database) —
  `deleteDatabase`.
