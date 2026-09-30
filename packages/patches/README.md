# @octane-xplat/patches

This package carries the pnpm patch files used by freshly scaffolded
Octane-xplat apps. It is installed as a pnpm `configDependencies` package so
the patches are available before regular app dependencies are installed.

The canonical patch files and their rationale live in
`packages/cli/patches/manifest.json`. `pnpm sync:patches` generates this
package's `patches/` directory from that source. Do not edit the copies here
by hand.
