#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { binary, subcommands, run, command } from '@alloc/cmd-ts'
import { AGENT_HEADS, dispatchAgent } from './agent/dispatch.ts'
import { AGENT_COMMANDS } from './agent/commands.ts'
import { add } from './commands/add.ts'
import { dev } from './commands/dev.ts'
import { build } from './commands/build.ts'
import { typecheck } from './commands/typecheck.ts'
import { doctor } from './commands/doctor.ts'
import { clean } from './commands/clean.ts'
import { routes } from './commands/routes.ts'
import { patches } from './commands/patches.ts'
import { fonts } from './commands/fonts.ts'
import { updates } from './commands/updates.ts'
import { workshop } from './commands/workshop.ts'
import { runFmt } from './commands/fmt.ts'

// Agent-facing commands (catalog/status/app/capabilities/permissions/targets/
// docs/guidance/code) are dispatched before cmd-ts: their machine contract —
// versioned JSON envelope, stable error codes, exit groups — is
// descriptor-driven and must survive parse errors identically. The stubs keep
// them visible in `xplat --help`; their handlers are unreachable.
const agentStubs = Object.fromEntries(
	[...AGENT_HEADS].map((head) => [
		head,
		command({
			name: head,
			description:
				AGENT_COMMANDS.find((c) => c.path[0] === head)?.summary ??
				`${head} agent commands — run \`xplat ${head} --help\``,
			args: {},
			handler: () => {},
		}),
	]),
)

if (process.argv[2] && AGENT_HEADS.has(process.argv[2])) {
	process.exitCode = await dispatchAgent(process.argv.slice(2))
} else if (process.argv[2] === 'fmt') {
	// fmt dispatches ahead of cmd-ts like the agent commands: its exit-code
	// contract (0 clean, 1 check diff, 2 usage/transform/IO error) is a
	// machine interface editors rely on, and cmd-ts emits 1 for usage errors.
	process.exitCode = await runFmt(process.argv.slice(3))
} else {
	const cli = subcommands({
		name: 'xplat',
		description: 'One Octane codebase → web + iOS + Android + experimental macOS AppKit/WKWebView',
		cmds: {
			add,
			dev,
			build,
			typecheck,
			doctor,
			clean,
			routes,
			patches,
			fonts,
			updates,
			workshop,
			fmt: command({
				name: 'fmt',
				description:
					'Format JS/TS/JSX/TSX and .tsrx in place — run `xplat fmt --help`',
				args: {},
				handler: () => {},
			}),
			...agentStubs,
		},
	})

	await run(binary(cli), process.argv)
}
