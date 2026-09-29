# SQLite notes (`packages/sqlite` — proposed leaf)

> Cross-target SQLite evaluation for the proposed `@octane-xplat/sqlite` leaf.
> All findings are `desk-source`; nothing here has run on a device.
>
> **Owns:** cross-target structured persistence seam · **Status:** backend map
> complete, seam proposed · **Blocks on:** lab checks listed under Open
> questions · **Decisions:** none recorded · **Validated by:** nothing yet.

## Candidates assessed

| Candidate | Verdict |
| --- | --- |
| `react-native-sqlite-2` (ios/android/windows/macos) | **Not usable.** Its JS layer is a WebSQL shim (the deprecated W3C spec API: `openDatabase` → `db.transaction` → `tx.executeSql(sql, args, cb, errCb)`), and its per-platform implementations are React Native bridge modules — `RNSqlite2.m`, a Java package, a `react-native-windows` C# module, macOS via react-native-macos. None of it runs under NativeScript. Its only relevant precedent is that a WebSQL-compat shim is buildable; not recommended as the seam's primary shape. |
| `@sqlite.org/sqlite-wasm` | Official sqlite wasm build wrapped as an ES module with TS types. oo1 API: `DB.exec`, `prepare`/`bind`/`step`/`finalize`, `selectObjects`/`selectArrays`/`selectValues`, `OpfsDb`, `db.export()`. Fits the web leaf. Node.js is in-memory only (no persistence). |
| `@nativescript-community/sqlite` | The NativeScript counterpart and the right iOS/Android backend. Already a **promise-shaped** API, nearly matching the seam proposed below. Leaf carries it as a real `dependency` (decision #51). |

## Backend map

| Target | Backend | Evidence |
| --- | --- | --- |
| web | `@sqlite.org/sqlite-wasm` oo1 inside a module Worker | Persistent only via `OpfsDb`, which requires `crossOriginIsolated` — the page must be served with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`, and OPFS is only reachable from a worker. Without those headers (or on hosts that can't send them) the DB is transient (`new oo1.DB(name, 'ct')`); export/import to IndexedDB is the fallback persistence path. Vite needs `optimizeDeps.exclude: ['@sqlite.org/sqlite-wasm']` + the dev-server headers. |
| iOS | `@nativescript-community/sqlite` | `platforms/ios` carries a Podfile pulling **FMDB**; JS API is sync bridge calls wrapped in promises. |
| Android | `@nativescript-community/sqlite` | `platforms/android` ships a `com.akylas.sqlite` Java layer (WorkersContext for off-thread queries) over Android's framework sqlite. |
| macOS | system `libsqlite3` via `@nativescript/macos-node-api` `interop` C calls — **unverified** | The AppKit host renders through the node-api runtime, which carries the same metadata-driven ObjC/C interop as the iOS runtime; `libsqlite3` ships in every macOS SDK. Needs the host to link `libsqlite3.tbd` and a small declared-functions surface (`sqlite3_open`, `_prepare_v2`, `_step`, `_column_*`, `_bind_*`, `_exec`, `_close`). Fallback: run sqlite-wasm inside the host's JSC context + persistence through the existing host file bridge. |
| Windows | `Unsupported` leaf (`windows-notes` convention) | `@nativescript/windows` is days old; no plugin ships windows impls, and the runtime's native interop depth is unproven. `winsqlite3.dll` exists in System32 if Path A's interop ever reaches arbitrary DLLs. |
| Linux | `.linux → .web → unsuffixed` chain serves the WebKitGTK webview | wasm runs inside the webview; OPFS unlikely in WebKitGTK → transient or IndexedDB-export persistence. A later `.linux` leaf could bridge the host's system sqlite3. |

The plugin's mobile API (from `sqlitedatabase.d.ts`):

```ts
openOrCreate(path, flags?) → SQLiteDatabase
db.select(sql, params?) → Promise<Row[]>
db.selectArray(sql, params?) → Promise<Row[][]>
db.get(sql, params?) → Promise<Row>
db.getArray(sql, params?) → Promise<Row[]>
db.execute(sql, params?) → Promise<void>
db.transaction(async (cancel) => T) → Promise<T>   // cancel() rolls back
db.each(sql, params, rowCb, doneCb) → Promise<number>
db.getVersion()/setVersion(n), isOpen, close()
deleteDatabase(path)
```

`DatabaseOptions.threading` routes calls through a real native worker
(`src/sqlite/worker.ts` + `WorkersContext.java`) — worth defaulting on so a
slow query never blocks the JS thread.

## Proposed seam

`@octane-xplat/sqlite`, own leaf per decision #51 (needs a plugin + a wasm
asset — too heavy for `platform`). Async shape nearly 1:1 with the mobile
plugin so the native leaf is a thin pass-through:

```ts
const db = await openDatabase('app.db')
await db.execute('CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)')
const rows = await db.select<{ id: number; name: string }>('SELECT * FROM items')
await db.transaction(async () => { … })          // throw to roll back
await db.close()
```

- `.web`: spawns `new Worker(new URL('./sqlite-worker.ts', import.meta.url),
  { type: 'module' })`, init's sqlite-wasm inside it, uses `OpfsDb` when
  `crossOriginIsolated`, transient + explicit `export()` otherwise. First
  Worker consumer in the codebase — vite worker bundling needs a build check.
- unsuffixed (iOS/Android): delegates to the plugin verbatim; `threading: true`
  by default.
- `.macos`: interop binding as above; `.windows`: `Unsupported`; `.linux`:
  inherits `.web`.

Intentionally not WebSQL-shaped: the callback `transaction(tx => tx.executeSql(...))`
model is deprecated upstream and strictly worse than promises here. Apps
wanting an ORM can layer `drizzle-orm` over the seam via its sqlite-proxy
adapter — the low-level shape stays compatible with that.

## Constraints and risks

- **OPFS is a deployment constraint, not just a config flag.** `require-corp`
  breaks loading cross-origin subresources (CDN images/scripts/iframes) that
  don't send CORP/CORS headers — the whole web app inherits that isolation,
  not just the DB worker. Persistence-on-web needs an explicit
  "crossOriginIsolated ⇒ OpfsDb, else transient" capability flag in the API
  so app code can branch instead of silently losing data.
- The plugin-wrap ranking's "fake parity" flag for sqlite applies to
  **persistence semantics** (sandboxed OPFS vs real app files), not the SQL
  surface — it is the same sqlite engine on both sides.
- Mobile bridge cost: each call crosses JS↔native synchronously (FMDB /
  `com.akylas.sqlite`). `threading` exists but is opt-in; measure before
  recommending it for hot paths.
- No persistence parity for migrations: plugin exposes `getVersion`/
  `setVersion`; the wasm side has no built-in `PRAGMA user_version` helper —
  seam should expose `userVersion` get/set mapped to that pragma so upgrade
  code can be shared.

## Open questions (lab)

- Does the AppKit host's node-api runtime expose `interop` C-function calls
  far enough to drive `sqlite3_*` — and does adding `libsqlite3.tbd` to the
  host link step suffice?
- Web without cross-origin isolation: IndexedDB export/import on
  `close()`/checkpoint vs sqlite's `kvvfs` IDB VFS — which lands in the seam?
- Does `new Worker(new URL(...))` inside a leaf package bundle correctly
  through `xplatNative`'s web rollup config, or does it need a dedicated
  worker build step?
- `threading: true` on-device behavior (workers survive HMR? cost per call?)
  on the mobile harness.
