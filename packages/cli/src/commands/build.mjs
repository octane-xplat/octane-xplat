import { command, flag, option, optional, string } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { buildTargets } from '../targets.mjs'
import { runTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'

export const build = command({
	name: 'build',
	description: 'Build for web, iOS, Android',
	args: {
		release: flag({
			long: 'release',
			description: 'Native release builds (signed where configured)',
		}),
		targets: option({
			long: 'targets',
			short: 't',
			type: optional(string),
			description: 'Comma list (web,ios,android) — skips the prompt',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const all = buildTargets(cwd)
		if (all.length === 0) {
			p.log.error('Nothing to build — no vite.config.ts or nativescript.config.ts found.')
			process.exit(1)
		}

		let chosen
		if (args.targets) {
			const kinds = args.targets.split(',').map((s) => s.trim())
			chosen = all.filter((t) => kinds.includes(t.kind))
		} else if (!process.stdout.isTTY) {
			chosen = all
		} else {
			p.intro('xplat build')
			const picked = await p.multiselect({
				message: 'Build targets',
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

		for (const t of chosen) {
			const argv =
				t.kind === 'web'
					? ['exec', 'vite', 'build']
					: ['exec', 'ns', 'build', t.kind, ...(args.release ? ['--release'] : [])]

			try {
				await runTagged(t.kind, 'pnpm', argv, cwd)
			} catch (e) {
				p.log.error(String(e))
				process.exit(1)
			}
		}

		p.log.success('Build complete')
	},
})
