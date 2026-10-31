// CLI for the icon-registry codegen. Usage:
//   xplat-icons register [--root <dir>] [--out <file>] [--include <path>,...] [--inline]
import path from 'node:path'
import process from 'node:process'

import { emitIconRegistry } from './index'

function parseArgs(argv: string[]): Map<string, string | true> {
	const args = new Map<string, string | true>()
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]!
		if (arg.startsWith('--')) {
			const next = argv[i + 1]
			if (next !== undefined && !next.startsWith('--')) {
				args.set(arg.slice(2), next)
				i++
			} else {
				args.set(arg.slice(2), true)
			}
		}
	}

	return args
}

async function main() {
	const [, , command, ...rest] = process.argv
	if (command !== 'register') {
		console.error(
			'Usage: xplat-icons register [--root <dir>] [--out <file>] [--include <path>,...] [--inline]\n\n' +
				'Scans app sources for `icons:<prefix>/<name>` imports and emits one addIcons\n' +
				'module (default src/icons.gen.ts) so every imported icon also resolves by\n' +
				'name=. Re-run when imports change; import the emitted file once at startup.',
		)

		process.exit(command === 'register' || command === undefined ? 0 : 2)
	}

	const args = parseArgs(rest)
	const result = await emitIconRegistry({
		root: path.resolve(process.cwd(), String(args.get('root') ?? '.')),
		out: typeof args.get('out') === 'string' ? String(args.get('out')) : undefined,
		include:
			typeof args.get('include') === 'string'
				? String(args.get('include'))
						.split(',')
						.map((entry) => entry.trim())
						.filter(Boolean)
				: undefined,
		inline: args.has('inline'),
	})

	console.log(
		`${result.unchanged ? 'unchanged' : 'wrote'} ${result.file} — ${result.icons.length} icon(s) registered`,
	)
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err)
	process.exit(1)
})
