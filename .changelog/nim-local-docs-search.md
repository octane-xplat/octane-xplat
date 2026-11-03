### Search installed-version docs with the experimental native CLI

The parallel Nim CLI now supports exact, lexical and local semantic docs search
on macOS Apple Silicon, with versioned page refs, offline snapshots, conflict
reporting and separately labeled project guidance. Explicit `docs index` prepares
optional pinned model/runtime assets; ordinary search reports its fallback and
never downloads them. The TypeScript CLI remains available during migration.

```sh
xplat docs index --package @octane-xplat/ui --json
xplat docs search "remember input between pages" --json
```

See [experimental native setup and download costs](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
