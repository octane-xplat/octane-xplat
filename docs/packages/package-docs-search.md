# Local documentation search

> Local documentation retrieval engine used by the Xplat CLI and MCP server.

`@octane-xplat/docs-search` is the retrieval engine used by the Xplat CLI and
MCP server. App authors use the [CLI documentation commands](package-cli.md#local-documentation-search);
direct installation is unnecessary. It runs on the developer's machine, outside
the app's web or native runtime.

Prepare the selected app's installed-version documentation, then ask a question:

```sh
xplat docs index --json
xplat docs search "remember input when switching pages" --json
```

The first preparation downloads a pinned, quantized MiniLM model from Hugging
Face. Text-only inference uses ONNX Runtime WASM and Hugging Face's tokenizer
on the CPU. SQLite stores section chunks, FTS5 keyword entries,
and content-addressed embeddings; search combines keyword and cosine rankings.
Results preserve source lines and release-entry identity. Consumers must supply
already validated snapshot content and a binding identity; this engine does not
resolve package versions or fetch release snapshots.

```ts
import { prepareIndex, searchIndex } from '@octane-xplat/docs-search'

const snapshot = {
  cacheDir: '/tmp/example-docs-search',
  binding: 'example-repository:verified-commit',
  documents: [{ path: 'docs/routes.md', corpus: 'guide', content: '# Routes\n\nRetain inactive screens.' }],
}
await prepareIndex(snapshot)
const found = await searchIndex({ ...snapshot, query: 'remember page state' })
console.log(found.retrieval.used, found.results)
```

Search never downloads a model. Missing embeddings or a missing local model
produce an explicit lexical fallback. Cache identity includes the chunker,
binding, document contents, model revision and inference backend. Run preparation
again after an embedding backend upgrade; old vectors cannot serve the new
backend. Identical text reuses embeddings across snapshots. Fenced examples remain
intact; exceptionally large sections
can exceed the embedding model's input window, so exact reads remain authoritative.

```sh
xplat docs search "RouteOutlet" --mode exact --json
xplat docs index --json
```

Maintainers run deterministic tests without downloading models. The separate
model smoke task downloads the real model and measures two-version retrieval;
it stays outside the PR gate.

```sh
bun run turbo run test --filter=@octane-xplat/docs-search
bun run turbo run test:model --filter=@octane-xplat/docs-search
```

[Generated API reference](https://octane-xplat.goddardai.org/api-docs-search).
