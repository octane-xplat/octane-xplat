### Search installed-version docs locally

Agents can prepare local vector search for guides, package READMEs, and release notes. Search combines keywords with a local embedding model, preserves version provenance, and reports lexical fallback when embeddings are unavailable.

```sh
xplat docs index --json
xplat docs search "remember input between pages" --json
xplat docs search "navigation" --corpus changelog --json
```

The text-only WASM runtime keeps inference local. The first preparation downloads a model; document text and questions stay on your machine. See [local documentation search](https://octane-xplat.goddardai.org/package-cli#local-documentation-search).
