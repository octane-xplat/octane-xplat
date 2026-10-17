#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Prefer the emitted dist/ build (published tarballs); fall back to src/ so
// in-repo runs work before a build exists (Node ≥22.18 strips types).
const distEntry = fileURLToPath(new URL('../dist/lint-tsrx.js', import.meta.url))
const sourceRoot = existsSync(distEntry)
	? new URL('../dist/', import.meta.url)
	: new URL('../src/', import.meta.url)
const ext = sourceRoot.pathname.endsWith('/dist/') ? '.js' : '.ts'

const { resolveBin } = await import(new URL(`resolve-bin${ext}`, sourceRoot).href)

const shouldFix = process.argv.includes('--fix')
const oxlintBin = resolveBin('oxlint')
// Resolved binaries run under node directly so an unresolved shebang or PATH
// entry is not required; fall back to a bare spawn when resolution fails.
const oxlint = oxlintBin
	? spawnSync(process.execPath, [oxlintBin, ...(shouldFix ? ['--fix'] : [])], { stdio: 'inherit' })
	: spawnSync('oxlint', shouldFix ? ['--fix'] : [], { stdio: 'inherit' })

const tsrx = spawnSync(
	process.execPath,
	[fileURLToPath(new URL(`lint-tsrx${ext}`, sourceRoot))],
	{ stdio: 'inherit' },
)

if (oxlint.error) {
	console.error(oxlint.error.message)
}

if (tsrx.error) {
	console.error(tsrx.error.message)
}

if (oxlint.status !== 0 || tsrx.status !== 0) {
	process.exitCode = 1
}
