#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolveBin } from '../src/resolve-bin.mjs'

const shouldFix = process.argv.includes('--fix')
const oxlintBin = resolveBin('oxlint')
// Resolved binaries run under node directly so an unresolved shebang or PATH
// entry is not required; fall back to a bare spawn when resolution fails.
const oxlint = oxlintBin
	? spawnSync(process.execPath, [oxlintBin, ...(shouldFix ? ['--fix'] : [])], { stdio: 'inherit' })
	: spawnSync('oxlint', shouldFix ? ['--fix'] : [], { stdio: 'inherit' })

const tsrxArgs = [fileURLToPath(new URL('../src/lint-tsrx.mjs', import.meta.url))]
if (shouldFix) {
	tsrxArgs.push('--fix')
}

const tsrx = spawnSync(process.execPath, tsrxArgs, { stdio: 'inherit' })

if (oxlint.error) {
	console.error(oxlint.error.message)
}

if (tsrx.error) {
	console.error(tsrx.error.message)
}

if (oxlint.status !== 0 || tsrx.status !== 0) {
	process.exitCode = 1
}
