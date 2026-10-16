// Machine-readable command catalog — the discovery entry point an agent hits
// after `--help`. Every command descriptor doubles as its `--schema` output;
// the catalog adds the envelope, exit, selection, and boundary contracts.
import { PRODUCT_BOUNDARIES } from '../mcp/contracts/boundaries.mjs'
import { AGENT_COMMANDS, LEGACY_COMMANDS, PLANNED_COMMANDS } from './commands.mjs'
import { CONTRACT_VERSION, ERROR_EXIT, EXIT } from './envelope.mjs'
import { CLI_NAME, CLI_VERSION } from './identity.mjs'

export const SELECTION_PRECEDENCE = [
	'explicit session/job ids (positionals or --session/--job/--target on commands that take them)',
	'explicit app selection (--app)',
	'client/workspace preference (xplat app select, scoped by --client / XPLAT_AGENT_CLIENT)',
	'unique cwd discovery (sole app binds; several apps report candidates and refuse)',
]

const flagDoc = (f) => ({
	flag: `--${f.flag}`,
	type: f.type,
	...(f.values ? { values: f.values } : {}),
	...(f.default !== undefined ? { default: f.default } : {}),
	...(f.min !== undefined ? { min: f.min } : {}),
	...(f.max !== undefined ? { max: f.max } : {}),
	...(f.desc ? { description: f.desc } : {}),
})

/** The per-command schema `--schema` emits (also embedded in the catalog). */
export function commandSchema(command) {
	return {
		contractVersion: CONTRACT_VERSION,
		command: command.name,
		summary: command.summary,
		mcpTool: command.mcpTool,
		status: 'implemented',
		effect: command.effect,
		permissions: command.permissions,
		requiresBoundApp: command.context === 'app',
		input: {
			positionals: command.positionals.map((p) => ({
				name: p.name,
				required: p.required === true,
				...(p.min !== undefined ? { minLength: p.min } : {}),
				...(p.max !== undefined ? { maxLength: p.max } : {}),
				...(p.desc ? { description: p.desc } : {}),
			})),
			flags: command.flags.map(flagDoc),
		},
		output: command.output,
		errors: command.errors,
		supportedContractVersions: [CONTRACT_VERSION],
		examples: command.examples,
	}
}

export function catalogPayload() {
	return {
		contractVersion: CONTRACT_VERSION,
		cli: { name: CLI_NAME, version: CLI_VERSION },
		envelope: {
			shape: '{ contractVersion, ok, requestId, context?, data | error }',
			stdout: 'finite JSON in --json mode; human text otherwise — diagnostics always go to stderr',
			errorShape:
				'{ code, message, recovery?, retryable?, context? } — the shared service vocabulary',
		},
		exits: {
			[EXIT.ok]: 'completed (or accepted, once async work exists)',
			[EXIT.invalidInput]: 'invalid input or ambiguous selection',
			[EXIT.unavailable]: 'unavailable prerequisite or unsupported capability',
			[EXIT.permissionDenied]: 'permission denied',
			[EXIT.failed]: 'operation failed',
			[EXIT.disconnected]: 'disconnected or unknown outcome',
			[EXIT.timeout]: 'wait timeout',
			[EXIT.cancelled]: 'cancelled',
		},
		errorExit: ERROR_EXIT,
		selection: {
			precedence: SELECTION_PRECEDENCE,
			preference: 'node_modules/.cache/xplat/agent/<client>.json (never a global default)',
			conflicts: 'explicit conflicting selections fail rather than retargeting',
			prompts: 'machine mode never opens an interactive prompt',
		},
		commands: AGENT_COMMANDS.map(commandSchema),
		orchestration: LEGACY_COMMANDS.map((c) => ({ ...c, status: 'implemented' })),
		planned: PLANNED_COMMANDS,
		boundaries: PRODUCT_BOUNDARIES,
	}
}
