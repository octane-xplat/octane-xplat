import { command, flag, restPositionals, string } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import * as p from '@clack/prompts'
import {
	applyTarget,
	selectableTargets,
	targetEnabled,
	targets,
} from 'create-octane-xplat/scaffold'

export const add = command({
	name: 'add',
	description:
		'Enable a platform skipped at create time — copies its files, merges its deps/scripts into package.json, then installs',
	args: {
		platforms: restPositionals({
			type: string,
			displayName: 'platform',
			description: `Targets to enable: ${selectableTargets.join(', ')}`,
		}),
		noInstall: flag({
			long: 'no-install',
			description: 'Apply file and manifest changes without running pnpm install',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		if (!existsSync(join(cwd, 'package.json'))) {
			p.log.error('No package.json here — run `xplat add` inside an app')
			process.exit(1)
		}

		let ids = args.platforms
		for (const id of ids) {
			if (!selectableTargets.includes(id)) {
				p.log.error(`unknown target "${id}" — expected one of: ${selectableTargets.join(', ')}`)

				process.exit(1)
			}
		}

		if (ids.length === 0) {
			if (!process.stdout.isTTY) {
				p.log.error(`usage: xplat add <${selectableTargets.join('|')}> [...]`)
				process.exit(1)
			}

			const remaining = selectableTargets.filter((id) => !targetEnabled(cwd, id))
			if (remaining.length === 0) {
				p.log.success('All platforms already enabled')
				return
			}

			p.intro('xplat add')
			const picked = await p.multiselect({
				message: 'Platforms to enable',
				options: remaining.map((id) => ({
					value: id,
					label: targets[id].label,
					hint: targets[id].note,
				})),
				required: true,
			})

			if (p.isCancel(picked)) {
				p.cancel('Cancelled')
				process.exit(0)
			}

			ids = picked
		}

		let anyEnabled = false
		for (const id of ids) {
			const report = applyTarget(cwd, id)
			if (report.already.includes(id)) {
				p.log.info(`${id} is already enabled`)
				continue
			}

			anyEnabled = true
			const visible = report.enabled.filter((t) => !targets[t].hidden)
			p.log.success(
				`enabled ${visible.join(', ')}` +
					(report.enabled.some((t) => targets[t].hidden) ? ' (+ shared NativeScript setup)' : ''),
			)

			for (const name of report.scriptsSkipped) {
				p.log.warn(`script "${name}" exists with a different command — keeping yours`)
			}

			for (const rel of report.skipped) {
				p.log.warn(`${rel} already exists — skipped`)
			}

			if (targets[id].note) {
				p.log.info(targets[id].note)
			}
		}

		if (!anyEnabled) {
			return
		}

		if (args.noInstall) {
			p.log.info('Skipped install — run `pnpm install` to fetch the new deps')
			return
		}

		// add rewrites deps and patchedDependencies — the lockfile must update,
		// so frozen installs (the default under CI) have to be opted out of.
		const install = spawnSync('pnpm', ['install', '--no-frozen-lockfile'], {
			cwd,
			stdio: 'inherit',
		})

		if (install.status !== 0) {
			p.log.error('pnpm install failed — run it manually to finish enabling the target')
			process.exit(install.status ?? 1)
		}

		p.log.success('installed — `pnpm xplat dev` lists the new target')
	},
})
