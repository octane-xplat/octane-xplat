// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { command, option, optional, positional, string } from '@alloc/cmd-ts'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { discoverTargets } from '../targets.ts'
import { spawnTagged } from '../procs.ts'
import { generateRoutes } from './routes.ts'
import { createRouteWatcher } from '../route-watch.ts'
import { discoverMacOSNative } from '../macos/native.ts'
import { fileURLToPath } from 'node:url'
import { siblingUrl } from '../env.ts'

const spawnFor = (t, cwd) => {
	if (t.kind === 'web') {
		return spawnTagged('web', 'pnpm', ['exec', 'vite'], cwd)
	}

	if (t.kind === 'macos') {
		const manifest = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
		if (manifest.xplat?.targets?.macos?.dev) {
			return spawnTagged(
				'macos',
				process.execPath,
				[fileURLToPath(siblingUrl(import.meta.url, '../macos/dev-entry')), cwd],
				cwd,
			)
		}

		if (discoverMacOSNative(cwd).leaves.length) {
			throw new Error(
				'Native macOS leaves require xplat.targets.macos.dev configuration; see the macOS native leaf guide',
			)
		}

		return spawnTagged('macos', 'pnpm', ['run', 'dev'], cwd)
	}

	if (t.kind === 'linux') {
		return spawnTagged('linux', 'pnpm', ['run', 'dev'], cwd)
	}

	if (t.kind === 'windows') {
		return spawnTagged('windows', 'pnpm', ['exec', 'ns', 'run', 'windows'], cwd)
	}

	return spawnTagged(t.kind, 'pnpm', ['exec', 'ns', 'run', t.kind, '--device', t.device], cwd)
}

/** Nearest enclosing Turborepo root that declares a `typegen` task. */
const typegenWorkspaceRoot = (dir) => {
	for (
		let current = dir, parent = dirname(current);
		;
		current = parent, parent = dirname(current)
	) {
		const turbo = join(current, 'turbo.json')
		if (existsSync(turbo) && /"typegen"\s*:/.test(readFileSync(turbo, 'utf8'))) {
			return current
		}

		if (parent === current) {
			return null
		}
	}
}

export const dev = command({
	name: 'dev',
	description:
		'Run web and NativeScript dev servers, plus an opt-in experimental macOS AppKit or WKWebView target',
	args: {
		target: positional({
			type: optional(string),
			displayName: 'target',
			description:
				'Single-target shorthand — a kind (web,macos,linux,windows) or a device target id',
		}),
		targets: option({
			long: 'targets',
			short: 't',
			type: optional(string),
			description: 'Comma list (web,ios,android,macos,linux) — skips the prompt',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const all = discoverTargets(cwd)
		if (all.length === 0) {
			p.log.error(
				'No targets found — declare Vite, NativeScript, xplat.targets.macos (AppKit or WKWebView), or xplat.targets.linux (WebKitGTK webview or GTK4/GJS).',
			)

			process.exit(1)
		}

		let chosen
		if (args.target && args.targets) {
			p.log.error('Pass either a positional target or --targets, not both.')
			process.exit(1)
		}

		if (args.target) {
			const matches = all.filter((t) => t.id === args.target || t.kind === args.target)
			if (matches.length === 0) {
				p.log.error(
					`No targets matched "${args.target}". Available: ${all.map((t) => `${t.kind} (${t.id})`).join(', ')}`,
				)

				process.exit(1)
			}

			if (matches.length > 1) {
				// A kind can match several device targets; a booted one is
				// almost always the intended single target.
				const booted = matches.filter((t) => t.booted)
				if (booted.length === 1) {
					chosen = booted
				} else {
					p.log.error(
						`"${args.target}" matched ${matches.length} targets: ${matches.map((t) => t.id).join(', ')} — pass a target id for one, or --targets ${args.target} for all`,
					)

					process.exit(1)
				}
			} else {
				chosen = matches
			}
		} else if (args.targets) {
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
		const routeWatcher = createRouteWatcher({
			cwd,
			generate: (signal, inputs) => generateRoutes(cwd, inputs.directory, inputs.out, { signal }),
			onGenerated(count) {
				if (count !== false) {
					p.log.info(`routes.gen regenerated — ${count} route${count === 1 ? '' : 's'}`)
				}
			},
			onError: (error) => p.log.error(String(error.message ?? error)),
		})
		const stopRoutes = () => {
			void routeWatcher.close()
		}
		const interrupt = () => {
			process.exitCode = 130
			stopRoutes()
		}
		const terminate = () => {
			process.exitCode = 143
			stopRoutes()
		}
		process.once('SIGINT', interrupt)
		process.once('SIGTERM', terminate)
		let n
		try {
			n = await routeWatcher.ready
		} catch (error) {
			if (error.name === 'AbortError') {
				return
			}

			throw error
		}
		if (n === false) {
			await routeWatcher.close()
			process.off('SIGINT', interrupt)
			process.off('SIGTERM', terminate)
		}

		// In a workspace that declares a typegen task (this framework repo),
		// keep package declarations hot alongside the targets — interactive
		// sessions only; automation gets the targets alone.
		if (process.stdout.isTTY) {
			const types = typegenWorkspaceRoot(cwd)
			if (types) {
				spawnTagged(
					'types',
					'pnpm',
					['exec', 'turbo', 'watch', 'typegen', '--continue', 'always'],
					types,
				)
			}
		}

		let runningTargets = chosen.length
		try {
			for (const t of chosen) {
				spawnFor(t, cwd).once('exit', () => {
					if (--runningTargets === 0) {
						stopRoutes()
						process.off('SIGINT', interrupt)
						process.off('SIGTERM', terminate)
					}
				})
			}
		} catch (error) {
			await routeWatcher.close()
			throw error
		}

		p.log.success(`${chosen.length} target(s) running — Ctrl+C stops all`)
	},
})
