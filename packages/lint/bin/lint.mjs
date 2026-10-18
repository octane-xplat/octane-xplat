#!/usr/bin/env node
import { existsSync } from 'node:fs'

// Prefer the emitted dist/ build (published tarballs); fall back to src/ so
// in-repo runs work before a build exists (Node ≥22.18 strips types).
const dist = new URL('../dist/runner.js', import.meta.url)
const { runLint } = await import(
	existsSync(dist) ? dist.href : new URL('../src/runner.ts', import.meta.url).href
)

process.exitCode = await runLint(process.argv.slice(2))
