# @octane-xplat/patches

The pnpm patch files used by freshly scaffolded Octane-xplat apps. Apps do not
install this package directly — create templates declare it as a pnpm
`configDependencies` package so the patches are in place before regular app
dependencies install.

The canonical patch files and their rationale live in
`packages/cli/patches/manifest.json`. `pnpm sync:patches` generates this
package's `patches/` directory from that source. Do not edit the copies here
by hand.

For app maintenance, follow [the CLI upgrade guide](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#compatible-versions).
