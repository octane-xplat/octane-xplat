# @octane-xplat/lint

Check cross-platform code patterns in Octane Xplat apps and libraries,
including `.tsrx` files. The [Xplat CLI](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#lint-and-format)
includes this package and Oxlint; no separate lint installation or config is
needed for its defaults:

```sh
bun run xplat lint
bun run xplat lint src
bun run xplat lint --fix src
```

The standalone `xplat-lint` command remains available with the same arguments.
It includes Oxlint, so it also works when invoked directly through Node
without `node_modules/.bin` on `PATH`:

```sh
bun add -D @octane-xplat/lint
bun run xplat-lint --fix src
node node_modules/@octane-xplat/lint/bin/lint.mjs src
```

## What gets checked

Regular JS/TS/JSX/TSX files run through Oxlint and the Xplat plugin. TSRX runs
the same `xplat/*` checks through `@tsrx/core`; it does not run Oxlint's
built-in rules or apply automatic fixes. `--fix` applies safe Oxlint fixes
and leaves unresolved findings visible. Use `fmt` for formatting:

```sh
bun run xplat lint --fix
bun run xplat fmt
```

With no paths, both passes discover source recursively from the current
directory. Explicit files and directories follow the same ignores:
`.gitignore` (including nested files), `.eslintignore`, and root config
`ignorePatterns`. Build/output directories, symlinks and nested repositories
are skipped. Paths must stay inside the current directory:

```sh
bun run xplat lint src/Screen.tsrx src/components
```

Exit codes are `0` when no errors remain, `1` for lint errors, and `2` for
command or setup failures. Warning-level findings do not fail the command:

```sh
bun run xplat lint --help
```

## Routing migration rules

Four `xplat/*` rules catch pre-cutover routing patterns that types alone
cannot:

- `xplat/no-removed-routing-api` — imports of removed names such as
  `pushRoute`, `useRoute`, `registerRoutes`, or `AppRoutes` from
  `@octane-xplat/ui` or `/routing`; the message names the canonical
  replacement (`router.push`, `useRouterState`, generated registration).
- `xplat/no-route-augmentation` — `declare module '@octane-xplat/ui...'` in a
  non-generated file. Route types come from `xplat routes` output.
- `xplat/no-destination-cast` — `as`/`<>​` assertions on a `to` value or an
  object containing `to` (`as const` is allowed). Use a declared pattern or
  `router.validateDestination(...)` for runtime data.
- `xplat/no-interpolated-route-path` — template expressions or `+`
  concatenation as a `to` value or JSX `to` attribute. Use
  `to: '/items/:id', params: { id }`.

## Project configuration

The command uses one `.oxlintrc.json` in the directory where you run it.
That file replaces the bundled preset. Configuration must be strict JSON;
JSONC and JS/TS configs are unsupported by the companion pass. Relative JSON
`extends` and file `overrides` apply to Xplat rule severities and options in
both passes; nested configs are not loaded. To keep the preset while changing
one rule, add the lint package as a direct development dependency:

```sh
bun add -D @octane-xplat/lint
```

Then create `.oxlintrc.json`. Oxlint resolves inherited plugin paths from the
preset's directory. Set project ignore patterns in the root config:

```json
{
	"extends": ["./node_modules/@octane-xplat/lint/config.json"],
	"ignorePatterns": [".agents/", "**/*.gen.*", "src/generated/"],
	"rules": { "xplat/no-console-debug": "warn" },
	"overrides": [
		{
			"files": ["**/*.spec.*"],
			"rules": { "xplat/no-console-debug": "off" }
		}
	]
}
```

For a complete custom ruleset, register the plugin yourself and enable the
rules you want. Strings (`off`, `warn`, `error`, `allow`, `deny`) and numeric
severities (`0`, `1`, `2`) work in both passes:

```json
{
	"jsPlugins": ["@octane-xplat/lint/oxlint-plugin"],
	"rules": { "xplat/no-dom-globals": "error" }
}
```

TSRX supports `xplat-disable` in the first three lines for file-wide
suppression, plus line and next-line suppressions. Oxlint's own disable
comments apply to regular source:

```ts
// xplat-disable-next-line
console.debug('temporary diagnostic')
console.debug('temporary diagnostic') // xplat-disable-line
```

For a linked checkout with a missing `xplat-lint` shim, see the
[CLI's bin repair instructions](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#working-against-a-local-checkout).
