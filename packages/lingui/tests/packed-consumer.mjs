import { build } from 'vite'
import { checkIntlBundle } from '../../../scripts/intl-test-utils.mjs'
// Real tarball installation: the workspace extraction test's symlink can hide
// Node's unsupported TypeScript stripping inside node_modules.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = mkdtempSync(join(tmpdir(), 'xplat-lingui-consumer-'))
function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
	assert.equal(result.status, 0, result.stdout + result.stderr)
}

try {
	const pack = join(temporary, 'pack')
	const app = join(temporary, 'app')
	mkdirSync(pack)
	cpSync(join(root, 'tests/fixture'), app, {
		recursive: true,
		filter: (path) => !path.includes('node_modules') && !path.includes('/locales'),
	})

	run('bun', ['pm', 'pack', '--destination', pack], root)
	const archive = readdirSync(pack).find((name) => name.endsWith('.tgz'))

	// The packed lingui's `workspace:*` dep on @octane-xplat/jsx resolves to the
	// pending release version — pin the in-repo pack.
	const jsxPack = join(temporary, 'jsx-pack')
	mkdirSync(jsxPack)
	run('bun', ['pm', 'pack', '--destination', jsxPack], join(root, '../jsx'))
	const jsxArchive = readdirSync(jsxPack).find((name) => name.endsWith('.tgz'))

	const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	const octane = JSON.parse(readFileSync(join(root, 'node_modules/octane/package.json'), 'utf8'))
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({
			private: true,
			type: 'module',
			dependencies: {
				'@octane-xplat/lingui': `file:${join(pack, archive)}`,
				'@lingui/cli': manifest.devDependencies['@lingui/cli'],
				'@lingui/format-json': manifest.devDependencies['@lingui/format-json'],
				octane: octane.version,
				'@tsrx/oxc': octane.peerDependencies['@tsrx/oxc'],
			},
			overrides: { '@octane-xplat/jsx': `file:${join(jsxPack, jsxArchive)}` },
		}),
	)

	run('bun', ['install', '--ignore-scripts', '--no-peer'], app)
	writeFileSync(
		join(app, 'check.mjs'),
		`
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
const entry = import.meta.resolve('@octane-xplat/lingui/extractor')
assert.match(realpathSync(new URL(entry)), /node_modules/)
assert.match(entry, /\\.js$/)
const { tsrxExtractor, babelExtractor } = await import('@octane-xplat/lingui/extractor')
assert.equal(tsrxExtractor.match('src/app.tsrx'), true)
assert.equal(typeof babelExtractor.extract, 'function')
`,
	)

	run(process.execPath, ['check.mjs'], app)
	await checkIntlBundle(build, {
		root: app,
		source: `import '@octane-xplat/lingui/locales/de'; export { initLingui, i18n } from '@octane-xplat/lingui'`,
		check: `
   await leaf.initLingui({locale:'de', catalogs:{de:async () => ({messages:{}})}})
   assert.equal(leaf.i18n.number(1234.5), '1.234,5')
   assert.equal(typeof Intl.Segmenter, 'undefined')
   assert.equal(typeof Intl.RelativeTimeFormat, 'undefined')
  `,
	})
	// Invoke the CLI entrypoint directly: `bun run lingui` resolves the .bin
	// shim, where commander's `lingui extract` file-subcommand lookup fails.
	const require = createRequire(join(app, 'package.json'))
	const linguiDist = dirname(require.resolve('@lingui/cli'))
	run(process.execPath, [join(linguiDist, 'lingui.js'), 'extract'], app)
	const catalog = JSON.parse(readFileSync(join(app, 'locales/en/messages.json'), 'utf8'))
	const entries = Object.values(catalog)
	assert.ok(entries.some((entry) => entry.message === 'Extraction control from tsx'))
	const probe = entries.find((entry) => entry.message === 'Extraction probe from tsrx')
	assert.ok(probe, 'packed extractor finds TSRX message')
	const authoredLine =
		readFileSync(join(app, 'src/app.tsrx'), 'utf8')
			.split('\n')
			.findIndex((line) => line.includes('t`Extraction probe from tsrx`')) + 1
	assert.ok(authoredLine > 0)
	assert.deepEqual(probe.origin, [['src/app.tsrx', authoredLine]])
	console.log('lingui packed consumer: plain Node import, extraction, and authored origins passed')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
