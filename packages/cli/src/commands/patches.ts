// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { command, flag, option, optional, string, subcommands } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as p from '@clack/prompts'
import { applyPatches, inspectPatches, patchStateDetail } from '../patches.ts'
import { packageManagerFor } from '../package-manager.ts'

const dirArg = {
	packageManager: option({
		type: optional(string),
		long: 'package-manager',
		description: 'bun or pnpm (default: detect from project metadata)',
	}),
	dir: option({
		type: optional(string),
		long: 'dir',
		description: 'app root (default: cwd)',
	}),
}

const apply = command({
	name: 'apply',
	description: 'Copy and register framework patches for this Bun or pnpm project',
	args: {
		...dirArg,
		force: flag({
			long: 'force',
			description: 'overwrite patch files and config entries that differ from the framework copies',
		}),
	},
	handler: async ({ dir, force, packageManager }) => {
		const appDir = resolve(dir ?? '.')
		p.intro('xplat patches apply')
		if (!existsSync(join(appDir, 'package.json'))) {
			p.cancel(`no package.json in ${appDir} — pass --dir <app root>`)
			process.exitCode = 1
			return
		}

		const report = applyPatches(appDir, { force, packageManager })
		if (report.error) {
			p.cancel(report.error)
			process.exitCode = 1
			return
		}

		for (const patch of report.copied) {
			p.log.success(`${patch.specifier} — wrote patches/${patch.file}`)
		}

		for (const patch of report.kept) {
			p.log.info(`${patch.specifier} — already identical`)
		}

		for (const patch of report.skipped) {
			p.log.info(`${patch.specifier} — skipped (${patch.reason})`)
		}

		for (const patch of report.conflicts) {
			p.log.warn(`${patch.specifier} — ${patch.reason}`)
		}

		if (report.conflicts.length) {
			p.outro('conflicts above — rerun with --force to take the framework copies')
			process.exitCode = 1
		} else if (report.copied.length) {
			p.outro(`run \`${packageManagerFor(appDir, packageManager)} install\` to apply`)
		} else {
			p.outro('patch set already applied')
		}
	},
})

const check = command({
	name: 'check',
	description:
		'Verify this app has the framework patch set registered, applied, and identical to the shipped copies',
	args: { ...dirArg },
	handler: async ({ dir, packageManager }) => {
		const appDir = resolve(dir ?? '.')
		p.intro('xplat patches check')
		if (!existsSync(join(appDir, 'package.json'))) {
			p.cancel(`no package.json in ${appDir} — pass --dir <app root>`)
			process.exitCode = 1
			return
		}

		let bad = 0
		for (const row of inspectPatches(appDir, { packageManager })) {
			if (row.state === 'not-declared' || row.state === 'not-applicable') {
				continue
			}

			if (row.state === 'applied') {
				p.log.success(`${row.specifier} — applied`)
			} else {
				bad++
				const hint =
					row.state === 'not-installed'
						? `run \`${packageManagerFor(appDir, packageManager)} install\``
						: 'run `xplat patches apply`'

				p.log.warn(`${row.specifier} — ${patchStateDetail(row.state)} (${hint})`)
			}
		}

		if (bad) {
			process.exitCode = 1
		}

		p.outro(bad ? `${bad} patch(es) need attention` : 'patch set applied')
	},
})

export const patches = subcommands({
	name: 'patches',
	description: 'Manage the framework patch set (Bun and pnpm patchedDependencies)',
	cmds: { apply, check },
})
