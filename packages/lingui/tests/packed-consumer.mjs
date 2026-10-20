// Real tarball installation: the workspace extraction test's symlink can hide
// Node's unsupported TypeScript stripping inside node_modules.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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
	run('pnpm', ['pack', '--pack-destination', pack], root)
	const archive = readdirSync(pack).find((name) => name.endsWith('.tgz'))
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
		}),
	)
	run('pnpm', ['install', '--ignore-scripts', '--config.auto-install-peers=false'], app)
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
	run('pnpm', ['exec', 'lingui', 'extract'], app)
	const catalog = JSON.parse(readFileSync(join(app, 'locales/en/messages.json'), 'utf8'))
	const entries = Object.values(catalog)
	assert.ok(entries.some((entry) => entry.message === 'Extraction control from tsx'))
	const probe = entries.find((entry) => entry.message === 'Extraction probe from tsrx')
	assert.ok(probe, 'packed extractor finds TSRX message')
	assert.deepEqual(probe.origin, [['src/app.tsrx', 8]])
	console.log('lingui packed consumer: plain Node import, extraction, and authored origins passed')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
