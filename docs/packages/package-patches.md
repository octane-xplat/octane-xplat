# @octane-xplat/patches

> Canonical framework patch files for Bun and pnpm

The canonical patch bundle, shared by Bun and pnpm compatibility checks.
New apps and libraries include local `patches/` files in their scaffold, so
Bun can apply them during the first install. Existing pnpm consumers can
continue using this package as a config dependency.

The canonical patch files and their rationale live in
`packages/cli/patches/manifest.json`. `bun run sync:patches` generates this
package's `patches/` directory from that source. Do not edit the copies here
by hand.

In an existing Xplat app with the CLI installed, apply the matching patch set,
install dependencies, then verify registration:

```sh
bun run xplat patches apply
bun install
bun run xplat patches check
```

For app maintenance, follow [the CLI upgrade guide](https://octane-xplat.goddardai.org/package-cli#compatible-versions).

[Generated API reference](https://octane-xplat.goddardai.org/api-patches).
