// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Descriptor-driven argv parsing for agent commands. `--json`, `--schema`,
// and `--help` are intercepted before any validation so they work everywhere
// — including outside a project. Every parse failure is an explicit
// invalid_selection error (exit 2), never a stack or a partial run.
import { contractError } from '../mcp/contracts/errors.ts'

const isFlagToken = (token) => token.startsWith('-')

const fail = (message, options) => ({
	errors: [contractError('invalid_selection', message, options)],
})

export function parseArgs(command, argv) {
	const declared = new Map(command.flags.map((f) => [f.flag, f]))
	const values = {}
	const positionals = []
	let help = false

	const apply = (def, raw) => {
		if (def.type === 'boolean') {
			if (raw !== undefined) {
				return { error: `--${def.flag} takes no value` }
			}

			return { value: true }
		}

		if (raw === undefined) {
			return { error: `--${def.flag} expects a value` }
		}

		if (def.type === 'integer') {
			const num = Number(raw)
			if (!Number.isInteger(num)) {
				return { error: `--${def.flag} expects an integer, got "${raw}"` }
			}

			if (def.min !== undefined && num < def.min) {
				return { error: `--${def.flag} must be >= ${def.min}, got ${num}` }
			}

			if (def.max !== undefined && num > def.max) {
				return { error: `--${def.flag} must be <= ${def.max}, got ${num}` }
			}

			return { value: num }
		}

		if (def.type === 'enum') {
			if (!def.values.includes(raw)) {
				return { error: `--${def.flag} must be one of ${def.values.join(', ')} — got "${raw}"` }
			}

			return { value: raw }
		}

		return { value: raw }
	}

	for (let i = 0; i < argv.length; i++) {
		const token = argv[i]
		if (token === '--') {
			positionals.push(...argv.slice(i + 1))
			break
		}

		if (!isFlagToken(token)) {
			positionals.push(token)
			continue
		}

		const eq = token.indexOf('=')
		const name = (eq === -1 ? token : token.slice(0, eq)).replace(/^--?/, '')
		let raw = eq === -1 ? undefined : token.slice(eq + 1)

		if (name === 'help' || name === 'h') {
			help = true
			continue
		}

		const def = declared.get(name)
		if (!def) {
			return fail(`Unknown option --${name} for \`xplat ${command.name}\`.`, {
				recovery: {
					action: `Run \`xplat ${command.name} --help\` or \`--schema\` for its contract.`,
				},
			})
		}

		if (raw === undefined && def.type !== 'boolean') {
			const next = argv[i + 1]
			if (next === undefined || (isFlagToken(next) && next !== '-')) {
				return fail(`--${name} expects a value.`)
			}

			raw = next
			i++
		}

		const { value, error } = apply(def, raw)
		if (error) {
			return fail(error)
		}

		values[def.key ?? def.flag] = value
	}

	// Descriptor defaults.
	for (const def of command.flags) {
		const key = def.key ?? def.flag
		if (values[key] === undefined && def.default !== undefined) {
			values[key] = def.default
		}
	}

	const expected = command.positionals
	if (positionals.length < expected.filter((p) => p.required).length) {
		const missing = expected.filter((p) => p.required).map((p) => `<${p.name}>`)[0]
		return fail(`Missing required argument ${missing} for \`xplat ${command.name}\`.`, {
			recovery: { action: `Run \`xplat ${command.name} --help\` for usage.` },
		})
	}

	if (positionals.length > expected.length) {
		return fail(
			`Unexpected argument "${positionals[expected.length]}" for \`xplat ${command.name}\`.`,
			{
				recovery: { action: `Run \`xplat ${command.name} --help\` for usage.` },
			},
		)
	}

	for (let i = 0; i < expected.length; i++) {
		const def = expected[i]
		const value = positionals[i]
		if (def.min !== undefined && value.length < def.min) {
			return fail(`<${def.name}> must be at least ${def.min} character(s).`)
		}

		if (def.max !== undefined && value.length > def.max) {
			return fail(`<${def.name}> must be at most ${def.max} characters.`)
		}

		values[def.name] = value
	}

	return { values, help }
}
