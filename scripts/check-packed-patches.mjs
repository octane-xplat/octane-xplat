// Check the artifact without prepack repairing stale generated files first.
// --install also exercises pnpm's configDependencies fetch, integrity check,
// extraction, lockfile generation, and patch application outside the workspace.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, parseAllDocuments, stringify } from 'yaml'
import { compatibility } from '../packages/create/compatibility.ts'
import {
	composeManifest,
	composeWorkspaceYaml,
	defaultTargets,
} from '../packages/create/scaffold.ts'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageDir = join(repo, 'packages/patches')
const canonical = join(repo, 'packages/cli/patches')
const name = '@octane-xplat/patches'
const prefix = `node_modules/.pnpm-config/${name}/`
const work = mkdtempSync(join(tmpdir(), 'xplat-packed-patches-'))
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const manifest = json(join(canonical, 'manifest.json')).patches

async function run(command, args, cwd) {
	const child = spawn(command, args, { cwd, stdio: 'inherit' })
	const [code] = await once(child, 'exit')
	assert.equal(code, 0, `${command} ${args.join(' ')} failed`)
}

function checkConfig(label, config, packed, version) {
	assert.equal(config.configDependencies?.[name], version, `${label}: config package version`)
	for (const [specifier, path] of Object.entries(config.patchedDependencies)) {
		assert.ok(path.startsWith(prefix), `${label}: unexpected patch path ${path}`)
		const patch = manifest.find((entry) => entry.specifier === specifier)
		assert.ok(patch, `${label}: ${specifier} is absent from the canonical manifest`)
		assert.equal(path, `${prefix}patches/${patch.file}`, `${label}: ${specifier} path`)
		assert.deepEqual(
			readFileSync(join(packed, path.slice(prefix.length))),
			readFileSync(join(canonical, patch.file)),
			`${label}: ${specifier} packed bytes differ`,
		)
		const at = specifier.lastIndexOf('@')
		const pin = compatibility.packages[specifier.slice(0, at)]
		if (pin) {
			assert.equal(specifier.slice(at + 1), pin.version, `${label}: incompatible patch pin`)
		}
	}
}

async function install(packed, tarball, version, config) {
	const bytes = readFileSync(tarball)
	const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
	let metadataRequests = 0
	let tarballRequests = 0
	// Only this config package is unpublished. Other scoped dependencies (Mason
	// core) and every upstream package still resolve from the public registry.
	const registry = createServer(async (request, response) => {
		try {
			const path = decodeURIComponent(request.url).toLowerCase()
			if (path === '/patches.tgz') {
				tarballRequests++
				response.end(bytes)
			} else if (path === `/${name}`) {
				metadataRequests++
				response.setHeader('content-type', 'application/json')
				response.end(
					JSON.stringify({
						name,
						'dist-tags': { latest: version },
						versions: {
							[version]: { name, version, dist: { integrity, tarball: `${url}/patches.tgz` } },
						},
					}),
				)
			} else {
				const upstream = await fetch(`https://registry.npmjs.org${request.url}`)
				response.writeHead(upstream.status, { 'content-type': 'application/json' })
				response.end(await upstream.text())
			}
		} catch (error) {
			response.writeHead(500)
			response.end(String(error))
		}
	})
	registry.listen(0, '127.0.0.1')
	await once(registry, 'listening')
	const url = `http://127.0.0.1:${registry.address().port}`
	try {
		const consumer = join(work, 'consumer')
		mkdirSync(consumer)
		const app = composeManifest(defaultTargets)
		// Isolate the upstream native dependency/patch contract. Framework runtime
		// tarballs are tested by verify-consumer; using their previous registry
		// release here would mix compatibility sets again.
		const dependencies = Object.fromEntries(
			Object.entries({ ...app.dependencies, ...app.devDependencies }).filter(
				([dep]) => !compatibility.frameworkPackages.includes(dep),
			),
		)
		// Optional patches must be applied too, rather than silently unused.
		for (const specifier of Object.keys(config.patchedDependencies)) {
			const at = specifier.lastIndexOf('@')
			dependencies[specifier.slice(0, at)] = specifier.slice(at + 1)
		}
		writeFileSync(
			join(consumer, 'package.json'),
			JSON.stringify({
				private: true,
				packageManager: app.packageManager,
				dependencies,
			}),
		)
		writeFileSync(join(consumer, '.npmrc'), `@octane-xplat:registry=${url}/\n`)
		writeFileSync(
			join(consumer, 'pnpm-workspace.yaml'),
			stringify({
				...config,
				storeDir: join(work, 'store'),
				cacheDir: join(work, 'cache'),
			}),
		)
		await run('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], consumer)
		await run('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], consumer)
		assert.ok(metadataRequests > 0, 'pnpm did not resolve the config package from the registry')
		assert.ok(tarballRequests > 0, 'pnpm did not download the config package tarball')
		checkConfig('installed native config', config, join(consumer, prefix), version)
		const lock = Object.assign(
			{},
			...parseAllDocuments(readFileSync(join(consumer, 'pnpm-lock.yaml'), 'utf8')).map((doc) =>
				doc.toJS(),
			),
		)
		for (const specifier of Object.keys(config.patchedDependencies)) {
			const entry = lock.patchedDependencies?.[specifier]
			const hash = typeof entry === 'string' ? entry : entry?.hash
			assert.ok(hash, `${specifier}: no locked patch hash`)
			assert.ok(
				Object.keys(lock.snapshots ?? {}).some(
					(key) => key.startsWith(`${specifier}(`) && key.includes(`patch_hash=${hash}`),
				),
				`${specifier}: patch was not applied to an installed dependency`,
			)
		}
		assert.deepEqual(
			readFileSync(join(consumer, prefix, 'package.json')),
			readFileSync(join(packed, 'package.json')),
		)
		console.log(
			'Registry-style native upstream install passed (scripts disabled; no device build).',
		)
	} finally {
		await new Promise((done) => registry.close(done))
	}
}

try {
	await run(
		'pnpm',
		['--config.ignore-scripts=true', 'pack', '--pack-destination', work],
		packageDir,
	)
	const tarball = join(
		work,
		readdirSync(work).find((file) => file.endsWith('.tgz')),
	)
	await run('tar', ['-xzf', tarball, '-C', work], work)
	const packed = join(work, 'package')
	const pkg = json(join(packed, 'package.json'))
	assert.equal(pkg.name, name)
	assert.equal(pkg.version, compatibility.frameworkVersion, 'packed compatibility version')
	assert.deepEqual(
		readdirSync(join(packed, 'patches')).sort(),
		manifest.map((p) => p.file).sort(),
		'packed patch inventory differs from the canonical manifest',
	)
	for (const patch of manifest) {
		assert.deepEqual(
			readFileSync(join(packed, 'patches', patch.file)),
			readFileSync(join(canonical, patch.file)),
			`${patch.specifier}: packed bytes differ`,
		)
	}
	for (const template of ['template', 'library-template']) {
		const path = join(repo, 'packages/create', template, 'pnpm-workspace.yaml')
		checkConfig(relative(repo, path), parse(readFileSync(path, 'utf8')), packed, pkg.version)
	}
	const native = parse(composeWorkspaceYaml(defaultTargets))
	checkConfig('generated default native config', native, packed, pkg.version)
	console.log(
		`Packed ${name}@${pkg.version}: ${manifest.length} canonical patches; all starter/native references verified.`,
	)
	if (process.argv.includes('--install')) {
		await install(packed, tarball, pkg.version, native)
	}
} finally {
	rmSync(work, { recursive: true, force: true })
}
