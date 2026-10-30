# Desktop export audit tooling

This private repository tool collects source-level exports for Windows, AppKit,
and GTK. It does not execute platform code. The [audit guide](../../.agents/docs/parity/native-desktop-support.md)
explains interpretation. Inventories, reviewed findings, TSVs, hashes, and run
results stay in ignored local files/Silo rather than beside these sources.

Run from the repository root after installing dependencies. Start with no
reviewed findings, then add findings only after inspecting source:

```sh
mkdir -p research/desktop-audit
printf '[]\n' > research/desktop-audit/findings.json
node tools/desktop-support/collect.mjs research/desktop-audit/inventory.json
node tools/desktop-support/render.mjs research/desktop-audit/inventory.json research/desktop-audit/findings.json
```

An empty findings list makes no reviewed support claims. `render.mjs` requires an
explicit findings file and defaults its output directory to the inventory's
parent; an optional third argument selects another local directory. It validates
finding source paths and writes target TSVs, dependency candidates, and snapshot
metadata there. All output paths must be Git-ignored or outside the repository.

`windows-resolution.mjs` runs a bounded Vite resolver diagnostic using Windows
host dependencies. Its optional file argument defaults to ignored
`research/desktop-audit/windows-resolution.json`. Resolution is not an app build
or runtime result.

Use [operational evidence lookup](../../.agents/docs/exploration.md#operational-evidence)
for prior local snapshots; their absence from a clean checkout is intentional.
