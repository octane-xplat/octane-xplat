#!/usr/bin/env node
// Prefer the emitted dist/ build (published tarballs); fall back to src/ so
// in-repo runs work before a build exists (Node ≥22.18 strips types). The
// fallback never fires inside node_modules — dist ships in the tarball.
import { existsSync } from 'node:fs'

const dist = new URL('../dist/cli.js', import.meta.url)
if (existsSync(dist)) {
	await import(dist.href)
} else {
	await import(new URL('../src/cli.ts', import.meta.url).href)
}
