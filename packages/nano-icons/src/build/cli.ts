// CLI for the nano-icons font build. Usage:
//   nano-icons build [--config <dir>] [--input <dir>] [--out <dir>]
//                    [--family <name>] [--web] [--app-fonts <dir>]
// The default config file is .nanoicons.json in the working directory.
import path from 'node:path'
import process from 'node:process'

import { buildAllNanoIconFonts, buildNanoIconFont, loadNanoIconsConfig } from './index'
import type { NanoLogger } from './core/types'

const logger: NanoLogger = {
	start: (m) => console.log(`· ${m}`),
	update: (m) => console.log(`· ${m}`),
	succeed: (m) => console.log(`✔ ${m}`),
	fail: (m) => console.error(`✖ ${m}`),
	info: (m) => console.log(`  ${m}`),
	warn: (m) => console.warn(`  ⚠ ${m}`),
}

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
	if (command !== 'build') {
		console.error(
			'Usage: nano-icons build [--config <dir>] [--input <dir>] [--out <dir>]\n' +
				'              [--family <name>] [--web] [--app-fonts <dir>]\n\n' +
				'With no flags, reads .nanoicons.json in the working directory:\n' +
				'  { "iconSets": [{ "inputDir": "assets/icons", "fontFamily": "MyIcons",\n' +
				'                   "outputDir": "src/generated/icons", "appFontsDir": "app/fonts" }] }',
		)

		process.exit(command === 'build' || command === undefined ? 0 : 2)
	}

	const args = parseArgs(rest)
	const cwd = process.cwd()

	if (args.has('input')) {
		const result = await buildNanoIconFont({
			inputDir: path.resolve(cwd, String(args.get('input'))),
			outputDir: path.resolve(cwd, String(args.get('out') ?? 'nano-icons')),
			fontFamily: typeof args.get('family') === 'string' ? String(args.get('family')) : undefined,
			web: args.has('web'),
			appFontsDir:
				typeof args.get('app-fonts') === 'string'
					? path.resolve(cwd, String(args.get('app-fonts')))
					: undefined,
			logger,
		})

		reportSkipped(result.skipped)
		return
	}

	const configRoot = path.resolve(cwd, String(args.get('config') ?? '.'))
	const results = await buildAllNanoIconFonts(loadNanoIconsConfig(configRoot), configRoot, logger)

	for (const result of results) {
		reportSkipped(result.skipped)
	}
}

function reportSkipped(skipped: { file: string; reason: string }[]) {
	if (!skipped.length) {
		return
	}

	console.warn(`⚠ ${skipped.length} icon(s) produced no glyphs and are not in the font:`)
	for (const { file, reason } of skipped) {
		console.warn(`    ${file} — ${reason}`)
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err)
	process.exit(1)
})
