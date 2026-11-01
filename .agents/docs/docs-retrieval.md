# Local versioned documentation retrieval

The CLI docs service owns installed-version resolution and commit-pinned release
snapshots. Both CLI and MCP call this service. The
[consumer instructions](../../docs/packages/package-cli.md#local-documentation-search)
own setup; `packages/docs-search` owns Markdown sections, SQLite FTS5, embedding
storage, and rank fusion. It runs on the developer host, outside app renderers.

Filter by snapshot, corpus and platform before vector retrieval. Keep internal
notes separately selectable. Release-entry version/date describe the historical
entry, while provenance describes its enclosing snapshot. Changes to linked
files produce a different inventory fingerprint even without a Git commit.
Exact search and page reads must remain independent of database/model readiness.

## Text-only inference

Use `@huggingface/tokenizers` and `onnxruntime-web/wasm` with the pinned q8
MiniLM model. The previous Transformers.js dependency pulled in native ONNX,
browser ONNX and image processing. The text-only dependency closure is less than
half its installed size; compare fresh installs when changing the runtime.

Xplat downloads four named files from an immutable model revision during explicit
preparation and validates their SHA-256 hashes. Tokenizer configuration, model
bytes and WASM runtime assets all load from local files during search. There is
no model discovery or CDN fallback. Missing/invalid model files yield an explicit
lexical fallback. Keep the fetch-blocked smoke when upgrading dependencies.

Node's WASM execution provider supports one thread; the embedder sets
`env.wasm.numThreads = 1` before session creation. See the upstream
[runtime support table](https://onnxruntime.ai/docs/get-started/with-javascript/web.html).
Run each sequence separately so padding and q8 batch composition cannot change
the vector for a content hash. Truncate to 512 tokens while retaining the final
separator; mean-pool attended tokens and normalize the 384-dimensional output.

The embedding identity includes the model revision, runtime/tokenizer versions,
pooling, normalization and sequence policy. Changing any of these requires
`docs index` to rebuild embeddings. Keep the existing model files and previous
vectors in the disposable cache; never mix vectors from different identities.

## Maintained verification

Deterministic engine, CLI service and MCP transport tests need no model download.
The separate `test:model` task prepares a real model, blocks fetch during search,
checks guide/release retrieval across two versions, and evaluates paraphrased
queries against maintained guides. It also covers empty, Unicode and truncated
inputs and independence from batch companions. It stays outside PR CI.
These are developer-host checks; they do not qualify native UI behavior.

```sh
bun run turbo run test --filter=@octane-xplat/docs-search
bun run turbo run test:docs-search --filter=@octane-xplat/cli --filter=@octane-xplat/mcp
bun run turbo run test:model --filter=@octane-xplat/docs-search
```
