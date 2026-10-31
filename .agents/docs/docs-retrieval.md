# Local versioned documentation retrieval

The CLI docs service owns installed-version resolution and commit-pinned release
snapshots. Both CLI and MCP call this service. The
[consumer instructions](../../packages/cli/README.md#local-documentation-search)
own setup; `packages/docs-search` owns Markdown sections, SQLite FTS5, embedding
storage, and rank fusion. It runs on the developer host, outside app renderers.

Filter by snapshot, corpus and platform before vector retrieval. Keep internal
notes separately selectable. Release-entry version/date describe the historical
entry, while provenance describes its enclosing snapshot. Changes to linked
files produce a different inventory fingerprint even without a Git commit.
Exact search and page reads must remain independent of database/model readiness.

## Model loading limitation

Transformers.js 4.3.2's `pipeline()` passes only device/dtype into preliminary
file discovery, dropping revision, cache location and `local_files_only`.
`loadTokenizer()` also calls `get_tokenizer_files()` without those options.
A cached model loaded by repository ID therefore attempts remote metadata
requests despite local-only configuration. This was reproduced on macOS arm64
with Node 26.12.0 by rejecting `fetch` during the real-model smoke task.
See upstream [pipeline loading](https://github.com/huggingface/transformers.js/blob/4.3.2/packages/transformers/src/pipelines.js)
and [tokenizer loading](https://github.com/huggingface/transformers.js/blob/4.3.2/packages/transformers/src/tokenization_utils.js).

Xplat downloads four named files from an immutable model revision during explicit
preparation, validates their SHA-256 hashes, and loads an absolute local model
directory. Absolute paths avoid remote model-ID discovery without changing
Transformers.js global environment settings. Search validates those cached files
and never repairs them over the network. Missing/invalid files yield an explicit
lexical fallback. Recheck this workaround when upgrading Transformers.js;
remove it only after model-ID loading passes the network-blocked smoke task.

## Maintained verification

Deterministic engine, CLI service and MCP transport tests need no model download.
The separate `test:model` task prepares a real model, blocks fetch during search,
and checks guide/release retrieval across two versions. It stays outside PR CI.
These are developer-host checks; they do not qualify native UI behavior.

```sh
bun run turbo run test --filter=@octane-xplat/docs-search
bun run turbo run test:docs-search --filter=@octane-xplat/cli --filter=@octane-xplat/mcp
bun run turbo run test:model --filter=@octane-xplat/docs-search
```
