import { command, flag, option, optional, string } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { buildTargets } from '../targets.mjs'
import { packageMacOS } from '../macos/package.mjs'
import { runTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'

export const build = command({
	name: 'build',
	description: 'Build web and NativeScript targets, plus experimental macOS AppKit',
	args: {
		release: flag({
			long: 'release',
			description:
				'NativeScript release builds (signed where configured); macOS signing uses environment variables',
		}),
		targets: option({
			long: 'targets',
			short: 't',
			type: optional(string),
			description: 'Comma list (web,ios,android,macos) — skips the prompt',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const all = buildTargets(cwd)
		if (all.length === 0) {
			p.log.error('Nothing to build — no web, NativeScript, or AppKit Node-API target is declared.')
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
			try {
				if (t.kind === 'macos') {
					await packageMacOS(cwd)
				} else {
					const argv =
						t.kind === 'web'
							? ['exec', 'vite', 'build']
							: ['exec', 'ns', 'build', t.kind, ...(args.release ? ['--release'] : [])]

					await runTagged(t.kind, 'pnpm', argv, cwd)
				}
			} catch (e) {
				p.log.error(String(e))
				process.exit(1)
			}
		}

		p.log.success('Build complete')
	},
})
