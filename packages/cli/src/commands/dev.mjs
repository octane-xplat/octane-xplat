import { command, option, optional, string } from '@alloc/cmd-ts'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { discoverTargets } from '../targets.mjs'
import { spawnTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'
import { discoverMacOSNative } from '../macos/native.mjs'
import { fileURLToPath } from 'node:url'

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
				[fileURLToPath(new URL('../macos/dev-entry.mjs', import.meta.url)), cwd],
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

export const dev = command({
	name: 'dev',
	description:
		'Run web and NativeScript dev servers, plus an opt-in experimental macOS AppKit or WKWebView target',
	args: {
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
				'No targets found — declare Vite, NativeScript, xplat.targets.macos (AppKit or WKWebView), or xplat.targets.linux (WebKitGTK webview).',
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
			const n = await generateRoutes(cwd, routeDir)
			p.log.info(`routes.gen regenerated — ${n} route${n === 1 ? '' : 's'}`)
		}

		for (const t of chosen) {
			spawnFor(t, cwd)
		}

		p.log.success(`${chosen.length} target(s) running — Ctrl+C stops all`)
	},
})
