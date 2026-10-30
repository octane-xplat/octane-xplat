# @octane-xplat/patches

The canonical patch bundle, shared by Bun and pnpm compatibility checks.
New apps and libraries include local `patches/` files in their scaffold, so
Bun can apply them during the first install. Existing pnpm consumers can
continue using this package as a config dependency.

The canonical patch files and their rationale live in
`packages/cli/patches/manifest.json`. `bun run sync:patches` generates this
package's `patches/` directory from that source. Do not edit the copies here
by hand.

For app maintenance, follow [the CLI upgrade guide](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#compatible-versions).
