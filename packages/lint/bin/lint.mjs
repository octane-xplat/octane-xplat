import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const shouldFix = process.argv.includes('--fix')
const oxlint = spawnSync('oxlint', shouldFix ? ['--fix'] : [], { stdio: 'inherit' })
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
