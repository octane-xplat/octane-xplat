import { command, flag } from '@alloc/cmd-ts'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { relative } from 'node:path'
import { applyUpgrade, planUpgrade } from '../compatibility.ts'
import { inspectCompatibility } from '../compatibility-check.ts'
import { inspectPatches, patchStateDetail } from '../patches.ts'

// Upstream ambient declarations narrow the process module in this program.
const runtime: NodeJS.Process = createRequire(import.meta.url)('node:process')

export const upgrade = command({
	name: 'upgrade',
	description:
		'Align workspace pins and patches with this CLI release, then install (use pnpm dlx @octane-xplat/cli@<version> upgrade for another release)',
	args: {
		check: flag({
			long: 'check',
			description: 'Preview changes without writing; exit 1 if alignment is needed',
		}),
		noInstall: flag({
			long: 'no-install',
			description: 'Write the compatibility set without installing; run pnpm install afterward',
		}),
	},
	handler: ({ check, noInstall }) => {
		try {
			const dir = runtime.cwd()
			const plan = planUpgrade(dir)
			console.log(`Xplat ${plan.version} compatibility set — workspace ${plan.root}`)
			for (const update of plan.updates) {
				console.log(`  ${update}`)
			}

			for (const skip of plan.skipped) {
				console.log(`  ${skip}`)
			}

			for (const file of plan.files) {
				console.log(`  update ${relative(plan.root, file.path)}`)
			}

			if (check) {
				console.log(
					plan.files.length
						? 'Alignment needed; no files changed.'
						: 'Managed pins and patches are aligned. Installed packages are checked by xplat doctor.',
				)

				runtime.exitCode = plan.files.length ? 1 : 0
				return
			}

			applyUpgrade(plan)
			if (noInstall) {
				console.log(
					'Compatibility files updated. Run pnpm install --no-frozen-lockfile, then pnpm xplat doctor.',
				)

				return
			}

			const install = spawnSync('pnpm', ['install', '--no-frozen-lockfile'], {
				shell: process.platform === 'win32',
				cwd: plan.root,
				stdio: 'inherit',
			})

			if (install.status !== 0) {
				throw new Error(
					'Compatibility files were updated, but pnpm install failed. Resolve the install error, then rerun pnpm install --no-frozen-lockfile and pnpm xplat doctor.',
				)
			}

			const issues = plan.projects.flatMap((project) =>
				inspectCompatibility(project)
					.filter((row) => !row.ok)
					.map((row) => `${relative(plan.root, project) || '.'}: ${row.name}: ${row.detail}`),
			)

			for (const patch of inspectPatches(plan.root)) {
				if (!['applied', 'not-declared', 'not-applicable'].includes(patch.state)) {
					issues.push(`${patch.specifier}: ${patchStateDetail(patch.state)}`)
				}
			}

			if (issues.length) {
				throw new Error(`Install completed with compatibility issues:\n${issues.join('\n')}`)
			}

			console.log(
				'Installed and checked the compatibility set. Run your app tests before shipping.',
			)
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error))
			runtime.exitCode = 1
		}
	},
})
