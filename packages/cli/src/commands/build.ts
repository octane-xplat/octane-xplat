// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { command, flag, option, optional, string } from '@alloc/cmd-ts'
import * as p from '@clack/prompts'
import { buildTargets } from '../targets.ts'
import { packageMacOS } from '../macos/package.ts'
import { packageLinux } from '../linux/package.ts'
import { runTagged } from '../procs.ts'
import { generateRoutes } from './routes.ts'

export const build = command({
	name: 'build',
	description:
		'Build web and NativeScript targets, plus experimental macOS AppKit/WKWebView and Linux (WebKitGTK or GTK4/GJS)',
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
			// cmd-ts drops empty argv strings; preserve explicit option presence
			// so both --targets '' and a bare --targets fail validation below.
			implicitValue: '',
			description: 'Comma list (web,ios,android,macos,linux) — every requested kind must be declared',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const all = buildTargets(cwd)
		if (all.length === 0 && args.targets === undefined) {
			p.log.error(
				'Nothing to build — no web, NativeScript, macOS AppKit/WKWebView, or Linux target is declared.',
			)

			process.exit(1)
		}

		let chosen
		if (args.targets !== undefined) {
			const kinds = args.targets.split(',').map((s) => s.trim())
			const available = new Set(all.map((target) => target.kind))
			const invalid = [...new Set(kinds.filter((kind) => !available.has(kind)))]
			if (invalid.length > 0) {
				p.log.error(
					`Unavailable build target(s): ${invalid.map((kind) => kind || '<empty>').join(', ')}. Available: ${[...available].join(', ') || '(none)'}`,
				)

				process.exit(1)
			}

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
		const n = await generateRoutes(cwd)
		if (n !== false) {
			p.log.info(`routes.gen regenerated — ${n} route${n === 1 ? '' : 's'}`)
		}

		for (const t of chosen) {
			try {
				if (t.kind === 'macos') {
					await packageMacOS(cwd)
				} else if (t.kind === 'linux') {
					await packageLinux(cwd)
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
