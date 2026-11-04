// Scaffolding policy stays in the project's installed creator; native owns writes.
import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { installedPackageRoot } from './package-root.ts'
import { packageManagerFor } from './package-manager.ts'

export async function addOperation(request: Record<string, any>) {
	const project = realpathSync(process.cwd())
	const root = installedPackageRoot(project, 'create-octane-xplat')
	if (!root) {
		throw new Error(
			`Install create-octane-xplat@${request.frameworkVersion} in the selected project (bun add --dev create-octane-xplat@${request.frameworkVersion}) before enabling platforms`,
		)
	}
	const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	if (pkg.version !== request.frameworkVersion) {
		throw new Error(
			`Platform addition requires create-octane-xplat@${request.frameworkVersion}; the selected project has ${pkg.version}`,
		)
	}
	const require = createRequire(join(project, 'package.json'))
	const load = async (name: string) => {
		const entry = realpathSync(require.resolve('create-octane-xplat/' + name))
		if (!entry.startsWith(root + sep)) {
			throw new Error('Creator module escapes the selected installation')
		}
		return import(pathToFileURL(entry).href)
	}
	const scaffold = await load('scaffold'),
		compatibility = await load('compatibility')
	const workspace = realpathSync(compatibility.compatibilityRoot(project))
	if (
		typeof request.workspaceRoot !== 'string' ||
		realpathSync(request.workspaceRoot) !== workspace ||
		packageManagerFor(project) !== 'bun'
	) {
		throw new Error('Platform additions require the selected Bun workspace identity')
	}
	const data = { version: 1, project, root: workspace, frameworkVersion: pkg.version }
	if (request.operation === 'add-targets') {
		return {
			...data,
			targets: scaffold.selectableTargets.map((id) => ({
				id,
				label: scaffold.targets[id].label,
				note: scaffold.targets[id].note ?? '',
				enabled: scaffold.targetEnabled(project, id),
			})),
		}
	}
	if (request.operation === 'add-plan') {
		if (
			typeof request.target !== 'string' ||
			!scaffold.selectableTargets.includes(request.target)
		) {
			throw new Error('Unknown platform target')
		}

		if (typeof scaffold.planTarget !== 'function') {
			throw new Error('Update the selected creator package to obtain scaffold planning support')
		}

		return { ...data, plan: scaffold.planTarget(project, request.target) }
	}
	if (request.operation === 'add-install') {
		const windows = process.platform === 'win32'
		const result = spawnSync(
			windows ? 'bun install --no-frozen-lockfile' : 'bun',
			windows ? [] : ['install', '--no-frozen-lockfile'],
			{ cwd: project, stdio: 'inherit', shell: windows },
		)

		if (result.error) {
			throw result.error
		}

		return { ...data, exitCode: result.status ?? 1 }
	}
	throw new Error('Unknown platform operation')
}
