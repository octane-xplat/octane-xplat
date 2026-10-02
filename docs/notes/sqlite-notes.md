# SQLite notes (`packages/sqlite`)

> Cross-target SQLite seam record — `@octane-xplat/sqlite` is implemented;
> the backend findings below now carry verification marks.
>
> **Owns:** cross-target structured persistence seam · **Status:** implemented
> in `packages/sqlite` — verified on web (full probe round-trip + durable
> persistence where OPFS is available) and iOS sim (same probe
> readout through FMDB: rows/count/rollback/userVersion, persistent=true) · **Blocks on:** macOS backend and
> Windows ship `supported: false` leaves · **Decisions:** see decisions.md ·
> **Validated by:** harness `Services` probe + production-bundle smoke + maintained
> `pnpm --filter @xplat/web sqlite:readiness` checks in Chromium, Firefox, and
> WebKit.

## Candidates assessed

| Candidate                                           | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-native-sqlite-2` (ios/android/windows/macos) | **Not usable.** Its JS layer is a WebSQL shim (the deprecated W3C spec API: `openDatabase` → `db.transaction` → `tx.executeSql(sql, args, cb, errCb)`), and its per-platform implementations are React Native bridge modules — `RNSqlite2.m`, a Java package, a `react-native-windows` C# module, macOS via react-native-macos. None of it runs under NativeScript. Its only relevant precedent is that a WebSQL-compat shim is buildable; not recommended as the seam's primary shape. |
| `@sqlite.org/sqlite-wasm`                           | Official sqlite wasm build wrapped as an ES module with TS types. oo1 API: `DB.exec`, `prepare`/`bind`/`step`/`finalize`, `selectObjects`/`selectArrays`/`selectValues`, `OpfsDb`, `db.export()`. Fits the web leaf. Node.js is in-memory only (no persistence).                                                                                                                                                                                                                        |
| `@nativescript-community/sqlite`                    | The NativeScript counterpart and the right iOS/Android backend. Already a **promise-shaped** API, nearly matching the seam proposed below. Leaf carries it as a real `dependency` (decision #51).                                                                                                                                                                                                                                                                                       |

## Backend map

| Target  | Backend                                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| web     | `@sqlite.org/sqlite-wasm` oo1 inside a module Worker                                      | **Verified 2026-09-29; browser runtime rechecked 2026-10-02.** Persistence uses `installOpfsSAHPoolVfs` — sync-access-handle pool over OPFS that needs a Worker but _not_ cross-origin isolation, so the COOP/COEP deployment constraint predicted earlier does not apply on the preferred path. Fallback order: SAH pool → `OpfsDb` when available → transient `oo1.DB`. The worker bundles cleanly through the app vite build (`new Worker(new URL(...))` + `?url` wasm asset). Each `openDatabase` call has an independent worker-side handle. |
| iOS     | `@nativescript-community/sqlite`                                                          | `platforms/ios` carries a Podfile pulling **FMDB**; JS API is sync bridge calls wrapped in promises.                                                                                                                                                                                                                                                                                                                                                           |
| Android | `@nativescript-community/sqlite`                                                          | `platforms/android` ships a `com.akylas.sqlite` Java layer (WorkersContext for off-thread queries) over Android's framework sqlite.                                                                                                                                                                                                                                                                                                                            |
| macOS   | system `libsqlite3` via `@nativescript/macos-node-api` `interop` C calls — **unverified** | The AppKit host renders through the node-api runtime, which carries the same metadata-driven ObjC/C interop as the iOS runtime; `libsqlite3` ships in every macOS SDK. Needs the host to link `libsqlite3.tbd` and a small declared-functions surface (`sqlite3_open`, `_prepare_v2`, `_step`, `_column_*`, `_bind_*`, `_exec`, `_close`). Fallback: run sqlite-wasm inside the host's JSC context + persistence through the existing host file bridge.        |
| Windows | `Unsupported` leaf (`windows-notes` convention)                                           | `@nativescript/windows` is days old; no plugin ships windows impls, and the runtime's native interop depth is unproven. `winsqlite3.dll` exists in System32 if Path A's interop ever reaches arbitrary DLLs.                                                                                                                                                                                                                                                   |
| Linux   | `.linux → .web → unsuffixed` chain serves the WebKitGTK webview                           | wasm runs inside the webview; OPFS unlikely in WebKitGTK → transient or IndexedDB-export persistence. A later `.linux` leaf could bridge the host's system sqlite3.                                                                                                                                                                                                                                                                                            |

The plugin's mobile API (from `sqlitedatabase.d.ts`):

```ts
import { openOrCreate } from '@nativescript-community/sqlite'

