# Develop this workspace against a local MasonKit fork checkout

The Windows preview package uses the published `@octane-xplat/nativescript-masonkit`
package (mobile apps use Mason core instead). To use a local checkout of the
`octane-xplat/nativescript-mason` fork, run from this repository root:

```sh
pnpm -C /path/to/nativescript-mason install
pnpm -C /path/to/nativescript-mason exec nx run nativescript-masonkit:build.all
ln -s /path/to/nativescript-mason links/nativescript-mason
bun run dev:masonkit
```

Replace `/path/to/nativescript-mason` with your checkout path. The link is
ignored by Git. `dev:masonkit` temporarily overrides `@octane-xplat/nativescript-masonkit`
with a `link:` path pointing at the fork's built package, `dist/packages/nativescript-masonkit` — that directory carries
the compiled JS, typings, and `platforms/` native binaries; the fork's TS
source is not consumable. A missing `dist` dir or mismatched package name fails
the install. The Bun install skips lifecycle scripts and lockfile writes (`--ignore-scripts --no-save`).
The root manifest is restored after the install, including failed installs.

Verify the installed package links with:

```sh
realpath apps/windows/node_modules/@octane-xplat/nativescript-masonkit
```

The path should resolve into your checkout's
`dist/packages/nativescript-masonkit`.

Rebuild the fork (`pnpm exec nx run nativescript-masonkit:build.all`) after
changing its source; `link:` dependencies expose the dist directory directly,
so no reinstall is needed for content changes.

To restore the published package, run `bun install --frozen-lockfile`.
Ordinary installs and CI do not select the local hook. The symlink can stay in
place; remove it with `unlink links/nativescript-mason` when no longer needed.

The skipped root postinstall can be run separately when a fresh checkout needs
its generated declarations and app files:

```sh
bun run typegen
bun run turbo run gen --filter=@octane-xplat/app
```

## Develop the mobile core package

For iOS and Android, build the local fork's `nativescript-mason-core` package
and select it explicitly:

```sh
ln -s /path/to/nativescript-mason links/nativescript-mason
bun run dev:masonkit --core
realpath apps/mobile/node_modules/@octane-xplat/nativescript-mason-core
```

The resolved path must end in `dist/packages/nativescript-mason-core` in that
checkout. Its build must include the native artifacts for the target being
run; rebuilding JavaScript alone does not change the native framework linked
into an app. Follow the local fork's core build instructions. The hook also
links the core package's declared runtime dependencies from the mobile app into the external dist, so native discovery can resolve them. The same
manifest restoration and lockfile preservation apply to this option.
