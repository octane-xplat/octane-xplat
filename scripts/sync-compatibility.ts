#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	compatibility,
	dependencySections,
	managedCatalog,
	managedPackage,
	managedSpecifier,
} from '../packages/create/compatibility.ts'

import { lockstepPackages } from './publishable.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

export function syncCompatibility(check = false) {
	const stale: string[] = []
	const sync = (path: string, after: string) => {
		const before = readFileSync(join(repo, path), 'utf8')
		if (before !== after) {
			stale.push(path)
			if (!check) {
				writeFileSync(join(repo, path), after)
			}
		}
	}

	const framework: { name: string; version: string }[] = lockstepPackages(repo)
	for (const pkg of framework) {
		if (pkg.version !== compatibility.frameworkVersion) {
			throw new Error(
				`${pkg.name}@${pkg.version} differs from compatibility set ${compatibility.frameworkVersion}`,
			)
		}
	}

	compatibility.frameworkPackages = framework.map((pkg) => pkg.name).sort()
	sync('packages/create/compatibility.json', JSON.stringify(compatibility, null, '\t') + '\n')
	for (const template of ['template', 'library-template']) {
		const base = `packages/create/${template}`
		const pkg = JSON.parse(readFileSync(join(repo, base, 'package.json'), 'utf8'))
		const ws = (pkg.workspaces ??= { packages: [] })
		const pins: Record<string, string> = {}
		for (const section of dependencySections) {
			for (const name of Object.keys(pkg[section] ?? {})) {
				if (!managedPackage(name)) {
					continue
				}

				pkg[section][name] = `catalog:${managedCatalog()}`
				pins[name] = managedSpecifier(name)!
				delete ws.catalog?.[name]
			}
		}

		for (const name of Object.keys(pkg.peerDependencies ?? {})) {
			if (compatibility.frameworkPackages.includes(name)) {
				pkg.peerDependencies[name] = `^${compatibility.frameworkVersion}`
			}
		}

		pkg.packageManager = `bun@${compatibility.tools.bun}`
		pkg.engines = {
			...pkg.engines,
			node: `>=${compatibility.tools.nodeMinimum}`,
			bun: `>=${compatibility.tools.bun}`,
		}
		ws.catalogs ??= {}
		ws.catalogs[managedCatalog()] = Object.fromEntries(Object.entries(pins).sort())
		for (const [selector, version] of Object.entries(compatibility.overrides)) {
			pkg.overrides ??= {}
			pkg.overrides[selector] = version
		}

		sync(`${base}/package.json`, JSON.stringify(pkg, null, '\t') + '\n')
	}

	return stale
}

if (
	process.argv[1] &&
	existsSync(process.argv[1]) &&
	fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
) {
	const check = process.argv.includes('--check')
	const stale = syncCompatibility(check)
	if (stale.length) {
		console.error(`${check ? 'compatibility drift' : 'synced'}: ${stale.join(', ')}`)
		if (check) {
			console.error('Run bun run sync:compatibility to regenerate the starter pins.')
			process.exitCode = 1
		}
	} else {
		console.log('compatibility set in sync')
	}
}
