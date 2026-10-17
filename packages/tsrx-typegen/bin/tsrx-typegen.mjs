#!/usr/bin/env node
// Prefer the emitted dist/ build (published tarballs); fall back to src/ so
// in-repo typegen needs no build step (Node ≥22.18 strips types).
import { existsSync } from 'node:fs'

const dist = new URL('../dist/cli.js', import.meta.url)
if (existsSync(dist)) {
	await import(dist.href)
} else {
	await import(new URL('../src/cli.ts', import.meta.url).href)
}
