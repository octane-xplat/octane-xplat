// End-to-end: run the real `lingui extract` CLI over a fixture containing one
// .tsrx probe and one .tsx control, and assert both messages land in the
// catalog. This is the gap the leaf's ./extractor subpath exists to close —
// without tsrxExtractor the .tsrx message is silently skipped. The fixture
// imports the package specifier through a scoped node_modules symlink, so the
// published exports map is exercised too.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const pkgDir = fileURLToPath(new URL('..', import.meta.url))
const fixture = fileURLToPath(new URL('./fixture', import.meta.url))
const scopeDir = `${fixture}/node_modules/@octane-xplat`
const catalogPath = `${fixture}/locales/en/messages.json`
const linguiBin = fileURLToPath(
	new URL('../node_modules/@lingui/cli/dist/lingui.js', import.meta.url),
)

test('lingui extract finds messages in .tsrx via tsrxExtractor', () => {
	mkdirSync(scopeDir, { recursive: true })
	symlinkSync(pkgDir, `${scopeDir}/lingui`, 'junction')
	mkdirSync(`${fixture}/locales`, { recursive: true })
	try {
		execFileSync(process.execPath, [linguiBin, 'extract'], { cwd: fixture })
		assert.ok(existsSync(catalogPath), 'catalog written')
		const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
		const messages = Object.values(catalog).map((entry) => entry.message)
		assert.ok(messages.includes('Extraction control from tsx'), 'tsx control extracted')
		assert.ok(messages.includes('Extraction probe from tsrx'), 'tsrx message extracted')
		// Origins must point at the authored .tsrx line — the extractor feeds
		// compile()'s sourcemap to Lingui so compiled-output lines don't leak.
		const tsrxEntry = Object.values(catalog).find(
			(entry) => entry.message === 'Extraction probe from tsrx',
		)

		assert.deepEqual(tsrxEntry.origin, [['src/app.tsrx', 8]])
	} finally {
		rmSync(`${fixture}/locales`, { recursive: true, force: true })
		rmSync(`${fixture}/node_modules`, { recursive: true, force: true })
	}
})
