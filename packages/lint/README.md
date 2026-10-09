# @octane-xplat/lint

Cross-platform lint rules for Octane Xplat apps, including `.tsrx` files.

```sh
pnpm add -D @octane-xplat/lint oxlint
```

Add `"@octane-xplat/lint/oxlint-plugin"` to Oxlint's `jsPlugins`, enable the
`xplat/*` rules you want in `.oxlintrc.json`, and run `xplat-lint` to lint both
regular source files and TSRX files. `xplat-lint --fix` also applies supported
fixes.

```json
{
	"jsPlugins": ["@octane-xplat/lint/oxlint-plugin"],
	"rules": { "xplat/no-dom-globals": "error" }
}
```

```sh
pnpm exec xplat-lint
pnpm exec xplat-lint --fix
```

Consuming a local checkout through `link:`? If pnpm installed the package
without its `node_modules/.bin` shim (`xplat-lint: command not found`), run
`node node_modules/@octane-xplat/cli/src/link-bins.mjs` from the app root —
see the [CLI README](../cli/README.md). `xplat-lint` resolves `oxlint` from
the app's dependency tree, so invoking the bin directly with `node` also
works without `node_modules/.bin` on PATH.
