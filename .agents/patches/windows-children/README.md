# Octane child collection repair

`octane-children-source.patch` applies to the `octane@0.6.3` owning TypeScript
source. From the upstream repository root, apply it with
`git apply --directory=packages/octane <path-to-this-patch>`.
The source patch was applied to a clean source copy and compared with the edited
source before handoff.

The package integration is in the existing canonical
`packages/cli/patches/octane@0.6.3.patch`: both ESM runtime variants and the
universal declarations expose `Children.toArray` and `Children.map`. All canonical
sections outside `universal-core` were verified byte-for-byte unchanged. The
normalizer is emitted from the retained TypeScript source; it is not a UI-side
plan interpreter. `pnpm sync:patches` maintains the config-package copy and yaml
metadata. The lockfile changes only the Octane patch hash.

Collection regression coverage lives in `packages/ui/src/children.mobile.test.ts`
and `children.web.test.tsrx`; installed-driver text hosting is covered by
`data-driver.mobile.test.ts`. See
[the task lab record](../../docs/windows-children-text-repair.md) for verified
scope and the Windows reopening gate.
