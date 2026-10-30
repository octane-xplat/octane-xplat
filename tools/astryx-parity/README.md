# @xplat/astryx-parity

Renders the same component scenarios — Button, TextInput, CheckboxInput, and Switch — twice — once with
[`@astryxdesign/core`](https://www.npmjs.com/package/@astryxdesign/core)
(React, in `reference/`) and once with `@octane-xplat/ui` (in `candidate/`) —
then compares them in Chromium with [sameframe](https://github.com/aleclarson/sameframe)
plus scripted Playwright behavior probes. See
[`.agents/design/astryx-parity-harness.md`](../../.agents/design/astryx-parity-harness.md)
for the design.

**This harness is expected to fail.** A nonzero `parity` exit means parity
findings were recorded — that is the intended output until the gaps it
reports are fixed in `packages/ui`. Fix tokens/chrome/Button there, not
here.

## Run it

1. Install dependencies from the repo root: `bun install`.
2. Install the Chromium build Playwright 1.63 expects (once per machine):

   ```sh
   bun run --cwd tools/astryx-parity playwright install chromium
   ```

3. Run the comparison:

   ```sh
   bun run turbo run parity --filter=@xplat/astryx-parity
   ```

   This builds and `vite preview`s both sides (reference on 127.0.0.1:4310,
   candidate on :4311), runs `sameframe compare`, then the behavior probes.

## Read the results

- `artifacts/summary.json` — the compact sameframe result (status, findings)
  plus its exit code and the behavior diff count.
- `artifacts/sameframe/` — persisted per-page evidence; inspect it with the
  sameframe CLI (`inspect-page --format findings`, `inspect-finding`,
  `query-tree --parity-key <component>/<scenario>`; routes are `/button`,
`/text-input`, `/checkbox`, `/switch`, each with a `<route>/behavior` page.
- `artifacts/behavior/button.json` — every probe observation on both sides
  and the pairwise `diffs`.

Exit codes: `0` pass, `1` parity findings (expected), `2/3/4` a sameframe or
harness capture/internal error — that is a harness bug, not a parity result.

## Scope and qualification

Button scenarios only (`/button`, `/button/behavior`); 4 variants × 3 sizes,
disabled per variant, loading, and a width-constrained long label. Both sides
run in Chromium at 1× scale, light scheme, `en-US`, `UTC`, reduced motion.
Each library uses its own default system font stack, so pixel and text
metrics are host-dependent — results are qualified for the macOS host that
produced them.
