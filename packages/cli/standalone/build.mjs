// Keep package boundaries and native assets intact; bundling these modules would
// break createRequire(), dynamic native loaders, and spawned sibling entries.
import { createHash } from 'node:crypto'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { join, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const scratch = process.env.XPLAT_BUILD_TMP ?? join(tmpdir(), 'octane-xplat')
mkdirSync(scratch, { recursive: true })
const staging = mkdtempSync(join(scratch, 'executable-'))
const payload = join(staging, 'payload')
const packages = new Map()
const links = []
mkdirSync(payload)

function packageRoot(name, from) {
	// Resolve the manifest without relying on a package exporting package.json.
	const require = createRequire(join(from, 'package.json'))
	for (const search of require.resolve.paths(name) ?? []) {
		const candidate = join(search, name)
		if (existsSync(join(candidate, 'package.json'))) {
			return realpathSync(candidate)
		}
	}
	throw new Error(`Cannot resolve production dependency ${name} from ${from}`)
}

function collect(source) {
	source = realpathSync(source)
	if (packages.has(source)) {
		return packages.get(source)
	}
	const id = `packages/${packages.size}`
	packages.set(source, id)
	const destination = join(payload, id)
	const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
	const entries = source.startsWith(resolve(root, '..') + sep) ? (manifest.files ?? ['.']) : ['.']
	// Copy published files for workspace packages, including notices. Registry
	// packages already contain only published files. Never follow node_modules.
	for (const entry of new Set([
		...entries.filter((p) => !p.startsWith('!')),
		'package.json',
		'README.md',
		'LICENSE',
	])) {
		const path = join(source, entry)
		if (!existsSync(path)) {
			continue
		}

		cpSync(path, join(destination, entry), {
			recursive: true,
			dereference: true,
			filter: (p) =>
				!['node_modules', '.git'].includes(p.split(/[\\/]/).at(-1)) &&
				!['xplat', 'xplat.exe'].some((name) => p === join(root, 'dist', name)),
		})
	}
	for (const name of new Set([
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.optionalDependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
	])) {
		let dependency
		try {
			dependency = packageRoot(name, source)
		} catch (error) {
			if (
				name in (manifest.optionalDependencies ?? {}) ||
				manifest.peerDependenciesMeta?.[name]?.optional
			) {
				continue
			}

			throw error
		}

		links.push([`${id}/node_modules/${name}`, collect(dependency)])
	}
	return id
}

try {
	const entry = collect(root)
	cpSync(resolve(root, '../../LICENSE'), join(payload, 'LICENSE'))
	writeFileSync(join(payload, 'layout.json'), JSON.stringify({ entry, links }))
	const archive = join(staging, 'payload.tar.gz')
	execFileSync('tar', ['-czf', archive, '-C', payload, '.'])
	const hash = createHash('sha256').update(readFileSync(archive)).digest('hex')
	const launcher = readFileSync(new URL('./launcher.mjs', import.meta.url), 'utf8')
		.replace(/['"]XPLAT_PAYLOAD['"]/, JSON.stringify(archive))
		.replace(/['"]XPLAT_PAYLOAD_HASH['"]/, JSON.stringify(hash))

	const source = join(staging, 'launcher.mjs')
	writeFileSync(source, launcher)
	const outfile = resolve(root, 'dist', process.platform === 'win32' ? 'xplat.exe' : 'xplat')
	const result = await Bun.build({
		entrypoints: [source],
		compile: { outfile, autoloadDotenv: false, autoloadBunfig: false },
		target: 'bun',
	})

	if (!result.success) {
		throw new AggregateError(result.logs, 'Executable compilation failed')
	}

	console.log(`Built ${outfile} (${process.platform}-${process.arch}; ${packages.size} packages)`)
} finally {
	rmSync(staging, { recursive: true, force: true })
}
