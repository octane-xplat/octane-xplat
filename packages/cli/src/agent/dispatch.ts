// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Agent command dispatch: descriptor-driven parse → context → service call →
// envelope/human output. Registered heads bypass cmd-ts so every syntax and
// selection error lands in the same contract envelope with the same exits.
import { contractError } from '../mcp/contracts/errors.ts'
import { AGENT_COMMANDS, findCommand } from './commands.ts'
import { commandSchema } from './catalog.ts'
import { agentContext, envelopeContext } from './context.ts'
import { diagnose, emitJson, EXIT, exitForError, resultFail, resultOk } from './envelope.ts'

import { handlers } from './handlers.ts'
import { renderHuman, renderHumanError } from './human.ts'
import { parseArgs } from './parse.ts'

export const AGENT_HEADS = new Set(AGENT_COMMANDS.map((c) => c.path[0]))

const wantsJson = (argv) => argv.includes('--json')

const groups = () => {
	const map = new Map()
	for (const command of AGENT_COMMANDS) {
		if (command.path.length > 1) {
			map.set(command.path[0], [...(map.get(command.path[0]) ?? []), command])
		}
	}

	return map
}

function helpText(command) {
	const out = [`xplat ${command.name} — ${command.summary}`, '']
	const usage = [`xplat ${command.name}`]
	for (const p of command.positionals) {
		usage.push(p.required ? `<${p.name}>` : `[${p.name}]`)
	}

	usage.push('[options]')
	out.push(`Usage: ${usage.join(' ')}`, '')
	out.push(`Effect: ${command.effect}`)
	out.push(`Required scopes: ${command.permissions.join(', ') || 'none'}`)
	out.push(
		`Context: ${command.context === 'app' ? 'bound app' : command.context === 'workspace' ? 'workspace' : 'no project required'}`,
	)
	out.push(`Result: ${command.output.description}`, '')
	if (command.name === 'catalog') {
		out.push(
			'Discovery:',
			'  commands: agent commands with flags, effects, permissions, output kinds, and errors.',
			'  orchestration: other implemented commands; use their --help for exact syntax.',
			'  planned: advertised future commands, not executable commands.',
			'  The catalog describes this CLI version; it does not inspect live app readiness.',
			'  Use `xplat status --json`, `xplat capabilities --json`, and `xplat targets --json` for that.',
			'',
		)
	}
	if (command.positionals.length) {
		out.push('Arguments:')
		for (const p of command.positionals) {
			out.push(`  <${p.name}>  ${p.desc ?? ''}`)
		}

		out.push('')
	}

	out.push('Options:')
	for (const f of command.flags) {
		const meta =
			f.type === 'enum'
				? ` <${f.values.join('|')}>`
				: f.type === 'boolean'
					? ''
					: ` <${f.type === 'integer' ? 'int' : 'value'}>`

		const constraints = [
			f.default !== undefined ? `default: ${f.default}` : null,
			f.min !== undefined ? `min: ${f.min}` : null,
			f.max !== undefined ? `max: ${f.max}` : null,
		].filter(Boolean)

		out.push(
			`  --${f.flag}${meta}  ${f.desc ?? ''}${constraints.length ? ` (${constraints.join(', ')})` : ''}`,
		)
	}

	out.push('  --help  Show this help')
	if (command.examples?.length) {
		out.push('', 'Examples:')
		for (const ex of command.examples) {
			out.push(`  ${ex}`)
		}
	}

	out.push(
		'',
		`Run \`xplat ${command.name} --schema\` for the machine-readable contract without executing the command.`,
	)
	if (command.mcpTool) {
		out.push('', `MCP tool equivalent: ${command.mcpTool}`)
	}

	return out.join('\n')
}

function groupHelp(head, members) {
	const out = [`xplat ${head} — command group`, '', 'Commands:']
	for (const c of members) {
		out.push(`  ${c.name.padEnd(16)} ${c.summary}`)
	}

	out.push('', `Run \`xplat ${head} <command> --help\` or \`--schema\` for a command's contract.`)
	return out.join('\n')
}

