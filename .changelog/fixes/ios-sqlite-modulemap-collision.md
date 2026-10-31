### Fix iOS builds combining SQLite with other native module libraries

iOS app builds no longer fail with `Multiple commands produce
.../include/module.modulemap` when `@octane-xplat/sqlite` is installed
alongside another library-style xcframework that ships a module map, such as
`@nativescript/font-manager`. The upstream
`@nativescript-community/sqlite-bridge` xcframework declared a duplicate
generic `module.modulemap` output; the packaged patch removes it — the
SQLite bridge class is still reachable through NativeScript's runtime
metadata, so no app code changes are needed. The patch is applied
automatically on `bun install` and is included in new project starters.
