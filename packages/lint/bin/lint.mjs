#!/usr/bin/env node
// Published installs live under node_modules, where Node refuses type
// stripping — run the emitted dist/. In-repo runs always execute src/ (Node
// ≥22.18 strips types): a stale, gitignored dist/ would otherwise run old code.
const entry = import.meta.url.includes('/node_modules/') ? '../dist/runner.js' : '../src/runner.ts'
const { runLint } = await import(new URL(entry, import.meta.url).href)

process.exitCode = await runLint(process.argv.slice(2))