const finish = (command, result, context, json, platform) => {
	const ctx = envelopeContext({ command: command.name, context, platform })
	const envelope = result.ok
		? resultOk(result.data, { context: ctx })
		: resultFail(result.error, { context: ctx })

	if (json) {
		emitJson(envelope)
	} else if (result.ok) {
		process.stdout.write(`${renderHuman(command, result)}\n`)
	} else {
		diagnose(renderHumanError(command, result.error))
	}

	return result.ok ? EXIT.ok : exitForError(result.error)
}

const finishError = (command, error, json) => {
	if (json) {
		emitJson(resultFail(error, { context: { command: command.name, projectId: null } }))
	} else {
		diagnose(renderHumanError(command, error))
	}

	return exitForError(error)
}

const permissionScopes = () =>
	(process.env.XPLAT_PERMISSIONS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)

/** argv = the tokens after `xplat`. Returns the process exit code. */
export async function dispatchAgent(argv) {
	const head = argv[0]
	const groupMembers = groups().get(head)
	const rest = argv.slice(1)

	// Group heads: `xplat docs`, `xplat code`, `xplat app`.
	if (groupMembers) {
		const sub = rest[0]
		if (!sub || sub === '--help' || sub === '-h') {
			if (wantsJson(rest)) {
				return finishError(
					{ name: head },
					contractError('invalid_selection', `\`xplat ${head}\` needs a subcommand.`, {
						recovery: {
							action: `Commands: ${groupMembers.map((c) => c.name).join(', ')}.`,
						},
					}),
					true,
				)
			}

			process.stdout.write(`${groupHelp(head, groupMembers)}\n`)
			return EXIT.ok
		}

		if (sub === '--schema') {
			emitJson(
				resultOk(
					{ commands: groupMembers.map(commandSchema) },
					{ context: { command: head, projectId: null } },
				),
			)

			return EXIT.ok
		}
	}

	const path = groupMembers ? [head, rest[0]] : [head]
	const command = findCommand(path)
	const args = groupMembers ? rest.slice(1) : rest

	if (!command) {
		const attempted = path.join(' ')
		return finishError(
			{ name: attempted },
			contractError('invalid_selection', `Unknown command \`xplat ${attempted}\`.`, {
				recovery: {
					action: `Run \`xplat catalog --json\` for the machine-readable command list, or \`xplat ${head} --help\`.`,
				},
			}),
			wantsJson(argv),
		)
	}

	if (args.includes('--schema')) {
		emitJson(
			resultOk(commandSchema(command), {
				context: { command: command.name, projectId: null },
			}),
		)

		return EXIT.ok
	}

	const parsed = parseArgs(command, args)
	if (parsed.errors) {
		return finishError(command, parsed.errors[0], wantsJson(args))
	}

	if (parsed.help) {
		process.stdout.write(`${helpText(command)}\n`)
		return EXIT.ok
	}

	const { values } = parsed

	let ctx = null
	let client = values.client
	const grants = permissionScopes()
	if (command.context !== 'none') {
		try {
			const assembled = agentContext({
				project: values.project,
				app: values.app,
				client: values.client,
				permissionScopes: grants,
			})

			ctx = assembled.context
			client = assembled.client
		} catch (error) {
			return finishError(
				command,
				contractError('execution_failure', `Workspace discovery failed: ${error.message}`),
				values.json,
			)
		}
	}

	let result
	try {
		result = await handlers[command.name](
			{ context: ctx, workspaceRoot: ctx?.workspaceRoot, client, grants },
			values,
		)
	} catch (error) {
		result = {
			ok: false,
			error: contractError('execution_failure', error.message ?? 'Unknown failure'),
		}
	}

	return finish(command, result, ctx, values.json, values.platform)
}
