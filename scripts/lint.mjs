import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const recipes = spawnSync(
	process.execPath,
	[fileURLToPath(new URL('./check-recipes.mjs', import.meta.url))],
	{ stdio: 'inherit' },
)

const shouldFix = process.argv.includes('--fix')
const oxlint = spawnSync('oxlint', shouldFix ? ['--fix'] : [], { stdio: 'inherit' })
const tsrxArgs = [fileURLToPath(new URL('./lint-tsrx.mjs', import.meta.url))]
if (shouldFix) {
	tsrxArgs.push('--fix')
}

const tsrx = spawnSync(process.execPath, tsrxArgs, { stdio: 'inherit' })
const css = spawnSync('node', [fileURLToPath(new URL('./check-css.mjs', import.meta.url))], {
	stdio: 'inherit',
})

if (recipes.error) {
	console.error(recipes.error.message)
}

if (oxlint.error) {
	console.error(oxlint.error.message)
}

if (tsrx.error) {
	console.error(tsrx.error.message)
}

if (css.error) {
	console.error(css.error.message)
}

if (recipes.status !== 0 || oxlint.status !== 0 || tsrx.status !== 0 || css.status !== 0) {
	process.exitCode = 1
}
