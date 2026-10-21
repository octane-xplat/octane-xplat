#!/usr/bin/env node
// Published installs live under node_modules, where Node refuses type
// stripping — run the emitted dist/. In-repo runs always execute src/ (Node
// ≥22.18 strips types): a stale, gitignored dist/ would otherwise run old code
// under turbo cache keys hashed from current source.
const entry = import.meta.url.includes('/node_modules/') ? '../dist/cli.js' : '../src/cli.ts'
await import(new URL(entry, import.meta.url).href)