const db = openOrCreate('app.db')
await db.execute('CREATE TABLE IF NOT EXISTS items(name TEXT)')
const rows = await db.select('SELECT name FROM items')
await db.transaction(async () => {
	await db.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
})
await db.close()
```

`DatabaseOptions.threading` routes calls through a real native worker
(`src/sqlite/worker.ts` + `WorkersContext.java`) — worth defaulting on so a
slow query never blocks the JS thread.

```ts
import { openDatabase } from '@octane-xplat/sqlite'

const db = await openDatabase('app.db', { threading: true })
try {
	console.log(await db.select('SELECT 1 AS ready'))
} finally {
	await db.close()
}
```

## Proposed seam

`@octane-xplat/sqlite`, own leaf per decision #51 (needs a plugin + a wasm
asset — too heavy for `platform`). Async shape nearly 1:1 with the mobile
plugin so the native leaf is a thin pass-through:

```ts
import { openDatabase } from '@octane-xplat/sqlite'

const db = await openDatabase('app.db')
await db.execute('CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)')
const rows = await db.select<{ id: number; name: string }>('SELECT * FROM items')
await db.transaction(async (transaction) => {
	await transaction.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
}) // throw to roll back
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

- ~~**OPFS is a deployment constraint**~~ — resolved differently in the
  shipped leaf: `installOpfsSAHPoolVfs` persists through OPFS with only a
  Worker requirement (no `crossOriginIsolated`), verified durable across page
  reloads in headless Chromium. The `persistent` flag still matters — OPFS
  can be denied (private windows, locked-down embeds), in which case the DB
  silently degrades to transient unless the app checks the flag.
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

- ✅ Worker bundling — `new Worker(new URL('./worker.web.ts', import.meta.url))`
  inside the source-shipped leaf bundles correctly through the app's vite
  build (worker chunk + wasm asset emitted); verified `vite build`.
- ✅ Web persistence — SAH pool gives durable OPFS storage without
  COOP/COEP; write→reload→read verified.
- ✅ Maintained Web runtime regression — concurrent opens keep separate
  databases isolated; closing one leaves the other usable; rollback,
  deleting an open database invalidates its handles, `user_version`, SQL error
  recovery, and worker-startup rejection pass in Chromium, Firefox, and WebKit.
  Chromium and Firefox verified OPFS data after reload; WebKit exercised the
  transient fallback with `persistent=false`. The production app bundle also
  completes the Services round-trip in all three Playwright engines.
- ✅ macOS backend — system libsqlite3 via metadata C-interop. The blocker
  was never the mechanism (`CC_SHA256`-style C functions resolve fine); the
  prebuilt `metadata.nsmd` simply never swept `usr/include` module-map
  headers. The metadata generator's auto-umbrella only covers framework
  headers — `patches/nativescript-runtimes.patch` adds `#import <sqlite3.h>`
  and `#import <dlfcn.h>` to `CreateUmbrellaHeader` plus an `include=` path so
  their decls pass the filter, and `build-metadata.sh` regenerates the nsmd.
  `dlopen('/usr/lib/libsqlite3.dylib')` + `sqlite3_open`/`prepare`/`step`/
  `column_*`/`bind_*` all work; the result is a real file db (the system
  `sqlite3` CLI reads it). Verified end-to-end on the prebuilt host: full
  probe round-trip, blob binds, `each` streaming, `PRAGMA user_version`,
  cold second-process read. Two host quirks found along the way: `new
interop.Pointer` isn't re-entrant as a destructor arg (share the
  SQLITE_TRANSIENT sentinel), and exceptions thrown mid-job-drain are
  silently swallowed (they kill the microtask queue without rejecting). The
  earlier wasm-in-JSC fallback (`env.macos.ts`) was dropped once interop
  worked.
- ✅ iOS runtime — full probe readout on sim
  (`rows=alpha,beta count=2 rb=true v=0→7 persistent=true`).
- Upstream bug found: the plugin's `get`/`getArray` crash on iOS (`getRaw`
  reads `resultDictionary` before `s.next()`). The leaf routes them over
  `select`/`selectArray` — same contract, working code.
- `threading: true` on-device behavior (workers survive HMR? cost per call?)
  on the mobile harness.
