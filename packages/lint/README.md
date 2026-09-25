# @octane-xplat/lint

Cross-platform lint rules for Octane xplat apps, including `.tsrx` files.

```sh
pnpm add -D @octane-xplat/lint oxlint
```

Add `"@octane-xplat/lint/oxlint-plugin"` to Oxlint's `jsPlugins`, enable the
`xplat/*` rules you want in `.oxlintrc.json`, and run `xplat-lint` to lint both
regular source files and TSRX files. `xplat-lint --fix` also applies supported
fixes.
