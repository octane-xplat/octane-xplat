#!/usr/bin/env node
import { binary, subcommands, run, command } from '@alloc/cmd-ts'
import { AGENT_HEADS, dispatchAgent } from './agent/dispatch.mjs'
import { AGENT_COMMANDS } from './agent/commands.mjs'
import { add } from './commands/add.mjs'
import { dev } from './commands/dev.mjs'
import { build } from './commands/build.mjs'
import { typecheck } from './commands/typecheck.mjs'
import { doctor } from './commands/doctor.mjs'
import { clean } from './commands/clean.mjs'
import { routes } from './commands/routes.mjs'
import { patches } from './commands/patches.mjs'
import { fonts } from './commands/fonts.mjs'
import { updates } from './commands/updates.mjs'
import { workshop } from './commands/workshop.mjs'

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
} else {
	const cli = subcommands({
		name: 'xplat',
		description:
			'One Octane codebase → web + iOS + Android + experimental macOS AppKit/WKWebView',
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
			...agentStubs,
		},
	})

	await run(binary(cli), process.argv)
}
