import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const dirs = []

const track = (path) => {
	dirs.push(path)
	return path
}

const makePnpmApp = () => {
	// tmpdir() is a symlinked path on macOS (/var → /private/var); the fallback
	// realpaths the importer, so realpath the root to keep expectations exact.
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-rewrite-imports-'))))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }))
	const siblingDir = join(root, 'node_modules/.pnpm/a@1/node_modules')
	mkdirSync(join(siblingDir, 'a'), { recursive: true })
	writeFileSync(join(siblingDir, 'a/package.json'), JSON.stringify({ name: 'a' }))
	writeFileSync(join(siblingDir, 'a/x.js'), 'import "dep"\n')
	mkdirSync(join(siblingDir, 'dep'), { recursive: true })
	writeFileSync(join(siblingDir, 'dep/package.json'), JSON.stringify({ name: 'dep', main: './index.js' }))
	writeFileSync(join(siblingDir, 'dep/index.js'), '')
	writeFileSync(join(siblingDir, 'dep/sub.js'), '')
	symlinkSync(join(siblingDir, 'a'), join(root, 'node_modules/a'), 'dir')
	return { root, depDir: join(siblingDir, 'dep') }
}

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

const nsEntry = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { rewriteImports } = await import(new URL('./hmr/server/rewrite-imports.js', nsEntry))

describe('bare npm package fallback resolution under pnpm', () => {
	it('anchors a sibling-only spec at the importer realpath via /ns/m/@fs', () => {
		const { root, depDir } = makePnpmApp()
		const importerPath = '/node_modules/a/x.js'
		const out = rewriteImports('import "dep"', importerPath, new Map(), new Map(), root)
		assert.equal(out, `import "/ns/m/@fs${depDir}"`)
	})

	it('appends the subpath to the /ns/m/@fs package root', () => {
		const { root, depDir } = makePnpmApp()
		const importerPath = '/node_modules/a/x.js'
		const out = rewriteImports('import "dep/sub.js"', importerPath, new Map(), new Map(), root)
		assert.equal(out, `import "/ns/m/@fs${depDir}/sub.js"`)
	})

	it('keeps /ns/m/node_modules/<spec> for an app-resolvable bare spec', () => {
		const { root } = makePnpmApp()
		mkdirSync(join(root, 'node_modules/installed'), { recursive: true })
		writeFileSync(
			join(root, 'node_modules/installed/package.json'),
			JSON.stringify({ name: 'installed', main: './index.js' }),
		)
		writeFileSync(join(root, 'node_modules/installed/index.js'), '')
		const importerPath = '/node_modules/a/x.js'
		const out = rewriteImports('import "installed"', importerPath, new Map(), new Map(), root)
		assert.equal(out, 'import "/ns/m/node_modules/installed"')
	})
})
