#!/usr/bin/env bun
// Run published ESM from dist/. In-repo runs execute src/ through Bun so a
// stale, gitignored dist/ cannot run old code under current Turbo cache keys.
const entry = import.meta.url.includes('/node_modules/') ? '../dist/cli.js' : '../src/cli.ts'
await import(new URL(entry, import.meta.url).href)
