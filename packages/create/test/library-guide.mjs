/** Focused app/library artifact qualification. No devices, browsers or images. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = mkdtempSync(join(tmpdir(), 'xplat-library-guide-'))
const pack = join(work, 'pack')
mkdirSync(pack)
function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
	if (result.stdout && args[1] !== 'pack' && args[0] !== '-tzf') {
		process.stdout.write(result.stdout)
	}
	if (result.stderr) {
		process.stderr.write(result.stderr)
	}
	assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
	return result.stdout
}
const tarballs = new Map()
function packPackage(root) {
	const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', pack], root)
	const path = join(
		pack,
		`${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
	)
	tarballs.set(manifest.name, path)
	return path
}
function prepare(root) {
	const path = join(root, 'pnpm-workspace.yaml')
	const config = parseDocument(readFileSync(path, 'utf8'))
	const patches = join(root, 'node_modules/.pnpm-config/@octane-xplat/patches')
	mkdirSync(patches, { recursive: true })
	run(
		'tar',
		['-xzf', tarballs.get('@octane-xplat/patches'), '-C', patches, '--strip-components=1'],
		work,
	)
	config.delete('configDependencies')
	for (const [name, path] of tarballs) {
		config.setIn(['overrides', name], `file:${path}`)
	}
	writeFileSync(path, String(config))
	run('pnpm', ['install'], root)
}
try {
	for (const dir of [
		'create',
		'cli',
		'lib',
		'ui',
		'jsx',
		'platform',
		'patches',
		'tsrx-typegen',
		'lint',
	]) {
		packPackage(join(repo, 'packages', dir))
	}
	writeFileSync(
		join(work, 'package.json'),
		JSON.stringify({
			private: true,
			dependencies: { 'create-octane-xplat': `file:${tarballs.get('create-octane-xplat')}` },
		}),
	)
	writeFileSync(join(work, 'pnpm-workspace.yaml'), 'packages: []\n')
	run('pnpm', ['install', '--ignore-scripts'], work)
	const creator = join(work, 'node_modules/create-octane-xplat/dist/index.js')
	const library = join(work, 'travel-controls')
	const app = join(work, 'travel-app')
	run(
		process.execPath,
		[
			creator,
			library,
			'--template',
			'library',
			'--name',
			'@example/travel-controls',
			'--no-install',
		],
		work,
	)
	// A non-code asset must survive the same source files whitelist.
	mkdirSync(join(library, 'src/assets'))
	writeFileSync(join(library, 'src/assets/packing.txt'), 'Passport\nCharger\n')
	prepare(library)
	for (const task of ['typegen', 'typecheck', 'lint', 'test', 'test:packed']) {
		run('pnpm', [task], library)
	}
	run('pnpm', ['exec', 'tsrx-typegen', '--target', 'octane', '--check'], library)
	const artifact = packPackage(library)
	const listing = run('tar', ['-tzf', artifact], work)
	for (const path of [
		'package/src/Badge.tsx',
		'package/src/Badge.web.tsx',
		'package/types/index.d.ts',
		'package/types/index.web.d.ts',
		'package/src/assets/packing.txt',
	]) {
		assert.ok(listing.includes(path), `missing ${path}`)
	}
	run(process.execPath, [creator, app, '--targets', 'web', '--no-install'], work)
	const manifestPath = join(app, 'package.json')
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	manifest.dependencies['@example/travel-controls'] = `file:${artifact}`
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
	writeFileSync(
		join(app, 'src/main.web.tsrx'),
		`/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { Badge } from '@example/travel-controls'
createRoot(document.getElementById('root')!).render(<Badge label="Packed library ready" />)
`,
	)
	const viteConfig = join(app, 'vite.config.ts')
	writeFileSync(
		viteConfig,
		readFileSync(viteConfig, 'utf8').replace(
			'plugins: [',
			`plugins: [{
 name: 'qualify-installed-library-leaf',
 generateBundle() {
  const modules = [...this.getModuleIds()].filter(id => id.includes('/@example/travel-controls/src/'))
  if (!modules.some(id => id.endsWith('/Badge.web.tsx')) || modules.some(id => id.endsWith('/Badge.tsx'))) {
   throw new Error('The consuming web app did not select the installed browser library leaf')
  }
 }
}, `,
		),
	)
	prepare(app)
	for (const task of ['typecheck', 'build']) {
		run('pnpm', [task], app)
	}
	const output = readdirSync(join(app, 'dist/assets'))
		.filter((name) => name.endsWith('.js'))
		.map((name) => readFileSync(join(app, 'dist/assets', name), 'utf8'))
		.join('\n')
	assert.ok(
		output.includes('Packed library ready'),
		'installed library was not compiled into the web bundle',
	)
	console.log(
		'PASS library guide: packed creator, isolated install, generated types, four plain TypeScript consumers, packed source/assets and consuming web production build. No native/browser runtime qualification.',
	)
} finally {
	rmSync(work, { recursive: true, force: true })
}
