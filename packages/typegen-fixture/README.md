# `tsrx-typegen-fixture`

The fixture package [`tsrx-typegen`](../tsrx-typegen/README.md)'s tests run
against — private, never published. It is a deliberately ordinary
component package: `.tsrx` components (`Box`, `Badge`, `Card`, `Factory`),
plain-TS helpers (`decode`, `format`), a `./format` subpath export, and a
`tsrx-typegen.json` target — enough surface to exercise declaration
generation, `--check` freshness, override mapping, and `--pack-check`.

Scripts double as the test steps:

```sh
pnpm exec turbo run typegen --filter=tsrx-typegen-fixture          # emit types/generated
pnpm exec turbo run typegen:check --filter=tsrx-typegen-fixture    # --check freshness gate
pnpm exec turbo run typecheck:consumer --filter=tsrx-typegen-fixture  # plain-tsc consumer
pnpm exec turbo run test:packed --filter=tsrx-typegen-fixture      # packed-tarball consumer
```

`consumer.typecheck.ts` is the compile-only consumer the typecheck and
packed tests compile; `types/generated/` is ignored build output. The
drivers live in `packages/tsrx-typegen/tests/` — when changing the tool,
change the fixture in the same commit so `--check` failures point at real
output drift.
