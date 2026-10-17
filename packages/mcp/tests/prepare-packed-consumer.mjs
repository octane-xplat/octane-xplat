// Prepare an independent consumer that installs PACKED framework tarballs —
// the release-artifact counterpart to prepare-consumer.mjs, which link:s this
// checkout. The packed @octane-xplat/mcp bin is what the stdio lane spawns.
//
// Produces <work>/app (consumer), <work>/pack (tarballs),
// <work>/release-fixture.git (local release repo tagged v<installed version>
// at the current framework HEAD — docs snapshots bind it exactly), and
// <work>/packed-consumer.json (manifest consumed by packed-stdio-consumer.mjs).
//
// Usage: node tests/prepare-packed-consumer.mjs <new-work-dir>
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const work = process.argv[2] && resolve(process.argv[2])
if (!work || existsSync(work)) {
	throw new Error(
		'Supply a new directory: node tests/prepare-packed-consumer.mjs /tmp/xplat-packed-mcp',
	)
}

const frameworkRoot = fileURLToPath(new URL('../../../', import.meta.url))
const packDir = join(work, 'pack')
const extractDir = join(work, 'create')
const appDir = join(work, 'app')
const fixtureDir = join(work, 'release-fixture.git')
mkdirSync(packDir, { recursive: true })
mkdirSync(extractDir, { recursive: true })

const run = (command, argv, cwd = work) => {
	const result = spawnSync(command, argv, { cwd, encoding: 'utf8' })
	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(
			`${command} ${argv.join(' ')} exited ${result.status}:\n${result.stdout}\n${result.stderr}`,
		)
	}

	return result.stdout
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const packageDirFor = (name) =>
	name === 'create-octane-xplat'
		? 'create'
		: name === 'tsrx-typegen'
			? 'tsrx-typegen'
			: name.replace(/^@octane-xplat\//, '')

// ---- scaffold via the packed create bin ------------------------------------
const createPkg = readJson(join(frameworkRoot, 'packages/create/package.json'))
run('pnpm', ['pack', '--pack-destination', packDir], join(frameworkRoot, 'packages/create'))
const tarballName = (pkg) => `${pkg.name.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`
const createTarball = join(packDir, tarballName(createPkg))
run('tar', ['-xzf', createTarball, '-C', extractDir])
run('node', [join(extractDir, 'package', 'dist', 'index.js'), appDir, '--no-install', '--targets', 'web'])

// ---- package closure: app deps + what they install --------------------------
const appManifestPath = join(appDir, 'package.json')
const manifest = readJson(appManifestPath)
const SEED_EXTRAS = ['@octane-xplat/mcp', '@octane-xplat/patches']
const needed = new Set()
const queue = []
for (const section of ['dependencies', 'devDependencies']) {
	for (const name of Object.keys(manifest[section] ?? {})) {
		if (name.startsWith('@octane-xplat/')) {
			queue.push(name)
		}
	}
}

queue.push(...SEED_EXTRAS)
// Dependencies of packed packages install into the consumer too; walk only
// sections consumers resolve (dependencies/peers/optional, not devDeps).
while (queue.length) {
	const name = queue.shift()
	if (needed.has(name)) {
		continue
	}

	const dir = join(frameworkRoot, 'packages', packageDirFor(name))
	if (!existsSync(join(dir, 'package.json'))) {
		continue
	}

	needed.add(name)
	const pkg = readJson(join(dir, 'package.json'))
	for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
		for (const dep of Object.keys(pkg[section] ?? {})) {
			if (
				dep.startsWith('@octane-xplat/') ||
				dep === 'create-octane-xplat' ||
				dep === 'tsrx-typegen'
			) {
				queue.push(dep)
			}
		}
	}
}

// ---- pack the closure --------------------------------------------------------
const tarballs = new Map()
for (const name of [...needed].sort()) {
	const dir = join(frameworkRoot, 'packages', packageDirFor(name))
	const pkg = readJson(join(dir, 'package.json'))
	run('pnpm', ['pack', '--pack-destination', packDir], dir)
	const tarball = join(packDir, tarballName(pkg))
	if (!existsSync(tarball)) {
		throw new Error(`expected tarball ${tarball}`)
	}

	tarballs.set(pkg.name, tarball)
}

console.log(`[prepare] packed ${tarballs.size} tarballs`)

// ---- repoint the consumer at file: tarballs ----------------------------------
let rewritten = 0
for (const section of ['dependencies', 'devDependencies']) {
	for (const dep of Object.keys(manifest[section] ?? {})) {
		if (tarballs.has(dep)) {
			manifest[section][dep] = `file:${tarballs.get(dep)}`
			rewritten++
		}
	}
}

// The private MCP server ships no registry version — install the packed bin.
manifest.devDependencies['@octane-xplat/mcp'] = `file:${tarballs.get('@octane-xplat/mcp')}`
writeFileSync(appManifestPath, JSON.stringify(manifest, null, '\t') + '\n')
console.log(`[prepare] rewrote ${rewritten} deps + @octane-xplat/mcp to file: tarballs`)

