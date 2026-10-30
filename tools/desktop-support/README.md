# Desktop export audit tooling

This private repository tool collects source-level exports for Windows, AppKit,
and GTK. It does not execute platform code. The [audit interpretation](../../.agents/docs/parity/native-desktop-support.md)
owns its scope and conclusions; the JSON/TSV files here are a dated snapshot,
not live support status.

Run from the repository root after installing dependencies. Create scratch output
before collecting, then explicitly render a new snapshot only when refreshing
an audit is intended:

```sh
mkdir -p research/desktop-audit
node tools/desktop-support/collect.mjs research/desktop-audit/inventory.json
node tools/desktop-support/render.mjs research/desktop-audit/inventory.json
```

`render.mjs` validates finding evidence paths and overwrites the checked-in TSVs,
`dependency-candidates.json`, and `snapshot.json` beside it. Review findings and
revision identities together; never regenerate an immutable baseline to make a
current implementation look qualified.

`windows-resolution.mjs` runs a bounded Vite resolver diagnostic using the Windows
host's dependencies and writes scratch output under `research/desktop-audit/`.
Resolution is not an app build or runtime result.
