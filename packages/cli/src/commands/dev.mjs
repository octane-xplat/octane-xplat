import { command, option, optional, string } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { discoverTargets } from '../targets.mjs'
import { spawnTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'

const spawnFor = (t, cwd) =>
	t.kind === 'web'
		? spawnTagged('web', 'pnpm', ['exec', 'vite'], cwd)
		: spawnTagged(t.kind, 'pnpm', ['exec', 'ns', 'run', t.kind, '--device', t.device], cwd)

export const dev = command({
	name: 'dev',
	description: 'Run dev servers — web, iOS simulators, Android emulators/devices',
	args: {
		targets: option({
			long: 'targets',
			short: 't',
			type: optional(string),
			description: 'Comma list (web,ios,android) — skips the prompt',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const all = discoverTargets(cwd)
		if (all.length === 0) {
			p.log.error(
				'No targets found — need vite.config.ts (web) or nativescript.config.ts (native).',
			)
			process.exit(1)
		}

		let chosen
		if (args.targets) {
			const kinds = args.targets.split(',').map((s) => s.trim())
			chosen = all.filter((t) => kinds.includes(t.kind))
			if (chosen.length === 0) {
				p.log.error(
					`No targets matched "${args.targets}". Available: ${all.map((t) => t.kind).join(', ')}`,
				)
				process.exit(1)
			}
		} else if (!process.stdout.isTTY) {
			chosen = all // non-interactive: everything detected
		} else {
			p.intro('xplat dev')
			const picked = await p.multiselect({
				message: 'Dev targets',
				options: all.map((t) => ({ value: t.id, label: t.name })),
				initialValues: all.map((t) => t.id),
				required: true,
			})

			if (p.isCancel(picked)) {
				p.cancel('Cancelled')
				process.exit(0)
			}
			chosen = all.filter((t) => picked.includes(t.id))
		}

		// Route codegen is automatic when a route dir exists — the generated
		// manifest is committed like a lockfile; a stale one is a silent bug.
		const routeDir = ['app', 'src/app'].find((d) => existsSync(join(cwd, d)))
		if (routeDir) {
			const n = generateRoutes(cwd, routeDir)
			p.log.info(`routes.gen regenerated — ${n} route${n === 1 ? '' : 's'}`)
		}

		for (const t of chosen) spawnFor(t, cwd)
		p.log.success(`${chosen.length} target(s) running — Ctrl+C stops all`)
	},
})
