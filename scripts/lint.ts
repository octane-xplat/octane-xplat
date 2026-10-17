// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// CI runs structural checks separately and keeps recipes in the PR job.
const codeOnly = process.argv.includes('--code-only')
const recipes = codeOnly
	? null
	: spawnSync(process.execPath, [fileURLToPath(new URL('./check-recipes.ts', import.meta.url))], {
			stdio: 'inherit',
		})

const shouldFix = process.argv.includes('--fix')
const oxlint = spawnSync('oxlint', shouldFix ? ['--fix'] : [], { stdio: 'inherit' })
const tsrx = spawnSync(
	process.execPath,
	[fileURLToPath(new URL('./lint-tsrx.ts', import.meta.url))],
	{ stdio: 'inherit' },
)

const css = codeOnly
	? null
	: spawnSync('node', [fileURLToPath(new URL('./check-css.ts', import.meta.url))], {
			stdio: 'inherit',
		})

if (recipes?.error) {
	console.error(recipes.error.message)
}

if (oxlint.error) {
	console.error(oxlint.error.message)
}

if (tsrx.error) {
	console.error(tsrx.error.message)
}

if (css?.error) {
	console.error(css.error.message)
}

if ([recipes, oxlint, tsrx, css].some((result) => result && result.status !== 0)) {
	process.exitCode = 1
}
