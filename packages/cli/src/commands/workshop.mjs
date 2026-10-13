// `xplat workshop …` — delegates to the consumer's installed
// @octane-xplat/workshop so the CLI carries no workshop implementation.
import { command, flag, option, optional, string, subcommands } from '@alloc/cmd-ts'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'
import * as p from '@clack/prompts'

async function loadWorkshop(cwd) {
	if (!existsSync(join(cwd, 'package.json'))) {
		p.log.error('No package.json here — run `xplat workshop` inside an app')
		process.exit(1)
	}

	try {
		const req = createRequire(join(cwd, 'package.json'))
		return await import(pathToFileURL(realpathSync(req.resolve('@octane-xplat/workshop/node'))).href)
	} catch {
		p.log.error(
			'@octane-xplat/workshop is not installed — add it with `pnpm add -D @octane-xplat/workshop`',
		)

		process.exit(1)
	}
}

const fail = (error) => {
	if (error?.name === 'WorkshopUsageError') {
		p.log.error(error.message)
		process.exit(1)
	}

	throw error
}

const init = command({
	name: 'init',
	description: 'Propose a workshop config, an example story and a package script — idempotent',
	args: {
		noScripts: flag({ long: 'no-scripts', description: 'Do not add a package.json script' }),
	},
	handler: async (args) => {
		const api = await loadWorkshop(process.cwd())
		await api.workshopInit({ cwd: process.cwd(), scripts: !args.noScripts }).catch(fail)
	},
})

const doctor = command({
	name: 'doctor',
	description: 'Report per-target workshop availability on this machine',
	args: {
		json: flag({ long: 'json', description: 'Emit the report as JSON' }),
	},
	handler: async (args) => {
		const api = await loadWorkshop(process.cwd())
		await api.workshopDoctor({ cwd: process.cwd(), json: args.json }).catch(fail)
	},
})

const list = command({
	name: 'list',
	description: 'List discovered stories: stable id, title, targets, capabilities',
	args: {
		target: option({
			long: 'target',
			type: optional(string),
			description: 'Filter applicability for a target (default web)',
		}),
		json: flag({ long: 'json', description: 'Emit the catalog as JSON' }),
	},
	handler: async (args) => {
		const api = await loadWorkshop(process.cwd())
		await api
			.workshopList({ cwd: process.cwd(), target: args.target ?? 'web', json: args.json })
			.catch(fail)
	},
})

const dev = command({
	name: 'dev',
	description: 'Launch the workshop dev server for one target',
	args: {
		target: option({
			long: 'target',
			type: optional(string),
			description: 'Launch target — web in this release (default web)',
		}),
		story: option({
			long: 'story',
			type: optional(string),
			description: 'Stable story id to select at boot',
		}),
		port: option({
			long: 'port',
			type: optional(string),
			description: 'Dev server port (auto when omitted)',
		}),
	},
	handler: async (args) => {
		const api = await loadWorkshop(process.cwd())
		const port = args.port === undefined ? undefined : Number(args.port)
		if (port !== undefined && !Number.isInteger(port)) {
			p.log.error(`--port expects an integer, got "${args.port}"`)
			process.exit(1)
		}

		await api
			.workshopDev({
				cwd: process.cwd(),
				target: args.target ?? 'web',
				story: args.story,
				port,
			})
			.catch(fail)
	},
})

export const workshop = subcommands({
	name: 'workshop',
	description: 'Component workshop — isolated story development (web preview)',
	cmds: { init, doctor, list, dev },
})
