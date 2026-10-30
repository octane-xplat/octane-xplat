### Manage framework patches with Bun or pnpm

`xplat patches` now detects Bun and pnpm projects, including workspace members
and catalog dependencies. Both use the same framework patch files:

```sh
bun run xplat patches apply
bun install
bun run xplat patches check
```

Use Bun 1.4.4 or later for the complete patch set. For pnpm 11, rerun
`xplat patches apply`: it now writes `pnpm-workspace.yaml` even for a standalone
app, because pnpm 11 ignores `package.json.pnpm.patchedDependencies`.

[Framework patches](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#framework-patches)
