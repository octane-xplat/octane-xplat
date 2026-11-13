### `@octane-xplat/patches` is retired

Framework patches are local files in every project, so the separate `@octane-xplat/patches` config package is no longer published. `xplat upgrade` migrates pnpm projects that opted into `configDependencies`: `patchedDependencies` entries pointing at `node_modules/.pnpm-config/` rewrite to `patches/` files and the config dependency is removed.

New starters were already local for both package managers, so created projects are unaffected. Custom patch files that differ from the framework's canonical patches are still preserved or reported as conflicts — nothing is silently overwritten.
