# Tailwind integration qualification

This private tool compares the official Tailwind compiler with NativeScript's
released CSS adapter. It does not install Tailwind into apps or publish an
integration. Dependency versions are pinned in this workspace's manifest.

Run from the repository root with Bun 1.4.4:

```sh
bun install --frozen-lockfile
bun run turbo run test typecheck --filter=@xplat/tailwind-qualification
bun run turbo run prepare:browser --filter=@xplat/tailwind-qualification
bun run turbo run qualify --filter=@xplat/tailwind-qualification -- --output "$HOME/dev/reports/octane-xplat/tailwind-feasibility"
```

The qualification command writes the official/generated stylesheet, the adapted
stylesheet, and `comparison.json` to the specified local directory. It exits 1
when the browser comparison finds semantic differences. Treat that as a failed
adoption gate, even if the tool's own tests pass. A missing browser or an invalid
baseline also fails the command. It never captures images.

The browser cases compare CSS semantics before and after transformation in
fresh documents; they do not run NativeScript. The native-engine observations
execute the desktop cascade in Node without AppKit or GTK. They establish no
native painting, layout, accessibility, input or mobile-runtime support.
Timing fields measure a single compiler/adaptation invocation, not Vite build,
HMR or end-to-end startup performance. CSS byte counts are not dependency sizes.

Ordinary `test` and `typecheck` tasks do not launch or install a browser. Keep
`prepare:browser` and `qualify` local, outside the PR gate. The unit tests verify
that the corpus is generated and the older adapter fixes remain present; they
are not an adoption verdict. Use the generated comparison to inspect losses,
including missing complete rules, before making a support claim.

Read the canonical [styling constraints](../../.agents/docs/notes/styling-notes.md#original-shared-pipeline)
for the ownership decision and native prerequisites. Keep run evidence and
qualification status in local reports and Silo, not in this directory.