// @octane-xplat/patches travels as a configDependency demanding registry
// semver; materialize the tarball where patchedDependencies expects it.
const patchesTarball = tarballs.get('@octane-xplat/patches')
const configDir = join(appDir, 'node_modules', '.pnpm-config', '@octane-xplat', 'patches')
mkdirSync(configDir, { recursive: true })
run('tar', ['-xzf', patchesTarball, '-C', configDir, '--strip-components=1'])
const workspaceFile = join(appDir, 'pnpm-workspace.yaml')
const workspaceYaml = readFileSync(workspaceFile, 'utf8')
const stripped = workspaceYaml.replace(/\n?configDependencies:\n([ \t]+(?!#)\S[^\n]*\n?)+/, '\n')
if (stripped === workspaceYaml) {
	throw new Error('configDependencies rewrite found no entry')
}

const overrides = [...tarballs].map(([name, tarball]) => `  "${name}": file:${tarball}`).join('\n')

writeFileSync(workspaceFile, `${stripped}\noverrides:\n${overrides}\n`)

// ---- install + fixture --------------------------------------------------------
run('pnpm', ['install'], appDir)

const entry = join(appDir, 'src/main.web.tsrx')
writeFileSync(
	entry,
	readFileSync(entry, 'utf8') +
		`
// App-owned acceptance fixture; the production build removes the declaration and handler.
if (import.meta.env.DEV) {
	const { registerDevAction } = await import('@octane-xplat/platform/dev-actions');
	registerDevAction({
		id: 'fixture.describe-counter',
		title: 'Describe the starter counter',
		description: 'Return the bounded starter fixture identity without external effects.',
		result: { fields: { label: { type: 'string' }, controls: { type: 'integer' } } },
		effects: { summary: 'Read fixture identity; changes no app state.' },
		run: () => ({ label: 'starter-counter', controls: 3 }),
	});
	// Nonvisual privacy/ambiguity fixtures for host inspection.
	const privateHost = document.createElement('div');
	privateHost.id = 'fixture.private';
	const privateChild = document.createElement('span');
	privateChild.setAttribute('data-xplat-private', '');
	privateChild.textContent = 'PRIVATE_FIXTURE_VALUE';
	privateHost.append(privateChild);
	privateHost.hidden = true;
	document.body.append(privateHost);
	for (let i = 0; i < 2; i++) {
		const duplicate = document.createElement('span');
		duplicate.setAttribute('data-testid', 'fixture.duplicate');
		duplicate.hidden = true;
		document.body.append(duplicate);
	}
}
`,
)

// A real commit gives session/build provenance a source revision.
run('git', ['init', '-q'], appDir)
run('git', ['add', '-A'], appDir)
run(
	'git',
	[
		'-c',
		'user.name=xplat-packed-consumer',
		'-c',
		'user.email=packed@local',
		'commit',
		'-qm',
		'packed consumer',
	],
	appDir,
)

// ---- release fixture ----------------------------------------------------------
// The installed packages carry the pre-release lockstep version, which has no
// published tag. Build a local release repo whose v<version> tag points at the
// exact framework HEAD these tarballs were packed from: metadata validation
// and docs content both match the installed versions.
const frameworkHead = execFileSync('git', ['-C', frameworkRoot, 'rev-parse', 'HEAD'], {
	encoding: 'utf8',
}).trim()

const uiVersion = readJson(join(frameworkRoot, 'packages/ui/package.json')).version
const releaseTag = `v${uiVersion}`
run('git', ['init', '--bare', '-q', fixtureDir])
run('git', ['-C', frameworkRoot, 'push', '--no-verify', fixtureDir, `HEAD:refs/tags/${releaseTag}`])
const fixtureCommit = execFileSync(
	'git',
	['-C', fixtureDir, 'rev-parse', `refs/tags/${releaseTag}`],
	{ encoding: 'utf8' },
).trim()

const manifest_out = {
	appDir,
	packDir,
	fixtureDir,
	fixtureUrl: `file://${fixtureDir}`,
	releaseTag,
	fixtureCommit,
	frameworkHead,
	frameworkVersion: uiVersion,
	cacheDir: join(work, 'mcp-docs-cache'),
	evidenceDir: join(work, 'evidence'),
	packedTarballs: Object.fromEntries(tarballs),
}

writeFileSync(join(work, 'packed-consumer.json'), JSON.stringify(manifest_out, null, '\t') + '\n')
console.log(
	`[prepare] consumer ${appDir}\n` +
		`[prepare] release fixture ${fixtureDir} tag ${releaseTag} -> ${fixtureCommit}\n` +
		`[prepare] run: node tests/packed-stdio-consumer.mjs ${work}`,
)
